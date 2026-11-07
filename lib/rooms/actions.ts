"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAdmin, requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type BookingDoc, type RoomDoc } from "@/lib/firebase/collections";
import { logActivity } from "@/lib/admin/activity";
import { sendSafely } from "@/lib/email/resend";
import { bookingCanceledByStaffEmail, bookingConfirmedEmail } from "@/lib/email/room-templates";
import { DEFAULT_ROOMS, bookerFor, listRooms } from "@/lib/rooms/rooms";
import {
  BLOCK_MAX_MINUTES,
  ROOM_RULES,
  SLOT_MS,
  addDays,
  centralDay,
  currentSlotStart,
  dayLabel,
  dayStartIso,
  lengthLabel,
  slotKeys,
  timeLabel,
  weekKey,
  windowOf,
  BOOKING_WINDOW,
  isBookableWeekday,
} from "@/lib/rooms/rules";
import { CONTACT_EMAIL } from "@/lib/site";

/*
  BOOKING A ROOM — the writes. The rules are in ./rules.ts; THIS is where
  they're enforced, because the page is only a convenience.

  NO DOUBLE BOOKING, BY CONSTRUCTION. Every 30-minute slot a booking takes
  is a doc, `roomSlots/{roomId}_{slotIso}`, created in the same transaction
  as the booking. Two members booking the same slot at the same moment:
  one transaction creates the slot doc, the other finds it and fails. A
  query for "overlapping bookings" can't promise that — a transaction
  can't lock a document that doesn't exist yet, but it can see that one does.

  THE WEEKLY CAP the same way: `roomWeeks/{memberId}_{sunday}` holds the
  slots a member has that week, read and written in the transaction — the
  4 hours, and no booking two rooms at once.

  The member is always the SESSION's (requireMember + their members doc),
  never an id from the form.
*/

export interface RoomResult {
  ok: boolean;
  message: string;
}

const slotRef = (roomId: string, slot: string) => getAdminDb().collection(COLLECTIONS.roomSlots).doc(`${roomId}_${slot}`);
const weekRef = (memberId: string, week: string) => getAdminDb().collection(COLLECTIONS.roomWeeks).doc(`${memberId}_${week}`);

function refresh() {
  revalidatePath("/portal/rooms");
  revalidatePath("/portal/admin/rooms");
}

/** First save in the admin writes the placeholder rooms down, so their ids are real. */
async function ensureRooms() {
  const { saved } = await listRooms();
  if (saved) return;
  const batch = getAdminDb().batch();
  for (const { id, ...room } of DEFAULT_ROOMS) batch.set(getAdminDb().collection(COLLECTIONS.rooms).doc(id), room);
  await batch.commit();
}

// ─── A member books ──────────────────────────────────────────────────────────

const bookSchema = z.object({
  roomId: z.string().min(1).max(80),
  start: z.iso.datetime(),
  minutes: z.number().int().refine((m) => m % ROOM_RULES.stepMinutes === 0 && m >= ROOM_RULES.stepMinutes && m <= ROOM_RULES.maxMinutes, "Pick a length."),
  note: z.string().trim().max(200).default(""),
});

export async function bookRoom(input: z.input<typeof bookSchema>): Promise<RoomResult> {
  const user = await requireMember();
  // A current member, or staff booking as themselves (lib/rooms/rooms.ts).
  const me = await bookerFor(user);
  if (!me) return { ok: false, message: "Booking a room is for current members." };

  const parsed = bookSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the booking and try again." };
  const { roomId, minutes, note } = parsed.data;
  const start = Date.parse(parsed.data.start);
  const end = start + minutes * 60_000;
  const now = Date.now();

  if (start % SLOT_MS !== 0) return { ok: false, message: "Bookings start on the hour or the half hour." };
  if (start < currentSlotStart(now) || end <= now) return { ok: false, message: "That time has passed. Pick a later one." };
  const bookingDay = centralDay(new Date(start));
  if (!isBookableWeekday(bookingDay)) return { ok: false, message: `Rooms can be booked ${BOOKING_WINDOW.daysLabel}. For a weekend, email ${CONTACT_EMAIL}.` };
  const lastDay = addDays(centralDay(new Date(now)), ROOM_RULES.daysAhead - 1);
  if (start >= Date.parse(dayStartIso(addDays(lastDay, 1)))) return { ok: false, message: `Rooms can be booked up to ${ROOM_RULES.daysAhead} days ahead.` };

  const window = windowOf(centralDay(new Date(start)));
  if (start < window.from || end > window.to) {
    return { ok: false, message: `Rooms can be booked ${BOOKING_WINDOW.label}. For another time, email ${CONTACT_EMAIL}.` };
  }

  const { rooms } = await listRooms();
  const room = rooms.find((r) => r.id === roomId && r.active);
  if (!room) return { ok: false, message: "That room isn't available to book." };

  const slots = slotKeys(new Date(start).toISOString(), minutes);
  // A booking can cross into next week at Sunday midnight: each slot counts toward its own week.
  const byWeek = new Map<string, string[]>();
  for (const s of slots) byWeek.set(weekKey(s), [...(byWeek.get(weekKey(s)) ?? []), s]);

  const db = getAdminDb();
  const bookingRef = db.collection(COLLECTIONS.bookings).doc();
  try {
    await db.runTransaction(async (tx) => {
      const taken = await tx.getAll(...slots.map((s) => slotRef(roomId, s)));
      if (taken.some((t) => t.exists)) throw new Error("Someone just booked part of that time. Pick another.");
      const weeks = [...byWeek.keys()];
      const weekSnaps = await tx.getAll(...weeks.map((w) => weekRef(me.id, w)));
      weekSnaps.forEach((snap, i) => {
        const held: string[] = (snap.data()?.slots as string[] | undefined) ?? [];
        const adding = byWeek.get(weeks[i])!;
        if (adding.some((s) => held.includes(s))) throw new Error("You already have a room booked at that time.");
        const minutesThen = (held.length + adding.length) * ROOM_RULES.stepMinutes;
        if (minutesThen > ROOM_RULES.weeklyMinutes) {
          const left = ROOM_RULES.weeklyMinutes - held.length * ROOM_RULES.stepMinutes;
          throw new Error(left > 0 ? `You have ${lengthLabel(left)} left that week. Pick a shorter time.` : "You've used your 4 hours that week. Cancel a booking to free some up.");
        }
      });

      const doc: BookingDoc = {
        roomId,
        roomName: room.name,
        start: Timestamp.fromMillis(start),
        end: Timestamp.fromMillis(end),
        minutes,
        status: "booked",
        kind: "member",
        memberId: me.id,
        memberName: me.name,
        memberEmail: me.email,
        note,
        createdAt: Timestamp.now(),
        createdBy: user.email,
      };
      tx.create(bookingRef, doc);
      for (const s of slots) tx.create(slotRef(roomId, s), { bookingId: bookingRef.id, roomId, memberId: me.id });
      for (const [w, add] of byWeek) {
        tx.set(weekRef(me.id, w), { memberId: me.id, week: w, slots: FieldValue.arrayUnion(...add), minutes: FieldValue.increment(add.length * ROOM_RULES.stepMinutes) }, { merge: true });
      }
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't book it. Try again." };
  }

  // After the commit, never undoing it: the receipt.
  const day = centralDay(new Date(start));
  const mail = bookingConfirmedEmail({ name: me.name, room: room.name, day, start: new Date(start).toISOString(), end: new Date(end).toISOString(), minutes });
  await sendSafely({ to: me.email, subject: mail.subject, html: mail.html, text: mail.text });
  refresh();
  return { ok: true, message: `Booked: ${room.name}, ${dayLabel(day)} ${timeLabel(new Date(start).toISOString())} – ${timeLabel(new Date(end).toISOString())}. We've emailed you the details.` };
}

// ─── Cancelling ──────────────────────────────────────────────────────────────

/** Frees the slots and gives the minutes back. Inside the caller's transaction. */
async function release(tx: FirebaseFirestore.Transaction, id: string, by: string) {
  const ref = getAdminDb().collection(COLLECTIONS.bookings).doc(id);
  const snap = await tx.get(ref);
  const b = snap.data() as BookingDoc | undefined;
  if (!b || b.status !== "booked") throw new Error("That booking is already canceled.");
  const slots = slotKeys(b.start.toDate().toISOString(), b.minutes);
  tx.update(ref, { status: "canceled", canceledAt: Timestamp.now(), canceledBy: by });
  for (const s of slots) tx.delete(slotRef(b.roomId, s));
  if (b.memberId) {
    const byWeek = new Map<string, string[]>();
    for (const s of slots) byWeek.set(weekKey(s), [...(byWeek.get(weekKey(s)) ?? []), s]);
    for (const [w, sl] of byWeek) {
      tx.set(weekRef(b.memberId, w), { slots: FieldValue.arrayRemove(...sl), minutes: FieldValue.increment(-sl.length * ROOM_RULES.stepMinutes) }, { merge: true });
    }
  }
  return b;
}

/** A member cancels their own booking, before it starts. */
export async function cancelMyBooking(id: string): Promise<RoomResult> {
  const user = await requireMember();
  const me = await bookerFor(user);
  if (!me || typeof id !== "string" || !id) return { ok: false, message: "That booking isn't yours to cancel." };
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(getAdminDb().collection(COLLECTIONS.bookings).doc(id));
      const b = snap.data() as BookingDoc | undefined;
      if (!b || b.memberId !== me.id) throw new Error("That booking isn't yours to cancel.");
      if (b.start.toMillis() <= Date.now()) throw new Error("It has already started. It ends on its own.");
      await release(tx, id, user.email);
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't cancel it." };
  }
  refresh();
  return { ok: true, message: "Canceled. The time is back in your week." };
}

/** Staff cancel any booking or block that hasn't ended. A member's booking gets an email. */
export async function cancelBooking(id: string, reason = ""): Promise<RoomResult> {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing booking." };
  let b: BookingDoc;
  try {
    b = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(getAdminDb().collection(COLLECTIONS.bookings).doc(id));
      const d = snap.data() as BookingDoc | undefined;
      if (d && d.end.toMillis() <= Date.now()) throw new Error("It has already ended.");
      return release(tx, id, admin.email);
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't cancel it." };
  }
  const startIso = b.start.toDate().toISOString();
  const day = centralDay(startIso);
  const label = `${b.roomName}, ${dayLabel(day)} ${timeLabel(startIso)}${b.kind === "member" ? ` (${b.memberName})` : ` (${b.note || "blocked"})`}`;
  await logActivity(admin, { area: "rooms", action: b.kind === "block" ? "removed the block on" : "canceled the booking of", label, href: `/portal/admin/rooms?day=${day}` });
  let message = b.kind === "block" ? "Block removed." : "Canceled.";
  if (b.kind === "member" && b.memberEmail) {
    const mail = bookingCanceledByStaffEmail({ name: b.memberName ?? "", room: b.roomName, day, start: startIso, end: b.end.toDate().toISOString(), minutes: b.minutes, reason: reason.trim().slice(0, 300) });
    const sent = await sendSafely({ to: b.memberEmail, subject: mail.subject, html: mail.html, text: mail.text });
    message = sent ? `Canceled. ${b.memberName} has been emailed.` : "Canceled, but the email didn't send — let them know directly.";
  }
  refresh();
  return { ok: true, message };
}

// ─── Staff block a room ──────────────────────────────────────────────────────

const blockSchema = z.object({
  roomId: z.string().min(1).max(80),
  start: z.iso.datetime(),
  minutes: z.number().int().refine((m) => m % ROOM_RULES.stepMinutes === 0 && m >= ROOM_RULES.stepMinutes && m <= BLOCK_MAX_MINUTES, "Pick a length."),
  note: z.string({ error: "Say what it's for." }).trim().min(2, "Say what it's for.").max(120),
});

/**
 * Staff hold a room (a Geekdom event, maintenance). Same slot locks, so it
 * can't land on a member's booking — cancel that first. No 14-day limit
 * and no weekly cap: those are the members' rules.
 */
export async function blockRoom(input: z.input<typeof blockSchema>): Promise<RoomResult & { fieldErrors?: Record<string, string> }> {
  const admin = await requireAdmin();
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const { roomId, minutes, note } = parsed.data;
  const start = Date.parse(parsed.data.start);
  if (start % SLOT_MS !== 0) return { ok: false, message: "Blocks start on the hour or the half hour." };
  if (start + minutes * 60_000 <= Date.now()) return { ok: false, message: "That time has passed." };
  await ensureRooms();
  const { rooms } = await listRooms();
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return { ok: false, message: "That room doesn't exist." };

  const slots = slotKeys(new Date(start).toISOString(), minutes);
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.bookings).doc();
  try {
    await db.runTransaction(async (tx) => {
      const taken = await tx.getAll(...slots.map((s) => slotRef(roomId, s)));
      if (taken.some((t) => t.exists)) throw new Error("Part of that time is already booked. Cancel that booking first, or pick another time.");
      const doc: BookingDoc = {
        roomId,
        roomName: room.name,
        start: Timestamp.fromMillis(start),
        end: Timestamp.fromMillis(start + minutes * 60_000),
        minutes,
        status: "booked",
        kind: "block",
        memberId: null,
        memberName: null,
        memberEmail: null,
        note,
        createdAt: Timestamp.now(),
        createdBy: admin.email,
      };
      tx.create(ref, doc);
      for (const s of slots) tx.create(slotRef(roomId, s), { bookingId: ref.id, roomId, memberId: null });
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't block it." };
  }
  const day = centralDay(new Date(start));
  await logActivity(admin, { area: "rooms", action: "blocked", label: `${room.name}, ${dayLabel(day)} ${timeLabel(new Date(start).toISOString())} for ${lengthLabel(minutes)} (${note})`, href: `/portal/admin/rooms?day=${day}` });
  refresh();
  return { ok: true, message: `${room.name} is blocked.` };
}

// ─── Staff edit a room ───────────────────────────────────────────────────────

const roomSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string({ error: "Name the room." }).trim().min(1, "Name the room.").max(60),
  capacity: z.number({ error: "How many people?" }).int().min(1, "At least 1.").max(500),
  features: z.array(z.string().trim().min(1).max(40)).max(10),
  description: z.string().trim().max(200).default(""),
  active: z.boolean(),
});

export async function saveRoom(input: z.input<typeof roomSchema>): Promise<RoomResult & { fieldErrors?: Record<string, string> }> {
  const admin = await requireAdmin();
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  await ensureRooms();
  const { id, ...data } = parsed.data;
  const col = getAdminDb().collection(COLLECTIONS.rooms);
  const { rooms } = await listRooms();
  const ref = id ? col.doc(id) : col.doc();
  const doc: RoomDoc = { ...data, order: id ? (rooms.find((r) => r.id === id)?.order ?? rooms.length) : rooms.length };
  await ref.set(doc);
  await logActivity(admin, { area: "rooms", action: id ? "edited" : "added", label: `the ${data.name} room`, href: "/portal/admin/rooms" });
  refresh();
  return { ok: true, message: id ? "Room saved." : "Room added." };
}

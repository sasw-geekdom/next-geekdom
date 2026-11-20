"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminAllowed, requireAdmin, requireMember } from "@/lib/auth/session";
import { MANAGEMENT_ONLY_MESSAGE } from "@/lib/auth/roles";
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

  ONE ROOM AT A TIME the same way: `roomWeeks/{memberId}_{sunday}` holds
  the slots a member has that week, read and written in the transaction,
  so two bookings of theirs can never overlap. (It was also a 4-hours-a-
  week cap; that came off in November 2026 — there's no weekly limit.)

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
  if (!isBookableWeekday(bookingDay)) return { ok: false, message: `Rooms can't be booked on that day. Email ${CONTACT_EMAIL} and the Club team will set it up.` };
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
        if (byWeek.get(weeks[i])!.some((s) => held.includes(s))) throw new Error("You already have a room booked at that time.");
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
  return { ok: true, message: "Canceled. The room is free for someone else." };
}

// ─── A member adds time ─────────────────────────────────────────────────────

/**
 * ADD TIME to your own booking: the end moves later in 30-minute steps,
 * while the room is free right after it — up to 4 hours in all and the
 * close of the booking window. Same slot locks as booking, in one
 * transaction, so it can't land on the next person's booking. No email:
 * the page says what changed.
 */
export async function extendMyBooking(id: string, addMinutes: number): Promise<RoomResult> {
  const user = await requireMember();
  const me = await bookerFor(user);
  if (!me || typeof id !== "string" || !id) return { ok: false, message: "That booking isn't yours." };
  if (!Number.isInteger(addMinutes) || addMinutes <= 0 || addMinutes % ROOM_RULES.stepMinutes !== 0) {
    return { ok: false, message: "Pick how much time to add." };
  }
  const db = getAdminDb();
  const ref = db.collection(COLLECTIONS.bookings).doc(id);
  let result: { roomName: string; end: number };
  try {
    result = await db.runTransaction(async (tx) => {
      const b = (await tx.get(ref)).data() as BookingDoc | undefined;
      if (!b || b.memberId !== me.id || b.kind !== "member") throw new Error("That booking isn't yours.");
      if (b.status !== "booked") throw new Error("That booking was canceled.");
      const end = b.end.toMillis();
      if (end <= Date.now()) throw new Error("It has already ended.");
      const total = b.minutes + addMinutes;
      if (total > ROOM_RULES.maxMinutes) {
        const room = ROOM_RULES.maxMinutes - b.minutes;
        throw new Error(room > 0 ? `A booking can be ${lengthLabel(ROOM_RULES.maxMinutes)} at most — you can add ${lengthLabel(room)}.` : `It's already ${lengthLabel(ROOM_RULES.maxMinutes)}, the most a booking can be.`);
      }
      const newEnd = end + addMinutes * 60_000;
      if (newEnd > windowOf(centralDay(new Date(b.start.toMillis()))).to) {
        throw new Error(`Rooms can be booked until ${BOOKING_WINDOW.label.split("–")[1].trim()}. For later, email ${CONTACT_EMAIL}.`);
      }
      const adding = slotKeys(new Date(end).toISOString(), addMinutes);
      const taken = await tx.getAll(...adding.map((s) => slotRef(b.roomId, s)));
      if (taken.some((t) => t.exists)) throw new Error("Someone has the room right after you. Pick less time, or book another room.");
      const byWeek = new Map<string, string[]>();
      for (const s of adding) byWeek.set(weekKey(s), [...(byWeek.get(weekKey(s)) ?? []), s]);
      const weeks = [...byWeek.keys()];
      const weekSnaps = await tx.getAll(...weeks.map((w) => weekRef(me.id, w)));
      weekSnaps.forEach((snap, i) => {
        const held: string[] = (snap.data()?.slots as string[] | undefined) ?? [];
        if (byWeek.get(weeks[i])!.some((s) => held.includes(s))) throw new Error("You have another room booked right after this one.");
      });
      tx.update(ref, { end: Timestamp.fromMillis(newEnd), minutes: total, extendedBy: FieldValue.increment(addMinutes) });
      for (const s of adding) tx.create(slotRef(b.roomId, s), { bookingId: id, roomId: b.roomId, memberId: me.id });
      for (const [w, add] of byWeek) {
        tx.set(weekRef(me.id, w), { memberId: me.id, week: w, slots: FieldValue.arrayUnion(...add), minutes: FieldValue.increment(add.length * ROOM_RULES.stepMinutes) }, { merge: true });
      }
      return { roomName: b.roomName, end: newEnd };
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't add the time." };
  }
  refresh();
  return { ok: true, message: `Added ${lengthLabel(addMinutes)}. ${result.roomName} is yours until ${timeLabel(new Date(result.end).toISOString())}.` };
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
  const label = `${b.roomName}, ${dayLabel(day)} ${timeLabel(startIso)}${b.kind === "member" ? ` (${b.memberName})` : ` (${b.heldFor?.name || b.note || "blocked"})`}`;
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
  /** Who it's for: the staff member themselves, an event request, or other (the note says). */
  heldFor: z.enum(["staff", "event", "other"]).default("other"),
  inquiryId: z.string().max(80).optional(),
  note: z.string().trim().max(120).default(""),
});

/**
 * Staff hold a room — for THEMSELVES (named on the schedule), for an EVENT
 * REQUEST from "Host an event" (linked both ways), or for anything else (a
 * Geekdom event, maintenance — the note says). Same slot locks, so it
 * can't land on a member's booking — cancel that first. Any day, any hour,
 * up to 12 hours, no horizon: those are the members' rules.
 */
export async function blockRoom(input: z.input<typeof blockSchema>): Promise<RoomResult & { fieldErrors?: Record<string, string> }> {
  const admin = await requireAdmin();
  const parsed = blockSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const { roomId, minutes, heldFor: forKind, inquiryId } = parsed.data;
  const { note } = parsed.data;
  let heldFor: NonNullable<BookingDoc["heldFor"]>;
  if (forKind === "staff") {
    heldFor = { kind: "staff", name: admin.name || admin.email };
  } else if (forKind === "event") {
    const inq = inquiryId ? (await getAdminDb().collection(COLLECTIONS.inquiries).doc(inquiryId).get()).data() : undefined;
    if (!inquiryId || !inq || inq.kind !== "event") return { ok: false, message: "Pick the event request.", fieldErrors: { inquiryId: "Pick the event request." } };
    heldFor = { kind: "event", name: [inq.company, inq.name].filter(Boolean).join(" · "), inquiryId };
  } else {
    if (note.length < 2) return { ok: false, message: "Check the highlighted fields.", fieldErrors: { note: "Say what it's for." } };
    heldFor = { kind: "other", name: note };
  }
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
        heldFor,
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
  const forWhom = heldFor.kind === "staff" ? "for themselves" : heldFor.kind === "event" ? `for the event request from ${heldFor.name}` : `(${note})`;
  await logActivity(admin, { area: "rooms", action: "blocked", label: `${room.name}, ${dayLabel(day)} ${timeLabel(new Date(start).toISOString())} for ${lengthLabel(minutes)} ${forWhom}`, href: `/portal/admin/rooms?day=${day}` });
  refresh();
  if (heldFor.inquiryId) revalidatePath(`/portal/admin/requests/${heldFor.inquiryId}`);
  return { ok: true, message: heldFor.kind === "staff" ? `${room.name} is held for you.` : heldFor.kind === "event" ? `${room.name} is held for ${heldFor.name}.` : `${room.name} is blocked.` };
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
  const admin = await adminAllowed("rooms.configure");
  if (!admin) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
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

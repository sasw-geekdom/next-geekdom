import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type BookingDoc, type RoomDoc } from "@/lib/firebase/collections";
import { addDays, dayStartIso } from "@/lib/rooms/rules";
import { getMemberByEmail } from "@/lib/admin/queries";
import { isAdmin, type SessionUser } from "@/lib/auth/roles";

/*
  THE CONFERENCE ROOMS AND THEIR BOOKINGS — reads. Writes are in
  ./actions.ts. Uncached on purpose: availability must be exact, and a
  stale "free" would send a member into a conflict.

  THE ROOMS ARE PLACEHOLDERS until Geekdom names them (names, capacities
  and equipment are all editable at /portal/admin/rooms). Until the first
  edit there are no room docs and these defaults are the rooms; the first
  admin save writes all four down, so ids never change under a booking.
*/

export interface Room extends RoomDoc {
  id: string;
}

export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  start: string;
  end: string;
  minutes: number;
  status: BookingDoc["status"];
  kind: BookingDoc["kind"];
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  note: string;
  /** For a block: who it's for (BookingDoc.heldFor). */
  heldFor: { kind: "staff" | "event" | "other"; name: string; inquiryId?: string } | null;
  createdAt: string;
}

// Thanksgiving names, as placeholders (Jesse, November 2026) — Geekdom renames them in the admin.
export const DEFAULT_ROOMS: Room[] = [
  { id: "room-cranberry", name: "Cranberry", capacity: 10, features: ["60-inch TV", "Whiteboard"], description: "A small room for a team meeting or a call.", active: true, order: 0 },
  { id: "room-cornbread", name: "Cornbread", capacity: 10, features: ["60-inch TV", "Video-call camera"], description: "Set up for calls with people who aren't in the room.", active: true, order: 1 },
  { id: "room-pumpkin", name: "Pumpkin", capacity: 20, features: ["75-inch TV", "Video-call camera", "Whiteboard"], description: "The larger room, for a workshop or a board meeting.", active: true, order: 2 },
  { id: "room-harvest", name: "Harvest", capacity: 20, features: ["75-inch TV", "Whiteboard wall"], description: "A large room for planning sessions.", active: true, order: 3 },
];

export async function listRooms(): Promise<{ rooms: Room[]; saved: boolean }> {
  const snap = await getAdminDb().collection(COLLECTIONS.rooms).get();
  if (snap.empty) return { rooms: DEFAULT_ROOMS, saved: false };
  const rooms = snap.docs.map((d) => ({ id: d.id, ...(d.data() as RoomDoc) })).sort((a, b) => a.order - b.order);
  return { rooms, saved: true };
}

export function toBooking(id: string, d: BookingDoc): Booking {
  return {
    id,
    roomId: d.roomId,
    roomName: d.roomName,
    start: d.start.toDate().toISOString(),
    end: d.end.toDate().toISOString(),
    minutes: d.minutes,
    status: d.status,
    kind: d.kind,
    memberId: d.memberId,
    memberName: d.memberName,
    memberEmail: d.memberEmail,
    note: d.note ?? "",
    heldFor: d.heldFor ?? null,
    // Tolerant: one booking written without it (a script, an old doc) mustn't take the whole Rooms page down.
    createdAt: (d.createdAt ?? d.start).toDate().toISOString(),
  };
}

/**
 * Every live booking that touches a Central day. One range query on
 * `start` (no composite index), reaching back 12 hours for a staff block
 * that began the evening before.
 */
export async function bookingsForDay(day: string): Promise<Booking[]> {
  const from = Date.parse(dayStartIso(day));
  const to = Date.parse(dayStartIso(addDays(day, 1)));
  const snap = await getAdminDb()
    .collection(COLLECTIONS.bookings)
    .where("start", ">=", Timestamp.fromMillis(from - 12 * 3600_000))
    .where("start", "<", Timestamp.fromMillis(to))
    .get();
  return snap.docs
    .map((d) => toBooking(d.id, d.data() as BookingDoc))
    .filter((b) => b.status === "booked" && Date.parse(b.end) > from)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Every live booking that touches the Central days from `fromDay` up to
 * (not including) `toDay` — the admin's week strip counts, in one query.
 */
export async function bookingsBetween(fromDay: string, toDay: string): Promise<Booking[]> {
  const from = Date.parse(dayStartIso(fromDay));
  const to = Date.parse(dayStartIso(toDay));
  const snap = await getAdminDb()
    .collection(COLLECTIONS.bookings)
    .where("start", ">=", Timestamp.fromMillis(from - 12 * 3600_000))
    .where("start", "<", Timestamp.fromMillis(to))
    .get();
  return snap.docs
    .map((d) => toBooking(d.id, d.data() as BookingDoc))
    .filter((b) => b.status === "booked" && Date.parse(b.end) > from)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** A member's bookings that haven't ended, soonest first. */
export async function upcomingFor(memberId: string, now: number): Promise<Booking[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.bookings).where("memberId", "==", memberId).get();
  return snap.docs
    .map((d) => toBooking(d.id, d.data() as BookingDoc))
    .filter((b) => b.status === "booked" && Date.parse(b.end) > now)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/** Every upcoming room hold for an event request, keyed by the request — the Requests list's Progress column. One equality query. */
export async function upcomingEventHolds(now: number): Promise<Map<string, Booking[]>> {
  const snap = await getAdminDb().collection(COLLECTIONS.bookings).where("heldFor.kind", "==", "event").get();
  const out = new Map<string, Booking[]>();
  for (const d of snap.docs) {
    const b = toBooking(d.id, d.data() as BookingDoc);
    if (b.status !== "booked" || Date.parse(b.end) <= now || !b.heldFor?.inquiryId) continue;
    out.set(b.heldFor.inquiryId, [...(out.get(b.heldFor.inquiryId) ?? []), b].sort((x, y) => x.start.localeCompare(y.start)));
  }
  return out;
}

/** Rooms held for one event request that haven't ended — the request page shows them. One equality query. */
export async function holdsForInquiry(inquiryId: string, now: number): Promise<Booking[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.bookings).where("heldFor.inquiryId", "==", inquiryId).get();
  return snap.docs
    .map((d) => toBooking(d.id, d.data() as BookingDoc))
    .filter((b) => b.status === "booked" && Date.parse(b.end) > now)
    .sort((a, b) => a.start.localeCompare(b.start));
}

/*
  WHO IS BOOKING. A current member — or STAFF, as themselves: Geekdom's team
  uses the rooms too, and it's how they try the member side. Staff book
  under the same rules (window, length, one week ahead) with an id
  of their own (`staff_{uid}`), so they never need a members record — which
  would put them in the roster, the directory and the Overview's counts.
  A staff member who IS also a member books as the member.
*/
export interface Booker {
  id: string;
  name: string;
  email: string;
  staff: boolean;
}

const CURRENT = ["active", "trialing", "past_due"];

export async function bookerFor(user: SessionUser): Promise<Booker | null> {
  const me = await getMemberByEmail(user.email);
  if (me && CURRENT.includes(me.status)) return { id: me.id, name: me.name, email: me.email, staff: false };
  if (isAdmin(user)) return { id: `staff_${user.uid}`, name: user.name || user.email, email: user.email, staff: true };
  return null;
}

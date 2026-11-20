import { centralParts, fromCentral, TIME_ZONE } from "@/lib/content/dates";

/*
  THE ROOM-BOOKING RULES (Phase 4, November 2026 — Jesse's call; Geekdom
  can change them). PURE: the member page, the admin and the server action
  all read these, and the server is the one that enforces them.

    · bookings in 30-minute steps
    · 4 hours at most per booking — and a member can ADD TIME to their own
      booking (extendMyBooking), in 30-minute steps, up to the same 4 hours
    · NO WEEKLY LIMIT (Jesse, November 2026 — it was 4 hours a week). The
      guard against one person holding every room is the horizon below and
      "one room at a time".
    · ONE WEEK AHEAD, rolling: today and the 6 days after it (it was 14).
      Rolling, not "this calendar week", so a Friday can still book Monday.
    · EVERY DAY, weekends included (Jesse, November 2026 — it was Monday
      to Friday, set around staff hours). The space is open 24/7 and
      booking is instant, so nothing about booking needs staff; the
      system already stops double booking. BOOKING_WINDOW.weekdays is the
      switch if a day ever comes off again.
    · 8 AM – 6 PM, every day (BOOKING_WINDOW; it was 7 AM – 9 PM). The
      Club is open 24/7 — anything outside the hours goes through the
      Club team (club@), who block a room at any hour from the admin.
    · one room at a time per member (no two bookings that overlap)
    · instant: a free slot is yours when you book it, no staff approval

  Everything is in Central time, and a day is midnight to midnight there —
  so a daylight-saving day has 46 or 50 slots, not 48.
*/

export const ROOM_RULES = {
  stepMinutes: 30,
  maxMinutes: 240,
  daysAhead: 7,
} as const;

/** The hours members can book, Central. A booking must start and end inside them. */
export const BOOKING_WINDOW = {
  opens: "08:00",
  closes: "18:00",
  /** Day of the week, 0 = Sunday. Every day. */
  weekdays: [0, 1, 2, 3, 4, 5, 6] as readonly number[],
  label: "8 AM – 6 PM",
  /** Mid-sentence ("Four rooms, every day, 8 AM – 6 PM"). */
  daysLabel: "every day",
} as const;

const dowOf = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** Can a member book on this Central day at all? (Every day, today.) */
export const isBookableWeekday = (day: string) => BOOKING_WINDOW.weekdays.includes(dowOf(day));

/** What staff can block in one go (a Geekdom event, maintenance). */
export const BLOCK_MAX_MINUTES = 12 * 60;

export const SLOT_MS = ROOM_RULES.stepMinutes * 60_000;

/** The lengths a member can pick. */
export const LENGTHS = Array.from({ length: ROOM_RULES.maxMinutes / ROOM_RULES.stepMinutes }, (_, i) => (i + 1) * ROOM_RULES.stepMinutes);

/** "2026-11-06" — the Central calendar day an instant falls on. */
export function centralDay(iso: string | Date): string {
  const p = centralParts(typeof iso === "string" ? iso : iso.toISOString());
  return `${p.year}-${p.month}-${p.day}`;
}

/** Midnight Central at the start of a day, as an ISO instant. */
export function dayStartIso(day: string): string {
  const [y, m, d] = day.split("-");
  return fromCentral(y, m, d, "00:00") ?? `${day}T06:00:00.000Z`;
}

/** The day `n` days after `day` (calendar arithmetic, no time zone). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));

/** Every slot start in a Central day — 48 usually, 46 or 50 on a clock-change day. */
export function slotsOfDay(day: string): string[] {
  const from = Date.parse(dayStartIso(day));
  const to = Date.parse(dayStartIso(addDays(day, 1)));
  const out: string[] = [];
  for (let t = from; t < to; t += SLOT_MS) out.push(new Date(t).toISOString());
  return out;
}

/** The bookable slot starts in a day: 8:00 AM to 5:30 PM (the last one ends at 6). */
export function windowSlots(day: string): string[] {
  const { from, to } = windowOf(day);
  const out: string[] = [];
  for (let t = from; t < to; t += SLOT_MS) out.push(new Date(t).toISOString());
  return out;
}

/** The booking window of a Central day, as instants. */
export function windowOf(day: string): { from: number; to: number } {
  const [y, m, d] = day.split("-");
  return {
    from: Date.parse(fromCentral(y, m, d, BOOKING_WINDOW.opens) ?? dayStartIso(day)),
    to: Date.parse(fromCentral(y, m, d, BOOKING_WINDOW.closes) ?? dayStartIso(addDays(day, 1))),
  };
}

/** The slot starts a booking covers. */
export function slotKeys(startIso: string, minutes: number): string[] {
  const start = Date.parse(startIso);
  return Array.from({ length: minutes / ROOM_RULES.stepMinutes }, (_, i) => new Date(start + i * SLOT_MS).toISOString());
}

/**
 * The Sunday (Central) that starts the week an instant falls in. Weeks run
 * Sunday to Saturday. There's no weekly cap any more; this keys the
 * per-member ledger (roomWeeks) that stops one member holding two rooms at
 * once, and the admin's week strip.
 */
export function weekKey(iso: string): string {
  const day = centralDay(iso);
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(day, -dow);
}

/** The days a member can book, today through the end of the horizon. */
export function bookableDays(now: Date): string[] {
  const today = centralDay(now);
  // The horizon is calendar days; within it, only the bookable ones (every day, today).
  return Array.from({ length: ROOM_RULES.daysAhead }, (_, i) => addDays(today, i)).filter(isBookableWeekday);
}

/** The start of the slot `now` is in — a booking can start there, not earlier. */
export const currentSlotStart = (now: number) => Math.floor(now / SLOT_MS) * SLOT_MS;

export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function dayLabel(day: string, style: "short" | "long" = "short"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: style === "long" ? "long" : "short",
    month: style === "long" ? "long" : "short",
    day: "numeric",
  }).format(new Date(`${day}T12:00:00Z`));
}

export function lengthLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ");
}

export const hoursLabel = (minutes: number) => `${minutes / 60 === Math.floor(minutes / 60) ? minutes / 60 : (minutes / 60).toFixed(1)} ${minutes === 60 ? "hour" : "hours"}`;

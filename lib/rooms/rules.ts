import { centralParts, fromCentral, TIME_ZONE } from "@/lib/content/dates";

/*
  THE ROOM-BOOKING RULES (Phase 4, November 2026 — Jesse's call; Geekdom
  can change them). PURE: the member page, the admin and the server action
  all read these, and the server is the one that enforces them.

    · bookings in 30-minute steps
    · 2 hours at most per booking
    · up to 14 days ahead (today and the 13 days after it)
    · 4 hours per member per week (Sunday–Saturday, Central) — per PERSON:
      each teammate on a Team membership has their own 4 hours
    · WEEKDAYS ONLY, Monday to Friday (BOOKING_WINDOW.weekdays) — staff
      aren't in on weekends; a weekend room goes through the Club team,
      like the hours below. Jesse's call, November 2026.
    · 7 AM – 9 PM (BOOKING_WINDOW). The Club is open 24/7, but staff are
      in the building 9–5 and this covers nearly every meeting; anything
      outside it goes through the Club team (club@), who can block a room
      at any hour from the admin. Jesse's call, November 2026.
    · instant: a free slot is yours when you book it, no staff approval

  Everything is in Central time, and a day is midnight to midnight there —
  so a daylight-saving day has 46 or 50 slots, not 48.
*/

export const ROOM_RULES = {
  stepMinutes: 30,
  maxMinutes: 120,
  daysAhead: 14,
  weeklyMinutes: 240,
} as const;

/** The hours members can book, Central. A booking must start and end inside them. */
export const BOOKING_WINDOW = {
  opens: "07:00",
  closes: "21:00",
  /** Day of the week, 0 = Sunday. Monday to Friday. */
  weekdays: [1, 2, 3, 4, 5] as readonly number[],
  label: "7 AM – 9 PM",
  daysLabel: "Monday to Friday",
} as const;

const dowOf = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

/** Can a member book on this Central day at all (a weekday)? */
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

/** The bookable slot starts in a day: 7:00 AM to 8:30 PM (the last one ends at 9). */
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
 * The Sunday (Central) that starts the week an instant falls in — the
 * weekly cap's key. Weeks run Sunday to Saturday (Jesse's call; it was
 * Monday to Sunday until November 2026, before any booking was made).
 */
export function weekKey(iso: string): string {
  const day = centralDay(iso);
  const [y, m, d] = day.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return addDays(day, -dow);
}

/** The weekdays a member can book, today through 13 days out. */
export function bookableDays(now: Date): string[] {
  const today = centralDay(now);
  // The 14-day horizon is calendar days; within it, only the bookable weekdays.
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

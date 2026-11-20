/**
 * ROOM BOOKING EMAILS, on the member emails' brand (./member-templates.ts).
 *
 *   member  booked (a receipt they can find later) · today (the morning-of
 *           reminder, app/api/cron/room-reminders) · canceled BY STAFF
 *
 * A member cancelling their own booking gets no email — they just did it.
 * PURE (no server-only imports).
 */

import { escapeHtml } from "@/lib/email/templates";
import { button, details, email, eyebrow, first, h1, muted, p, url, type Email } from "@/lib/email/member-templates";
import { dayLabel, lengthLabel, timeLabel } from "@/lib/rooms/rules";
import { googleCalendarUrl } from "@/lib/rooms/calendar";

interface Vars {
  name: string;
  room: string;
  day: string; // YYYY-MM-DD, Central
  start: string; // ISO
  end: string; // ISO
  minutes: number;
}

const when = (v: Vars) => `${dayLabel(v.day, "long")}, ${timeLabel(v.start)} – ${timeLabel(v.end)}`;
const plain = (name: string) => name.trim().split(/\s+/)[0] || "there";

export function bookingConfirmedEmail(v: Vars): Email {
  const rooms = url("/portal/rooms");
  return email(
    `Booked: ${v.room}, ${dayLabel(v.day)} at ${timeLabel(v.start)}`,
    `${v.room} is yours ${when(v)}.`,
    eyebrow("Member portal · Rooms") +
      h1(`${first(v.name)}, ${escapeHtml(v.room)} is yours.`) +
      details([
        ["Room", v.room],
        ["When", when(v)],
        ["Length", lengthLabel(v.minutes)],
      ]) +
      p("Plans changed? Cancel it in the portal so someone else can use the room.") +
      button(rooms, "See your bookings") +
      p(`<a href="${googleCalendarUrl({ id: "", roomName: v.room, start: v.start, end: v.end })}" style="color:inherit;">Add it to Google Calendar</a> — or download it for any calendar from your bookings.`) +
      muted("The room is on the third floor. If someone's in it when your time starts, they should be on their way out."),
    `${plain(v.name)}, ${v.room} is yours ${when(v)} (${lengthLabel(v.minutes)}).\n\nPlans changed? Cancel it so someone else can use the room: ${rooms}`,
  );
}

/** The morning-of reminder — one email listing their bookings today. */
export function bookingTodayEmail(v: { name: string; bookings: { room: string; start: string; end: string }[] }): Email {
  const rooms = url("/portal/rooms");
  const one = v.bookings.length === 1;
  const lines = v.bookings.map((b) => [b.room, `${timeLabel(b.start)} – ${timeLabel(b.end)}`] as [string, string]);
  return email(
    one ? `Today: ${v.bookings[0].room} at ${timeLabel(v.bookings[0].start)}` : `Today: ${v.bookings.length} room bookings`,
    one ? `${v.bookings[0].room} is yours today, ${timeLabel(v.bookings[0].start)} – ${timeLabel(v.bookings[0].end)}.` : "Your conference rooms today.",
    eyebrow("Member portal · Rooms") +
      h1(one ? `${first(v.name)}, ${escapeHtml(v.bookings[0].room)} is yours today.` : `${first(v.name)}, your rooms today.`) +
      details(lines) +
      p("Not going to make it? Cancel it so someone else can use the room. Running long? Add time while the room is free after it.") +
      button(rooms, "See your bookings") +
      muted("The rooms are on the third floor."),
    `${plain(v.name)}, your rooms today:\n${lines.map(([r, t]) => `${r}: ${t}`).join("\n")}\n\nCancel or add time: ${rooms}`,
  );
}

export function bookingCanceledByStaffEmail(v: Vars & { reason: string }): Email {
  const rooms = url("/portal/rooms");
  return email(
    `Your booking of ${v.room} was canceled`,
    `The Geekdom team canceled your booking for ${when(v)}.`,
    eyebrow("Member portal · Rooms") +
      h1(`${first(v.name)}, we had to cancel your booking.`) +
      details([
        ["Room", v.room],
        ["When", when(v)],
      ]) +
      (v.reason ? p(escapeHtml(v.reason)) : p("The Geekdom team needed the room. We're sorry for the change.")) +
      p("The hours are back in your week, so you can book another time or another room.") +
      button(rooms, "Book another time"),
    `${plain(v.name)}, the Geekdom team canceled your booking of ${v.room} for ${when(v)}.${v.reason ? `\n\n${v.reason}` : ""}\n\nThe hours are back in your week: ${rooms}`,
  );
}

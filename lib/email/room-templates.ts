/**
 * ROOM BOOKING EMAILS, on the member emails' brand (./member-templates.ts).
 *
 *   member  booked (a receipt they can find later) · canceled BY STAFF
 *
 * A member cancelling their own booking gets no email — they just did it.
 * PURE (no server-only imports).
 */

import { escapeHtml } from "@/lib/email/templates";
import { button, details, email, eyebrow, first, h1, muted, p, url, type Email } from "@/lib/email/member-templates";
import { dayLabel, lengthLabel, timeLabel } from "@/lib/rooms/rules";

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
      p("Plans changed? Cancel it in the portal so someone else can use the room — it gives the hours back to your week too.") +
      button(rooms, "See your bookings") +
      muted("The room is on the third floor. If someone's in it when your time starts, they should be on their way out."),
    `${plain(v.name)}, ${v.room} is yours ${when(v)} (${lengthLabel(v.minutes)}).\n\nPlans changed? Cancel it so someone else can use the room: ${rooms}`,
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

import { LOCATION } from "@/lib/site";

/*
  ADD A BOOKING TO YOUR CALENDAR (Jesse, November 2026) — an .ics file
  (Apple Calendar, Outlook, anything) and a Google Calendar link. Client-
  safe and pure: built from the booking the page already has, so nothing
  is fetched. Times are UTC instants, which every calendar converts.
*/

export interface CalendarBooking {
  id: string;
  roomName: string;
  start: string; // ISO
  end: string; // ISO
}

const WHERE = `The Rand Building, ${LOCATION.floorShort}, ${LOCATION.street}, ${LOCATION.city}, ${LOCATION.state} ${LOCATION.zip}`;
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const title = (b: CalendarBooking) => `${b.roomName} — Geekdom`;

export function icsFor(b: CalendarBooking): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Geekdom//Rooms//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${b.id}@geekdom.com`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(b.start)}`,
    `DTEND:${stamp(b.end)}`,
    `SUMMARY:${esc(title(b))}`,
    `LOCATION:${esc(WHERE)}`,
    `DESCRIPTION:${esc("Your conference room at Geekdom. Change or cancel it in the member portal under Book a room.")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(b: CalendarBooking): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: title(b),
    dates: `${stamp(b.start)}/${stamp(b.end)}`,
    location: WHERE,
    details: "Your conference room at Geekdom. Change or cancel it in the member portal under Book a room.",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

/*
  CENTRAL TIME, for every date the site shows about an event.

  Geekdom is in San Antonio and so are its events; a server in Virginia or a
  laptop in another timezone must still print "Oct 27" for an evening that is
  Oct 27 here. Pure functions, safe on the server and in the admin's client
  forms.
*/

export const TIME_ZONE = "America/Chicago";

/** "Oct 27" — and "Sept 23", the source copy's abbreviation, not Intl's "Sep". */
export function eventDateLabel(iso: string): string {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
  return label.replace(/^Sep /, "Sept ");
}

/** "6:00 PM" in Central time. */
export function eventTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** The Central-time parts of an instant — what the admin form edits. */
export function centralParts(iso: string): {
  year: string;
  month: string;
  day: string;
  time: string; // "HH:MM", 24h
} {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/**
 * A Central wall-clock date and time → the exact instant, honoring daylight
 * saving on that date (CDT -05:00 in summer, CST -06:00 in winter). Tries
 * both offsets and keeps the one that reads back as the same wall clock.
 */
export function fromCentral(
  year: string,
  month: string,
  day: string,
  time: string,
): string | null {
  for (const offset of ["-05:00", "-06:00"]) {
    const iso = `${year}-${month}-${day}T${time}:00${offset}`;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return null;
    const back = centralParts(new Date(t).toISOString());
    if (back.year === year && back.month === month && back.day === day && back.time === time) {
      return new Date(t).toISOString();
    }
  }
  return null;
}

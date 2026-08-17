/**
 * Date and text formatting. Pure — used by server components, the admin
 * portal, and email templates.
 *
 * Everything here pins `timeZone: "America/Chicago"`. Geekdom is one building
 * in one city, and the server renders in UTC on Vercel — without the pin, an
 * 8pm event on the third floor renders as the next day's date for anyone
 * hitting a prerendered page.
 */

const TZ = "America/Chicago";

/** "Sat, Oct 3" */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
}

/** "October 3, 2026" */
export function formatLongDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
}

/**
 * "Tuesday, August 18" — weekday first, no year.
 *
 * For event listings, where the weekday is the thing people actually plan
 * around and the year is noise on a calendar that only shows the near future.
 */
export function formatEventDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
}

/** "6:30 PM" */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(date));
}

/** "Sat, Oct 3 · 6:30 PM" */
export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} · ${formatTime(date)}`;
}

/** First name from a full name, for email greetings. Falls back to the whole string. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

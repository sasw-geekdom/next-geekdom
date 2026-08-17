import "server-only";
import { env, hasEnv } from "@/lib/env";
import { IS_PREVIEW } from "@/lib/preview";
import { sampleUpcomingEvents, samplePastEvents } from "@/lib/sample/events";

/**
 * Luma — the club calendar.
 *
 * Written against the CURRENT public API (verified against
 * https://public-api.luma.com/openapi.json), which differs from most tutorials
 * and from Luma's own older docs in three ways that will bite:
 *
 *   1. Base URL is `https://public-api.luma.com`, not `public-api.lu.ma`.
 *   2. The endpoint is `GET /v1/calendars/events/list`, not
 *      `/public/v1/calendar/list-events`.
 *   3. Entries are FLAT. The old API wrapped each row as `{ api_id, event: {…} }`;
 *      today the event's fields sit directly on the entry, and the identifier
 *      is `id`, not `api_id`.
 *
 * The list endpoint does not return descriptions. `getEvent` does — call it
 * only when rendering a single event, since it costs one request each.
 */

const LUMA_API = "https://public-api.luma.com/v1";

// ─── Types (subset of the spec — the fields this site actually renders) ─────

export interface LumaAddress {
  address: string;
  city: string | null;
  region: string | null;
  country: string | null;
  city_state: string | null;
  full_address: string | null;
}

export interface LumaEvent {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  timezone: string;
  url: string;
  cover_url?: string;
  visibility?: "public" | "members-only" | "private";
  location_type?: string;
  geo_address_json: LumaAddress | null;
  /** Null when the event has no capacity limit. */
  spots_remaining?: number | null;
  /** Absent on events the calendar only has `view` access to. */
  registration_open?: boolean;
}

export interface LumaEventDetail extends LumaEvent {
  description: string;
  description_md: string;
}

interface ListResponse {
  entries: LumaEvent[];
  has_more: boolean;
  next_cursor?: string;
}

// ─── Client ─────────────────────────────────────────────────────────────────

/**
 * Luma is optional infrastructure. If the key is missing the events page shows
 * a link to the public calendar instead of an empty state — which is what
 * should happen in a preview deploy or before the key is issued, rather than a
 * 500 on a public page.
 */
export function isLumaConfigured(): boolean {
  return hasEnv(process.env.LUMA_API_KEY);
}

/**
 * Whether the events pages have anything to show — a real key, or preview
 * mode standing in for one.
 *
 * Deliberately separate from `isLumaConfigured`, which answers the narrower
 * question "is the key set" and drives the staff portal's setup prompt. Fusing
 * the two would have the admin page report the calendar as connected on a
 * preview deploy, which is the opposite of what staff need to know.
 */
export function hasEventsToShow(): boolean {
  return isLumaConfigured() || IS_PREVIEW;
}

async function lumaFetch<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
  revalidate = 300,
): Promise<T> {
  const key = env(process.env.LUMA_API_KEY);
  if (!key) throw new Error("LUMA_API_KEY is not set.");

  const url = new URL(`${LUMA_API}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const res = await fetch(url, {
    headers: { "x-luma-api-key": key, accept: "application/json" },
    // Five minutes. The calendar changes on human timescales, and a public
    // events page shouldn't hit a third-party API once per visitor.
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(
      `Luma ${path} failed: ${res.status} ${res.statusText}`.trim(),
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Upcoming events, soonest first.
 *
 * Pages through the cursor rather than trusting one request to hold everything
 * — the server enforces its own maximum on `pagination_limit`, so asking for
 * 100 does not guarantee 100 back. Capped at `limit` results and 10 round trips
 * so a runaway cursor can't hang a page render.
 */
export async function getUpcomingEvents(limit = 24): Promise<LumaEvent[]> {
  const events: LumaEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const data = await lumaFetch<ListResponse>("/calendars/events/list", {
      after: new Date().toISOString(),
      sort_column: "start_at",
      sort_direction: "asc",
      pagination_limit: 50,
      pagination_cursor: cursor,
    });

    events.push(...data.entries);
    if (!data.has_more || !data.next_cursor || events.length >= limit) break;
    cursor = data.next_cursor;
  }

  return events.slice(0, limit);
}

/**
 * Past events, most recent first — for the "what happens here" proof on the
 * events page when the upcoming list is thin.
 */
export async function getPastEvents(limit = 6): Promise<LumaEvent[]> {
  const data = await lumaFetch<ListResponse>("/calendars/events/list", {
    before: new Date().toISOString(),
    sort_column: "start_at",
    sort_direction: "desc",
    pagination_limit: limit,
  });
  return data.entries;
}

/**
 * Past events, degrading the same way `safeUpcomingEvents` does. The events
 * page renders these beside live content, so a Luma outage must not take the
 * page down with it.
 */
export async function safePastEvents(limit = 6): Promise<LumaEvent[]> {
  if (!isLumaConfigured()) {
    return IS_PREVIEW ? samplePastEvents(limit) : [];
  }
  try {
    return await getPastEvents(limit);
  } catch (error) {
    console.error("[luma] failed to load past events", error);
    return [];
  }
}

/** One event, with its description. Used by the event detail page. */
export async function getEvent(id: string): Promise<LumaEventDetail> {
  return lumaFetch<LumaEventDetail>("/events/get", { event_id: id });
}

/**
 * Never let a third-party outage take down a public page. Callers that render
 * events alongside other content use this and degrade to an empty list.
 */
export async function safeUpcomingEvents(limit = 24): Promise<LumaEvent[]> {
  if (!isLumaConfigured()) {
    return IS_PREVIEW ? sampleUpcomingEvents(limit) : [];
  }
  try {
    return await getUpcomingEvents(limit);
  } catch (error) {
    console.error("[luma] failed to load upcoming events", error);
    return [];
  }
}

// ─── Display helpers ────────────────────────────────────────────────────────

/** "Rand Building · San Antonio", or "Online" for a virtual event. */
export function eventLocation(event: LumaEvent): string {
  if (event.location_type && event.location_type !== "offline") {
    return "Online";
  }

  const geo = event.geo_address_json;
  if (!geo) return "Location shared on registration";

  return [geo.address, geo.city_state ?? geo.city].filter(Boolean).join(" · ");
}

/** True when the event is capped and nearly full — worth surfacing on a card. */
export function isNearlyFull(event: LumaEvent): boolean {
  return typeof event.spots_remaining === "number" && event.spots_remaining <= 5;
}

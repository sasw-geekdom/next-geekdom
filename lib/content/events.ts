import "server-only";

import { unstable_cache } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type EventDoc } from "@/lib/firebase/collections";
import { THIS_MONTH } from "@/lib/site";
import { eventDateLabel } from "@/lib/content/dates";

/*
  "THIS MONTH IN THE CLUB", read from the `events` collection the admin edits.

  CACHED, AND TAGGED. The homepage is prerendered; a Firestore read per visit
  would undo that. `unstable_cache` keeps the list until an admin save calls
  `updateTag(EVENTS_TAG)` (lib/content/event-actions.ts) — which is why it,
  and not `"use cache"`, is used: this app doesn't enable cacheComponents,
  and `unstable_cache` also persists across deployments and instances.

  FALLS BACK TO lib/site.ts, NEVER FAILS. An empty collection (before anyone
  presses "Copy from the current site") or an unreachable Firestore (a build
  without credentials — CI, a fresh clone) renders the static THIS_MONTH.
  The fetch THROWS on error rather than returning the fallback, so a
  transient failure is not cached as if it were the answer.
*/

export const EVENTS_TAG = "events";

export interface SiteEvent {
  id: string;
  title: string;
  href: string;
  host: string | null;
  startsAt: string; // ISO
  endsAt: string; // ISO
  /** "Oct 27" in Central time. */
  dateLabel: string;
}

function iso(t: Timestamp): string {
  return t.toDate().toISOString();
}

export function toSiteEvent(id: string, d: EventDoc): SiteEvent {
  const startsAt = iso(d.startsAt);
  return {
    id,
    title: d.title,
    href: d.href,
    host: d.host ?? null,
    startsAt,
    endsAt: iso(d.endsAt),
    dateLabel: eventDateLabel(startsAt),
  };
}

function fallback(): SiteEvent[] {
  return THIS_MONTH.map((e, i) => ({
    id: `site-${i}`,
    title: e.title,
    href: e.href,
    host: e.host ?? null,
    startsAt: new Date(e.startsAt).toISOString(),
    endsAt: new Date(e.endsAt).toISOString(),
    dateLabel: eventDateLabel(e.startsAt),
  }));
}

/** Every event, oldest first. Uncached — the admin's view. */
export async function listEvents(): Promise<SiteEvent[]> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.events)
    .orderBy("startsAt", "asc")
    .get();
  return snap.docs.map((doc) => toSiteEvent(doc.id, doc.data() as EventDoc));
}

/*
  Events that haven't ENDED, in start order. Only events ending after the
  start of today are read — past rows stay in Firestore (the admin can see
  them) but never travel to the homepage.
*/
const readUpcoming = unstable_cache(
  async (): Promise<{ seeded: boolean; events: SiteEvent[] }> => {
    const col = getAdminDb().collection(COLLECTIONS.events);
    const dayStart = new Date();
    dayStart.setUTCHours(0, 0, 0, 0);
    const [upcoming, any] = await Promise.all([
      col.where("endsAt", ">=", Timestamp.fromDate(dayStart)).get(),
      col.limit(1).get(),
    ]);
    const events = upcoming.docs
      .map((doc) => toSiteEvent(doc.id, doc.data() as EventDoc))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return { seeded: !any.empty, events };
  },
  ["events:upcoming"],
  // An hour, as a floor: the list must also change when an event ENDS,
  // which no admin save announces. The homepage regenerates hourly too.
  { tags: [EVENTS_TAG], revalidate: 3600 },
);

/**
 * What the homepage and the portal dashboard render: events that haven't
 * ended yet. `now` is filtered here, not in the cache, so a cached list
 * still drops a row the moment its event is over.
 */
export async function getUpcomingEvents(): Promise<SiteEvent[]> {
  let events: SiteEvent[];
  try {
    const result = await readUpcoming();
    events = result.seeded ? result.events : fallback();
  } catch {
    events = fallback();
  }
  const now = Date.now();
  return events.filter((e) => Date.parse(e.endsAt) > now);
}

/** THIS_MONTH as Firestore docs — "Copy from the current site". */
export function seedEvents(): Omit<EventDoc, "createdAt" | "updatedAt">[] {
  return THIS_MONTH.map((e) => ({
    title: e.title,
    href: e.href,
    ...(e.host ? { host: e.host } : {}),
    startsAt: Timestamp.fromDate(new Date(e.startsAt)),
    endsAt: Timestamp.fromDate(new Date(e.endsAt)),
  }));
}

import type { LumaEvent, LumaEventDetail } from "@/lib/luma";
import { LOCATION } from "@/lib/site";

/**
 * Stand-in calendar for preview deploys, so the event card and the events
 * narrative can actually be reviewed before the Luma key exists.
 *
 * Dates are computed relative to the request, not hard-coded, because a fixed
 * date is a preview that quietly rots — a week after it's written every event
 * has moved into the past, the upcoming list empties out, and the page the
 * reviewer was sent to look at is blank again.
 *
 * The mix is deliberate: it's the range named on the events page — a meetup, a
 * build session, office hours, a fireside chat, a pitch night — with a
 * members-only entry so that treatment gets seen, and one nearly-full event so
 * the `isNearlyFull` badge does too.
 */

const ADDRESS = {
  address: LOCATION.street,
  city: LOCATION.city,
  region: LOCATION.state,
  country: "USA",
  city_state: `${LOCATION.city}, ${LOCATION.state}`,
  full_address: `${LOCATION.street}, ${LOCATION.city}, ${LOCATION.state}`,
};

/** A date `days` out from now, pinned to a sensible hour in local time. */
function at(days: number, hour: number, minutes = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minutes, 0, 0);
  return d;
}

interface Seed {
  id: string;
  name: string;
  /** Days from now — negative for past events. */
  days: number;
  hour: number;
  hours: number;
  visibility?: LumaEvent["visibility"];
  spots?: number | null;
  /** Cover art, from the third-floor photography already in `public/photos`. */
  cover?: string;
}

const UPCOMING: Seed[] = [
  { id: "evt-s1devsa01", name: "DEVSA Monthly Meetup", days: 4, hour: 18, hours: 3, spots: null, cover: "the-crowd" },
  { id: "evt-s2build02", name: "Build Session: Ship Something Small", days: 6, hour: 17, hours: 3, spots: 12, cover: "programming" },
  { id: "evt-s3hours03", name: "Office Hours with Mentors", days: 9, hour: 9, hours: 3, visibility: "members-only", spots: 4, cover: "one-on-one" },
  { id: "evt-s4fires04", name: "Fireside: Founders Who Stayed", days: 13, hour: 18, hours: 2, spots: 31, cover: "fireside" },
  { id: "evt-s5pitch05", name: "Pitch Night", days: 20, hour: 18, hours: 3, spots: 2, cover: "pitch" },
  // Deliberately left without cover art — roughly one in six Luma events has
  // none, and the card's flat-band fallback needs reviewing too.
  { id: "evt-s6coffee06", name: "Third Floor Coffee", days: 25, hour: 8, hours: 2, spots: null },
];

const PAST: Seed[] = [
  { id: "evt-p1demo07", name: "Demo Day: Summer Cohort", days: -9, hour: 18, hours: 3, spots: 0, cover: "speaking" },
  { id: "evt-p2hours08", name: "Office Hours with Mentors", days: -16, hour: 9, hours: 3, visibility: "members-only", spots: 0, cover: "the-cafe" },
  { id: "evt-p3design09", name: "Design Critique Night", days: -23, hour: 18, hours: 2, spots: 0, cover: "make-a-point" },
];

function toEvent(seed: Seed): LumaEvent {
  const start = at(seed.days, seed.hour);
  const end = new Date(start.getTime() + seed.hours * 60 * 60 * 1000);
  return {
    id: seed.id,
    name: seed.name,
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    timezone: "America/Chicago",
    // Points at the real public calendar rather than a dead link, so a
    // reviewer clicking through lands somewhere sensible.
    url: "https://luma.com/geekdom",
    // Served straight from `public/photos` rather than a static import: the
    // field mirrors Luma's, which is a remote URL string, and next/image
    // handles a root-relative path the same way.
    cover_url: seed.cover ? `/photos/${seed.cover}.jpg` : undefined,
    visibility: seed.visibility ?? "public",
    location_type: "offline",
    geo_address_json: ADDRESS,
    spots_remaining: seed.spots,
    registration_open: true,
  };
}

export function sampleUpcomingEvents(limit = 24): LumaEvent[] {
  return UPCOMING.slice(0, limit).map(toEvent);
}

export function samplePastEvents(limit = 6): LumaEvent[] {
  return PAST.slice(0, limit).map(toEvent);
}

/**
 * Blurb for the detail page, so the event route can be reviewed too.
 *
 * Keyed by seed id rather than written into `Seed`, because only this one
 * field is detail-only — putting it on every seed would imply the list cards
 * use it.
 */
const DESCRIPTIONS: Record<string, string> = {
  "evt-s1devsa01":
    "DEVSA runs this one, and it fills the cafe. Two short talks from people building locally, then an hour where nobody leaves because the actual conversation started at the end of the second talk.\n\nOpen to everyone. Come early if you want a seat at the long table.",
  "evt-s2build02":
    "Three hours, heads down, with the goal of shipping something before you leave. Bring the thing you keep not finishing.\n\nNo talks, no agenda. A room of people working, and someone to ask when you get stuck.",
  "evt-s3hours03":
    "Mentors on the calendar for the specific problem, not a general chat. Book a slot, bring the thing that is blocking you, and get thirty minutes with someone who has already hit that wall.\n\nMembers only.",
  "evt-s4fires04":
    "A conversation with founders who built here and stayed here. What the first two years actually cost, what they would do differently, and what kept them in San Antonio.",
  "evt-s5pitch05":
    "Five founders, five minutes each, then questions from a room that will tell you the truth. Watching is as useful as pitching.",
  "evt-s6coffee06":
    "Coffee on the third floor, no agenda. The conversation that turns into a co-founder, a customer, or a check usually starts over one.",
  "evt-p1demo07":
    "The summer cohort showed what they built. Twelve teams, eight minutes each.",
  "evt-p2hours08": "Mentors on the calendar, for the specific problem.",
  "evt-p3design09":
    "Bring work in progress and get a real critique from people who design for a living.",
};

/** One sample event with its description, or undefined if the id is unknown. */
export function sampleEventDetail(id: string): LumaEventDetail | undefined {
  const seed = [...UPCOMING, ...PAST].find((s) => s.id === id);
  if (!seed) return undefined;

  const description = DESCRIPTIONS[id] ?? "";
  return { ...toEvent(seed), description, description_md: description };
}

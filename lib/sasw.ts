/**
 * SAN ANTONIO STARTUP + TECH WEEK, FOR THE /events FEATURE RAIL.
 *
 * ⚠️ THIS FILE IS A STOPGAP AND IT IS SUPPOSED TO BE DELETED. The rail on
 * /events is built to be fed by the Luma API; this is a hand-transcribed
 * stand-in so the layout can ship before the week it is about. When the Luma
 * calendar carries the week's sessions, `FeaturedEvent` below is the shape to
 * map `LumaEvent` onto and the array goes.
 *
 * WHY THAT MATTERS MORE THAN USUAL HERE. This repo already learned this
 * lesson once: `lib/site.ts` carries a note about `RELATED`, a second array of
 * the same four organisations as `ECOSYSTEM` that had already drifted before
 * anyone noticed — "two lists of the same four things is one list that will be
 * wrong". This is that pattern again, and worse, because the canonical list is
 * in ANOTHER REPO (`next-sasw`, `lib/schedule.ts`) on a site Geekdom also
 * runs, and a live schedule changes. Three defences:
 *
 *   1. It is DELIBERATELY SHORT. Eight of the twenty-odd sessions on the
 *      canonical list, not all of them, so the drift surface is small.
 *   2. EVERY ROW LINKS OUT to its page on sasw.co, so the authority is one
 *      click away and a visitor never has to trust this copy.
 *   3. IT DISARMS ITSELF. `saswIsCurrent()` goes false once the week ends and
 *      /events stops rendering the rail, so a stale schedule cannot outlive
 *      the event it describes.
 *
 * EVERY FIELD IS TRANSCRIBED from `FEATURED_SESSIONS`, `HEADLINE_SESSION`,
 * `ACCESS_GRANTED_SESSION` and `THE_MODEL_SESSION` in next-sasw's
 * lib/schedule.ts — titles, times and blurbs quoted exactly, venue names from
 * that repo's lib/locations.ts rather than guessed from room slugs. Same rule
 * `MILESTONES` and the Studio's figures carry: these are somebody else's
 * facts, so they are copied, not summarised.
 */

/**
 * One row in the rail.
 *
 * NAMED FOR THE SLOT, NOT FOR SASW, because Luma fills the same slot later.
 * The mapping is nearly one to one — `name` to `title`, `start_at` to `start`,
 * `url` to `href`, `geo_address_json` to `venue` — and the only field Luma has
 * no equivalent for is `circuit`, which is why it is optional.
 */
export interface FeaturedEvent {
  /** Stable key. The session's slug upstream; a Luma id later. */
  id: string;
  title: string;
  /** ISO 8601 WITH an offset. Central time, so -05:00 through the week. */
  start: string;
  end?: string;
  /** Somewhere a person can stand, not a room slug. */
  venue: string;
  /** "3rd Floor", when the venue alone is not enough to find the room. */
  venueDetail?: string;
  /** One of the week's five circuits, or "Social". Luma has no equivalent. */
  circuit?: string;
  blurb: string;
  /** Always external here — the canonical page for this session. */
  href: string;
}

/** Where the week lives. */
const SASW_URL = "https://www.sasw.co";

/**
 * The week itself.
 *
 * Dates as a real `Date` pair rather than the display string, because
 * `saswIsCurrent()` has to compare them. The display string stays in
 * `ECOSYSTEM` in lib/site.ts, which is where the homepage reads it — this does
 * NOT restate it, and the two must not both become sources of truth.
 *
 * Month is 0-indexed in the Date constructor, the same trap `CONTRACTS_END`
 * documents. `end` is the last MOMENT of Oct 2 rather than its midnight, so
 * the rail survives the final day it is describing.
 */
export const SASW = {
  name: "San Antonio Startup + Tech Week",
  href: SASW_URL,
  start: new Date(2026, 8, 28), // September 28
  end: new Date(2026, 9, 2, 23, 59, 59), // October 2, end of day
} as const;

/**
 * True while the week is still ahead or running.
 *
 * /events reads this and drops the rail once it goes false, so nobody has to
 * remember to take it down on October 3. The page revalidates every five
 * minutes, so the flip lands within five minutes of the deadline.
 */
export function saswIsCurrent(now: Date = new Date()): boolean {
  return now <= SASW.end;
}

/**
 * Eight sessions, chronological, spanning all five days.
 *
 * CHOSEN TO COVER THE CIRCUITS, not to rank the week: one Founder, two
 * Capital, two Tech & Builders, one AI & Applied Innovation, one Small
 * Business & Solopreneur and one Social. Three of them — The Model, Access
 * Granted and PySanAntonio II — are the week's own banded activations, and
 * three run on Geekdom's floor, which is the reason this rail belongs on
 * Geekdom's calendar rather than just linking to sasw.co and leaving.
 */
export const SASW_FEATURED: readonly FeaturedEvent[] = [
  {
    id: "the-model",
    title: "The Model",
    start: "2026-09-28T13:00:00-05:00",
    end: "2026-09-28T18:00:00-05:00",
    venue: "The Rand",
    venueDetail: "3rd Floor",
    circuit: "AI & Applied Innovation",
    blurb:
      "An afternoon that puts San Antonio's creative economy and the DEVSA community in one room — what comes next, and the local makers already building it.",
    href: `${SASW_URL}/schedule/the-model`,
  },
  {
    id: "mission-pitch",
    title: "Mission Pitch",
    start: "2026-09-28T18:00:00-05:00",
    end: "2026-09-28T20:00:00-05:00",
    venue: "Texas Public Radio",
    circuit: "Capital",
    blurb:
      "Five San Antonio nonprofits pitch from the main stage — and the room funds them on the night.",
    href: `${SASW_URL}/schedule/mission-pitch`,
  },
  {
    id: "1-million-cups",
    title: "1 Million Cups",
    start: "2026-09-30T09:00:00-05:00",
    end: "2026-09-30T11:00:00-05:00",
    venue: "Central Library",
    circuit: "Small Business & Solopreneur",
    blurb:
      "The weekly founder format, run at Launch SA HQ: present, take questions, leave with answers.",
    href: `${SASW_URL}/schedule/1-million-cups`,
  },
  {
    id: "access-granted",
    title: "Access Granted",
    start: "2026-09-30T13:00:00-05:00",
    end: "2026-09-30T18:00:00-05:00",
    venue: "The Rand",
    venueDetail: "3rd Floor",
    circuit: "Tech & Builders",
    blurb:
      "Every other room this week is people talking about technology. This one is people taking it apart — lockpicking, threat modeling, and zero-pitch technical talks.",
    href: `${SASW_URL}/schedule/access-granted`,
  },
  {
    id: "latin-tech-pitch",
    title: "Latin Tech Pitch",
    start: "2026-09-30T18:00:00-05:00",
    end: "2026-09-30T21:00:00-05:00",
    venue: "Texas Public Radio",
    circuit: "Capital",
    blurb:
      "Latino-led startups from across Texas, pitching for $110k in prizes and mentorship — presented with the Consulate General of Israel.",
    href: `${SASW_URL}/schedule/latin-tech-pitch`,
  },
  {
    id: "texas-venture-fest",
    title: "Texas Venture Fest",
    start: "2026-10-01T15:00:00-05:00",
    end: "2026-10-01T18:00:00-05:00",
    venue: "Texas Public Radio",
    circuit: "Founder",
    blurb:
      "Short firesides and three panels on the deals and the buildout that don't make headlines — and on where the ecosystem still falls short.",
    href: `${SASW_URL}/schedule/texas-venture-fest`,
  },
  {
    id: "startup-bash",
    title: "Startup Bash",
    start: "2026-10-01T18:00:00-05:00",
    end: "2026-10-01T20:00:00-05:00",
    venue: "Legacy Park",
    circuit: "Social",
    blurb:
      "Where the week unwinds. Open-air, the whole ecosystem in one place, no badge scanning.",
    href: `${SASW_URL}/schedule/startup-bash`,
  },
  {
    id: "pysanantonio-ii",
    title: "PySanAntonio II",
    start: "2026-10-02T13:00:00-05:00",
    end: "2026-10-02T18:00:00-05:00",
    venue: "The Rand",
    circuit: "Tech & Builders",
    blurb:
      "The city's Python conference, back for a second run — talks, workshops, and the people who build with it every day.",
    href: `${SASW_URL}/schedule/pysanantonio`,
  },
] as const;

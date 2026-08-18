/**
 * Site-wide constants: identity, the dates that drive the transition copy, and
 * navigation. Pure — safe to import from client components, email templates,
 * and the proxy alike.
 */

import { envOr } from "@/lib/env";

// Trailing slash stripped so `${SITE_URL}/apply` never doubles up.
export const SITE_URL = (
  envOr(process.env.NEXT_PUBLIC_SITE_URL, "http://localhost:3000")
).replace(/\/$/, "");

export const SITE_NAME = "Geekdom";

/** The line the whole site points at, straight from the members letter. */
export const TAGLINE = "Building San Antonio, one startup at a time.";

/**
 * The hook — the hero H1 and the share card.
 *
 * A claim, not an invitation, and pointed on purpose: every tool pitch this
 * year says to make software your unfair advantage. Geekdom's whole argument is
 * that the advantage was always the person next to you. Say that first and the
 * rest of the page is just evidence.
 *
 * "Unfair advantage" is native founder vocabulary, which is the audience this
 * line is aimed at. Everything softer sits below it.
 */
export const HOOK = "Make people your unfair advantage.";

/**
 * The promise — what you actually do about the hook.
 *
 * Carries the page <title> and search snippets rather than the hero, because
 * it's the plainer, more searchable of the two. HOOK is for the eye, PROMISE is
 * for the query.
 */
export const PROMISE = "Find your thinking partner.";

/**
 * The mission.
 *
 * Written in a deliberately borrowed register — short declaratives, parallel
 * verbs, partnership vocabulary, no jargon. The claim it makes is the same one
 * the members letter makes ("the point was the person sitting next to you"),
 * said forward instead of backward: the letter explains what Geekdom is leaving
 * behind, this explains what you get.
 *
 * The distinction that has to survive every future edit: the thinking partner
 * here is a PERSON, in a room, on the third floor. Not a tool, not a platform,
 * not software. If a rewrite ever makes this sound like it could be describing
 * an app, it's wrong.
 */
export const MISSION = [
  "Every hard problem gets easier with the right person across the table. Someone who breaks it down with you, builds on your idea, and pushes back when it needs pushing back.",
  "That person is hard to find on your own. So we built the room where they already are.",
] as const;

export const LOCATION = {
  // Downtown, one block off the Riverwalk.
  //
  // FLOOR — the members letter says the club consolidates to "the third floor
  // only". Geekdom's coworking era ran across the Rand's upper floors, so this
  // is a move, not a typo, and the letter is the newer source. If the club
  // actually lands on a different floor, this constant is the place to change.
  floor: "Third floor",
  // The building has a NAME, and it has to appear wherever the floor is used as
  // an address. On its own, "Third floor / 110 E Houston St" reads as though
  // the place is called "Third floor" — the floor is a position inside a
  // building, not the building. Geekdom is on the third floor OF THE RAND.
  building: "The Rand Building",
  street: "110 E Houston St",
  city: "San Antonio",
  state: "TX",
  zip: "78205",
  /** "Third floor, The Rand Building" — the first line of a postal address. */
  get line1() {
    return `${this.floor}, ${this.building}`;
  },
  /** Street, city, state, zip. No building, no floor. */
  get full() {
    return `${this.street}, ${this.city}, ${this.state} ${this.zip}`;
  },
  /** Everything, for a map query or a one-line address. */
  get postal() {
    return `${this.building}, ${this.full}`;
  },
} as const;

/**
 * Dates from the announcement. Month is 0-indexed in the Date constructor.
 *
 * `CONTRACTS_END` is the hard one — offices and dedicated desks wrap up on
 * September 25. The transition page counts down to it and switches to past
 * tense on its own once it passes, so nobody has to remember to edit copy.
 *
 * `CLUB_OPENS` is October 5, from the members FAQ: "fully operate the new club
 * membership starting October 5." It was October 1 here, which was a guess made
 * before that sheet existed — the kind of date a member plans around, so it is
 * worth being exact about.
 */
export const CONTRACTS_END = new Date(2026, 8, 25); // Sept 25
export const CLUB_OPENS = new Date(2026, 9, 5); // October 5

/** Years since Geekdom opened — "Fifteen years ago…" in the letter. */
export const FOUNDED_YEAR = 2011;

export const CONTACT_EMAIL = "members@geekdom.com";

/**
 * Who wrote the letter.
 *
 * The letter on /whats-changing is a real document that really went out, and an
 * unsigned letter reads as a corporate announcement rather than as someone
 * putting their name to a decision.
 */
export const LETTER_AUTHOR = {
  name: "Charles Woodin",
  role: "CEO",
  email: "charles@geekdom.com",
} as const;

/**
 * Named contacts from the members FAQ, by what they actually own.
 *
 * Routed by subject on purpose. "Email us" on a page about leases and refunds
 * sends the anxious question to a shared inbox and adds a hop; a member with a
 * billing problem should reach the person who can answer it.
 */
export const TEAM_CONTACTS = [
  {
    name: "Charles Woodin",
    role: "CEO",
    email: "charles@geekdom.com",
    topic: "The new direction",
  },
  {
    name: "Brooke Rodriguez",
    role: "Sr. Director of Operations",
    email: "brooke@geekdom.com",
    topic: "Leases and billing",
  },
  {
    name: "Leslie Chasnoff",
    role: "Director of Programs & Partnerships",
    email: "lesliechasnoff@geekdom.com",
    topic: "Programming and founder support",
  },
] as const;

/**
 * The free weekly gathering, off-site and open to everyone.
 *
 * Named here because it is the answer to "how do I stay connected if I don't
 * join" — the one concrete thing a non-member can turn up to.
 */
export const OPEN_COFFEE = {
  name: "SATX Open Coffee Club",
  when: "Tuesdays, 8–9:30 AM",
  where: "Creme Coffee and Social",
} as const;

/**
 * The track record, verbatim from Geekdom's own one-pager.
 *
 * These are the site's only hard numbers, and the single largest piece of proof
 * it has — every reference site in this space leads with figures like these and
 * we had none. Split into `figure` and `label` so the number can be set large
 * and the words small, rather than being one string nobody can typeset.
 *
 * TRANSCRIBED, NOT ESTIMATED. Do not round, restate, or "tidy" any of them:
 * $422.7M is not $400M+, and 151 is not 150+. They are claims Geekdom makes in
 * print and they should match it exactly.
 *
 * THEY ARE ALSO UNDATED. The one-pager carries no "as of", so these are a
 * point-in-time snapshot that will drift — jobs, members and dollars raised all
 * only go up. Worth asking Geekdom for the date they were last computed and
 * recording it here; a stale figure on a homepage is worse than no figure,
 * because it is checkable.
 */
export const MILESTONES = [
  { figure: "1,300+", label: "Geekdom members" },
  { figure: "151", label: "Active startups created" },
  { figure: "$422.7M", label: "Raised by startups" },
  { figure: "2,500+", label: "Jobs created by Geekdom startups" },
  { figure: "77", label: "Minority & women-led startups" },
  { figure: "$1.62M", label: "Invested in startups by Geekdom" },
] as const;

/**
 * The goal, from the same sheet. Stated as Geekdom states it.
 */
/**
 * NOT ON THE SITE, DELIBERATELY: the one-pager's four startup programs —
 * Startup Bootcamp, Incubator, Pre-Accelerator, Community Fund.
 *
 * They are LEGACY. The sheet still lists them because it predates the club, and
 * anyone reading it as a content source would reasonably assume they belong on
 * /the-floor or /membership. They don't — listing a program Geekdom no longer
 * runs is worse than listing nothing, because someone will apply to it.
 *
 * The milestones above and the goal below are the parts of that sheet that
 * still hold.
 */

export const GOAL =
  "To launch the next 500 startups, with at least 75% calling San Antonio home.";

/**
 * The partner wall and the member voices — the SHAPES only.
 *
 * The entries themselves are mock content and live in `data/mock/`, kept out of
 * lib on purpose: one folder to open and delete when the real content arrives,
 * rather than placeholder arrays buried among constants that are real.
 *
 * Both are destined for the CMS the admin portal will grow — the same shape
 * sponsors and partners already have in the sibling repo.
 */
export interface Partner {
  name: string;
  /** Their site. Omit rather than guess a URL. */
  href?: string;
  /**
   * Path under /public. OPTIONAL — without it the name renders as a wordmark.
   *
   * That fallback is not just for mock data: it lets Geekdom add a partner the
   * day it is agreed rather than the day someone digs out an EPS, and a set of
   * wordmarks is more legible than a row of mismatched logos anyway.
   *
   * When real files do arrive, ask for SINGLE-COLOUR versions. Marks vary in
   * polarity — a white logo dies on sand, a dark one dies on ink — and a mixed
   * set cannot share one band without boxing each logo, which turns a credit
   * line into a sponsor grid.
   */
  logo?: string;
  /** Tailwind height for the mark, e.g. "h-7 sm:h-8". Ignored for wordmarks. */
  height?: string;
}


export interface MemberVoice {
  /** One or two sentences. Long quotes stop being read. */
  quote: string;
  name: string;
  /** "Co-founder, Acme" — the role is what makes the quote weigh anything. */
  role: string;
}


/** Who runs the floors Geekdom is handing back. Named in the members FAQ. */
export const PROPERTY_OWNER = "Weston Urban";

export const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/geekdom/" },
  { label: "Instagram", href: "https://www.instagram.com/geekdomsa" },
  { label: "X", href: "https://twitter.com/Geekdom" },
  { label: "YouTube", href: "https://www.youtube.com/c/Geekdomsa" },
] as const;

/** Public calendar the events page links out to when Luma isn't configured. */
export const LUMA_CALENDAR_URL =
  envOr(process.env.NEXT_PUBLIC_LUMA_CALENDAR_URL, "https://luma.com/geekdom");

export interface NavLink {
  href: string;
  label: string;
}

export const NAV: NavLink[] = [
  { href: "/membership", label: "Membership" },
  { href: "/the-floor", label: "The Floor" },
  { href: "/events", label: "Events" },
  { href: "/whats-changing", label: "What's Changing" },
];

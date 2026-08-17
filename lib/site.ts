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
  // The Rand Building, downtown, one block off the Riverwalk.
  //
  // FLOOR — the members letter says the club consolidates to "the third floor
  // only". Geekdom's coworking era ran across the Rand's upper floors, so this
  // is a move, not a typo, and the letter is the newer source. If the club
  // actually lands on a different floor, this constant and the copy in
  // components/site/the-floor.tsx are the only two places to change.
  floor: "Third floor",
  street: "110 E Houston St",
  city: "San Antonio",
  state: "TX",
  zip: "78205",
  get full() {
    return `${this.street}, ${this.city}, ${this.state} ${this.zip}`;
  },
} as const;

/**
 * Dates from the announcement. Month is 0-indexed in the Date constructor.
 *
 * `CONTRACTS_END` is the hard one — offices and dedicated desks wrap up on
 * September 25. The transition page counts down to it and switches to past
 * tense on its own once it passes, so nobody has to remember to edit copy.
 */
export const CONTRACTS_END = new Date(2026, 8, 25); // Sept 25
export const CLUB_OPENS = new Date(2026, 9, 1); // October

/** Years since Geekdom opened — "Fifteen years ago…" in the letter. */
export const FOUNDED_YEAR = 2011;

export const CONTACT_EMAIL = "members@geekdom.com";

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

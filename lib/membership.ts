/**
 * The membership.
 *
 * Singular on purpose — the members letter is explicit: "One membership. No
 * dedicated desks. No offices." There is no tier array here and there should
 * not be one. If Geekdom ever adds a second tier, that's a real product change
 * and this file should grow a proper list rather than getting a second
 * hardcoded constant bolted on beside this one.
 *
 * Pure module (no server-only imports) so the pricing copy renders in the
 * browser, in email templates, and in the admin portal from one source.
 */

/**
 * Monthly price in cents, or `null` while pricing is unannounced.
 *
 * $100/month — the same number the coworking-era Community tier carried, which
 * is worth knowing: for a former community member the price didn't move, the
 * thing you get for it did.
 *
 * Keep this in step with the Stripe price. NOTHING ENFORCES THAT THEY MATCH —
 * this constant is display copy, and the amount actually charged is whatever
 * `STRIPE_MEMBERSHIP_PRICE_ID` points at. Changing the number here without
 * changing the Stripe price means the site advertises one figure and the card
 * gets charged another.
 *
 * Setting this back to `null` is supported: every price surface checks
 * `isPriceAnnounced()` and falls back to "pricing coming soon" with the
 * apply-first flow intact.
 */
export const MEMBERSHIP_PRICE_CENTS: number | null = 10_000;

export const MEMBERSHIP_INTERVAL = "month" as const;

export function isPriceAnnounced(): boolean {
  return MEMBERSHIP_PRICE_CENTS !== null;
}

/** "$250" — no trailing ".00" on whole-dollar amounts. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Price for display, or null while unannounced. */
export function priceLabel(): string | null {
  return MEMBERSHIP_PRICE_CENTS === null
    ? null
    : `${formatPrice(MEMBERSHIP_PRICE_CENTS)}/${MEMBERSHIP_INTERVAL}`;
}

export interface Benefit {
  title: string;
  description: string;
}

/**
 * What the membership actually gets you.
 *
 * Every item comes from the letter's list of what the third floor becomes —
 * don't invent a benefit Geekdom hasn't promised. Order is deliberate: the
 * people first, the programming second, the logistics last, because that's the
 * argument the letter makes.
 *
 * Written as concrete deliverables in second person, not abstractions. "A cafe
 * for your coffee chats" is a thing you can picture using on a Tuesday;
 * "curated networking opportunities" is not. If an edit makes one of these
 * sound like a brochure, it's gone the wrong way.
 */
export const BENEFITS: Benefit[] = [
  {
    title: "The room",
    description:
      "The third floor and everyone on it. Founders, engineers, and creators; the operators and investors who've done it before; the corporate and civic leaders who want a hand in what this city becomes.",
  },
  {
    title: "Office hours",
    description:
      "Bring the thing that's blocking you to someone who's already hit that wall. Mentors on the calendar, for the specific problem — not a general chat.",
  },
  {
    title: "Build sessions",
    description:
      "Heads down, together, with the goal of shipping something before you leave. Meetups, fireside chats, and pitch nights fill the rest of the week.",
  },
  {
    title: "Retreats",
    description:
      "Time away from the room with the people you'd want in it. Small, focused, built around what your company needs next.",
  },
  {
    title: "Drop-in workspace",
    description:
      "Sit down and work when you need to focus. No assigned seat, no contract, nothing with your name taped to it.",
  },
  {
    title: "The cafe",
    description:
      "For your coffee chats. The conversation that turns into a co-founder, a customer, or a check usually starts over one.",
  },
  {
    title: "Meeting rooms",
    description:
      "Reserve a room with a door for the deep dives, the brainstorms, and the offsite your team keeps postponing.",
  },
  {
    title: "Beyond the room",
    description:
      "Virtual platforms that keep you connected between visits, so the momentum doesn't stop when you walk out.",
  },
];

/** What the membership is explicitly not — the letter is blunt about this. */
export const NOT_INCLUDED = [
  "Dedicated desks",
  "Private offices",
  "Coworking contracts",
] as const;

/**
 * Who this is for. The letter names these groups directly; the apply form
 * offers the same list so the admin queue sorts along the same lines.
 */
export const AUDIENCES = [
  "Founder",
  "Engineer or builder",
  "Creator",
  "Operator",
  "Investor",
  "Corporate or civic leader",
] as const;

export type Audience = (typeof AUDIENCES)[number];

/** Company stage — drives how the review queue gets triaged. */
export const STAGES = [
  "Idea",
  "Pre-revenue",
  "Early revenue",
  "Growth",
  "Not building a company right now",
] as const;

export type Stage = (typeof STAGES)[number];

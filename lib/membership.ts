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

/**
 * The price as a SENTENCE — "$100 per month" — rather than a rate.
 *
 * `Source Copy v1` writes /club's Membership headline as "$100 per month.
 * Application-based.", and "$100/month. Application-based." is a different
 * line: a slash reads as a rate card, which is the register that page spends
 * seven sections avoiding.
 *
 * Still derived from `MEMBERSHIP_PRICE_CENTS` rather than typed, so the
 * figure cannot drift from Stripe — the rule the rest of this file carries.
 * Returns null on the same terms as `priceLabel`.
 */
export function priceSentence(): string | null {
  return MEMBERSHIP_PRICE_CENTS === null
    ? null
    : `${formatPrice(MEMBERSHIP_PRICE_CENTS)} per ${MEMBERSHIP_INTERVAL}`;
}

export interface Benefit {
  title: string;
}

/**
 * What the membership includes — Geekdom's list, in Geekdom's order.
 *
 * TITLES ONLY. This used to carry a sentence of description per item, written
 * from the members letter; Geekdom asked for the list without descriptions
 * ("too text heavy") and then replaced the items outright with the ten below.
 * Don't reorder or add to them — the order is theirs.
 */
export const BENEFITS: Benefit[] = [
  { title: "24/7 workspace" },
  { title: "Event and meeting space" },
  { title: "Phone booths and call rooms" },
  { title: "Member Slack and directory" },
  { title: "The cafe" },
  { title: "Guests" },
  { title: "Socials" },
  { title: "Meetups" },
  { title: "Build sessions" },
  { title: "Exclusive events" },
];

/** What the membership is explicitly not — the letter is blunt about this. */
export const NOT_INCLUDED = [
  "Dedicated desks",
  "Private offices",
  "Coworking contracts",
] as const;

/**
 * THE GENEROSITY BAR.
 *
 * The brand guide singles this line out and tells you where to use it:
 * "anywhere the tone risks turning gate-keepy. It reframes selectivity as
 * culture instead of prestige." An application-based club describing who it is
 * and isn't for is the sharpest such moment on the site, so it opens that
 * section rather than sitting under it.
 */
export const GENEROSITY_BAR =
  "The bar isn’t impressiveness. It’s generosity.";

/**
 * Who the Club is for — /club's "A good fit" list, the source copy's wording.
 *
 * Its partner, "Not the right fit right now" (coworking-seekers and small
 * business owners, plus a referral line), came off at Geekdom's request. The
 * disqualifier still reaches readers: /club's opening says "It's not
 * coworking. It's not an accelerator."
 */
export const GOOD_FIT = [
  "Aspiring and current founders",
  "Engineers, developers, creators, technical builders",
  "Operators and investors working with scalable, high-growth companies",
  "Startup service providers whose work is oriented around startups",
  "Innovators looking to up their game with other ambitious and interesting people",
  "Corporate and civic leaders who want a hand in San Antonio’s innovation economy",
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

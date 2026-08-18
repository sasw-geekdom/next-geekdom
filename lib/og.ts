import { priceLabel } from "@/lib/membership";
import { LOCATION } from "@/lib/site";

/**
 * The share cards, one per page.
 *
 * These are RENDERED TO PNG AHEAD OF TIME, not generated per request — run
 * `npm run og` and the files land in each route's folder as
 * `opengraph-image.png`, which is a Next file convention resolved per segment.
 * The reasoning for that is in scripts/og.mjs; the short version is that the
 * visual is a live WebGL shader, and no server-side image generator can run
 * one.
 *
 * Copy lives here rather than in the card component so the whole set can be
 * read at once. A share card is the only piece of this site a person sees
 * before they have decided whether to click, so the seven headlines below want
 * to be compared side by side, not hunted for across seven files.
 *
 * EVERY CARD IS TWO LINES, and the second is the gold one. Satori isn't
 * involved so this is real CSS, but the constraint stays: the break is chosen
 * rather than measured, and a third line collides with the crown.
 *
 * KEEP EACH LINE UNDER ROUGHLY 21 CHARACTERS. At 76px the type reaches the
 * crown's left edge at about that point and the last letter of the line
 * disappears into the pigment. Two of these cards were drafted at 22 and 23 and
 * both collided, so the number is measured rather than guessed — but it is a
 * proxy for width, not width itself, and a line of capitals or wide letterforms
 * will run out sooner. Render the set and look at it: `npm run og`.
 */
export interface OgCard {
  /** Mono kicker. Gold — this is an ink ground. */
  eyebrow: string;
  /** Exactly two lines. The second renders in gold. */
  lines: readonly [string, string];
  /**
   * Where in the shader's timeline this card's pigment is frozen.
   *
   * The field is two drifting drops, so the moment you sample it decides the
   * shape inside the crown. Fixing a different second per card gives each page
   * its own pigment while every one of them is demonstrably the same system —
   * and fixing it AT ALL is what stops `npm run og` producing a fresh binary
   * diff for seven PNGs every time it runs.
   */
  seed: number;
  /** Path under app/, where the Next file convention picks it up. */
  out: string;
  /** Becomes the `.alt.txt` sidecar, which Next emits as og:image:alt. */
  alt: string;
}

const price = priceLabel();

export const OG_CARDS: Record<string, OgCard> = {
  /*
    The root card, so it also covers any page without one of its own —
    /apply/thanks, /welcome, /account. Those are noindex, but a member pasting
    an invoice link into a chat still unfurls something.
  */
  home: {
    eyebrow: `${LOCATION.city} · Since 2011`,
    lines: ["Make people your", "unfair advantage."],
    seed: 3.4,
    out: "app/opengraph-image.png",
    alt: "Geekdom — Make people your unfair advantage. A membership club for founders and builders in San Antonio.",
  },

  /*
    The price IS the card, the same call the page makes. A membership card that
    leads with anything else invites the click that ends in "so what does it
    cost" — and the figure is the single most-asked question in the FAQ sheet.
  */
  membership: {
    eyebrow: "Membership",
    lines: ["One membership.", price ? `${price}.` : "No desks. No offices."],
    seed: 11.8,
    out: "app/(site)/membership/opengraph-image.png",
    alt: price
      ? `Geekdom membership — one membership, ${price}.`
      : "Geekdom membership — one membership, no desks, no offices.",
  },

  "the-floor": {
    eyebrow: `${LOCATION.floor} · ${LOCATION.street}`,
    lines: ["One floor. All of it", "pointed at one thing."],
    seed: 19.6,
    out: "app/(site)/the-floor/opengraph-image.png",
    alt: "The Geekdom floor — one floor, all of it pointed at one thing. Third floor, 110 E Houston St, San Antonio.",
  },

  /*
    Inherited by /events/[slug] too, which is deliberate: an event with no cover
    art on Luma unfurls as this rather than as the homepage. An event that HAS
    cover art overrides it in generateMetadata, because the poster the organiser
    made is a better card than anything generic.
  */
  events: {
    eyebrow: "The calendar",
    // "The best conversations / happen in the room." is the page's own closing
    // line and it is the better sentence, but at 22 characters the first line
    // ran into the crown. This says the same thing in the events page's other
    // voice — the invitation it makes to people who aren't members yet.
    lines: ["Come see how", "the room feels."],
    seed: 27.2,
    out: "app/(site)/events/opengraph-image.png",
    alt: "Geekdom events — meetups, build sessions, office hours and pitch nights on the third floor. Come see how the room feels.",
  },

  "whats-changing": {
    eyebrow: "A letter to our members",
    // The letter's other famous line, because "The space changes. / The people
    // in it don't." overflows at 23 characters. Both are load-bearing sentences
    // from the same paragraph and neither can be paraphrased to fit — so this
    // takes the one that already fits rather than editing a real letter.
    lines: ["The desk was", "never the point."],
    seed: 34.9,
    out: "app/(site)/whats-changing/opengraph-image.png",
    alt: "What's changing at Geekdom — the desk was never the point. The letter to members, in full.",
  },

  faq: {
    eyebrow: "Questions",
    lines: ["The ones members", "actually asked."],
    seed: 42.5,
    out: "app/(site)/faq/opengraph-image.png",
    alt: "Geekdom FAQ — what happens to desks and offices, what the membership includes, what it costs, and how to apply.",
  },

  apply: {
    eyebrow: "Apply for membership",
    lines: ["Tell us what you're", "working on."],
    seed: 50.1,
    out: "app/(site)/apply/opengraph-image.png",
    alt: "Apply for membership at Geekdom — a club for founders and builders in San Antonio.",
  },
};

export const OG_SIZE = { width: 1200, height: 630 } as const;

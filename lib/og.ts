import { priceLabel } from "@/lib/membership";
import {
  FOUNDED_YEAR,
  LOCATION,
  POSITIONING,
  PROMISE,
  SITE_NAME,
} from "@/lib/site";

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
 * EVERY CARD IS TWO LINES, and the second carries the accent. Satori isn't
 * involved so this is real CSS, but the constraint stays: the break is chosen
 * rather than measured, and a third line collides with the crown.
 *
 * THE ACCENT IS CLAY, NOT GOLD. This file said gold in three places and the
 * cards have not rendered gold since the 2026 palette landed — there is no
 * gold in the brand at all now. The comments were describing a colour the
 * renderer had already stopped using.
 *
 * KEEP EACH LINE UNDER ROUGHLY 21 CHARACTERS. At 76px the type reaches the
 * crown's left edge at about that point and the last letter of the line
 * disappears into the pigment. Two of these cards were drafted at 22 and 23 and
 * both collided, so the number is measured rather than guessed — but it is a
 * proxy for width, not width itself, and a line of capitals or wide letterforms
 * will run out sooner. Render the set and look at it: `npm run og`.
 */
export interface OgCard {
  /** Mono kicker. Bone on the graphite ground — Clay fails at this size. */
  eyebrow: string;
  /** Exactly two lines. The second renders in Clay. */
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

/*
  "Find your thinking partner." -> ["Find your", "thinking partner."]
  Two words, then the rest. Both halves land under the 21-character ceiling.
*/
const PROMISE_WORDS = PROMISE.split(" ");
const PROMISE_LINES: readonly [string, string] = [
  PROMISE_WORDS.slice(0, 2).join(" "),
  PROMISE_WORDS.slice(2).join(" "),
];

export const OG_CARDS: Record<string, OgCard> = {
  /*
    The root card, so it also covers any page without one of its own —
    /apply/thanks, /welcome, /account. Those are noindex, but a member pasting
    an invoice link into a chat still unfurls something.
  */
  home: {
    eyebrow: `${LOCATION.city} · Since 2011`,
    /*
      THE CARD AND THE <title> HAVE TO AGREE, because a search result and a
      Slack unfurl show them together.

      This card read "Make people your unfair advantage." — HOOK, which was
      the h1 for the life of the old site and is now the line that CLOSES the
      homepage. The rebuild moved it there deliberately: as an opening claim it
      competed with the positioning line. The card kept making the demoted
      argument, directly above a title making the other one.

      POSITIONING is the h1 and would be the obvious fix, but it is 52
      characters against the ~21-per-line limit above and there is no honest
      two-line break in it. PROMISE is what the title already uses, it splits
      cleanly, and it is the forward-facing claim.

      SPLIT FROM THE CONSTANT rather than retyped, so a reworded PROMISE cannot
      leave the old words sitting on the card.
    */
    lines: PROMISE_LINES,
    seed: 3.4,
    out: "app/opengraph-image.png",
    alt: `Geekdom — ${PROMISE} ${POSITIONING}`,
  },

  /*
    The price IS the card, the same call the page makes. A membership card that
    leads with anything else invites the click that ends in "so what does it
    cost" — and the figure is the single most-asked question in the FAQ sheet.
  */
  club: {
    eyebrow: "The Club",
    lines: ["One membership.", price ? `${price}.` : "No desks. No offices."],
    seed: 11.8,
    out: "app/(site)/club/opengraph-image.png",
    alt: price
      ? `The Geekdom Club — one membership, ${price}.`
      : "The Geekdom Club — one membership, no desks, no offices.",
  },

  /*
    THE STUDIO'S CARD LEADS WITH THE DISQUALIFIER, which is the opposite of
    what a card usually does and is right here. The Club's card leads with the
    price because the price is the last objection; this one leads with
    "invitation only" because the single most costly outcome for this page is a
    founder clicking through, reading four screens, and discovering there is
    nothing to apply to. Better to say it in the unfurl.
  */
  studio: {
    eyebrow: "Studio · The venture layer",
    lines: ["We go all in with", "a few founders a year."],
    seed: 7.2,
    out: "app/(site)/studio/opengraph-image.png",
    alt: "Geekdom Studio — the venture layer. $20–30K SAFE checks and hands-on work for four to six San Antonio founders a year. Invitation only.",
  },


  /*
    Inherited by /events/[slug] too, which is deliberate: an event with no cover
    art on Luma unfurls as this rather than as the homepage. An event that HAS
    cover art overrides it in generateMetadata, because the poster the organizer
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
    /*
      MATCHES THE PAGE'S OWN <h1>, the same rule the home card follows: a card
      and a title show up together in a search result and an unfurl, so they
      should not make two different claims.

      It read "The ones members actually asked", which was true when the page
      was the transition sheet and is not any more. The lease, refund and
      prorated-credit questions have been retired — every member they were
      written for was spoken to directly — and what is there now includes the
      Studio and downtown parking, which no member asked for in that sheet.
    */
    lines: ["The practical", "stuff."],
    seed: 42.5,
    out: "app/(site)/faq/opengraph-image.png",
    // Was "what happens to desks and offices". See the note on the page's own
    // description — the desk belongs to the letter, not to the FAQ.
    alt: "Geekdom FAQ — what club membership costs and includes, how to apply, how the Studio works, and where to park downtown.",
  },

  apply: {
    eyebrow: "Apply for membership",
    lines: ["Tell us what you're", "working on."],
    seed: 50.1,
    out: "app/(site)/apply/opengraph-image.png",
    alt: "Apply for membership at Geekdom — a club for founders and builders in San Antonio.",
  },

  /*
    THE EASTER EGG GETS A CARD, because a hidden page is the one most likely to
    arrive as a bare link — somebody finds it behind the footer wordmark and
    pastes it. Without this it unfurled the root card, which says "Find your
    thinking partner" and gives no hint you are being shown fifteen years of
    photographs.

    NO YEAR COUNT ON IT, and this is the trap the page itself avoids. The page
    computes `years` from FOUNDED_YEAR precisely so the heading never goes
    stale — but a share card is a STATIC PNG. Baking "15 years" into it means
    that in January the card says fifteen while the page it links to says
    sixteen, and nothing would catch it because nothing re-renders. The eyebrow
    carries `Since 2011`, which is a fixed fact, and the lines are drawn from
    the page's own editorial line instead.

    It stays out of the sitemap regardless — a card is for a link somebody
    chose to share, not an invitation to crawl it.
  */
  "since-2011": {
    eyebrow: `Since ${FOUNDED_YEAR} · ${LOCATION.city}`,
    lines: ["The people who", "showed up."],
    seed: 58.6,
    out: "app/(site)/since-2011/opengraph-image.png",
    alt: `${SITE_NAME} — the photo wall. The people, the pitches, the late nights, and the community that showed up. Since ${FOUNDED_YEAR}.`,
  },
};

export const OG_SIZE = { width: 1200, height: 630 } as const;

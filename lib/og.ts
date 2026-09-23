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
 * RENDERED TO PNG AHEAD OF TIME — run `npm run og` and the files land in each
 * route's folder as `opengraph-image.png`, a Next file convention resolved
 * per segment. See scripts/og.mjs and components/site/og-card.tsx.
 *
 * Copy lives here rather than in the card component so the whole set can be
 * read at once. A share card is the only piece of this site a person sees
 * before they have decided whether to click, so the headlines below want to
 * be compared side by side, not hunted for across a dozen files.
 *
 * EVERY CARD IS TWO LINES, and the second carries the Clay accent. Keep each
 * line under roughly 24 characters: at 76px that is about the width of the
 * card's measure, and a third line pushes the footer off the canvas. It is a
 * proxy for width, not width itself — render the set and look at it.
 *
 * LINES COME FROM THE PAGE'S OWN COPY — its h1, its eyebrow, its source-copy
 * headline — not written for the card. Geekdom's feedback is that the site
 * should read in their words, and a card is the site's most-distributed text.
 */
export interface OgCard {
  /** Mono kicker. Concrete on Bone — Clay fails at this size. */
  eyebrow: string;
  /** Exactly two lines. The second renders in Clay. */
  lines: readonly [string, string];
  /** Path under app/, where the Next file convention picks it up. */
  out: string;
  /** Becomes the `.alt.txt` sidecar, which Next emits as og:image:alt. */
  alt: string;
}

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
    out: "app/opengraph-image.png",
    alt: `Geekdom — ${PROMISE} ${POSITIONING}`,
  },

  /*
    NO PRICE ON THE CARD. It read "One membership. $100/month." — the largest
    price anywhere Geekdom's name travels, since this is what unfurls in every
    chat a /club link is pasted into. Geekdom asked that nothing feel salesy
    or pushy, and the page itself now keeps the figure in its membership
    card. Both lines are /club's source copy: the eyebrow's "Members only"
    and the Membership headline.
  */
  club: {
    eyebrow: "The Club",
    lines: ["Members only.", "Application-based."],
    out: "app/(site)/club/opengraph-image.png",
    alt: "The Geekdom Club — members only, application-based.",
  },

  /*
    THE DISQUALIFIER RIDES IN THE UNFURL, though NOT in these two lines —
    worth being precise about, because this note used to claim the card led
    with it and the card plainly does not.

    An unfurl is the image plus the title plus the description, and the
    description here is the page's own metadata, which ends "Not an
    accelerator. No cohorts. No open application." That is where it lands, and
    it is deliberate: the most costly outcome for this page is a founder
    clicking through, reading four screens and discovering there is nothing to
    apply to. The alt text carries it too.

    THE LINES ECHO THE h1 INSTEAD, and "a few founders a year" does the
    scarcity work in the image without making the card read as a rejection
    before anyone has heard the offer.
  */
  studio: {
    eyebrow: "Studio · The venture layer",
    lines: ["We go all in with", "a few founders a year."],
    out: "app/(site)/studio/opengraph-image.png",
    alt: "Geekdom Studio — the venture layer. $20–30K SAFE checks and hands-on work for four to six San Antonio founders a year. Invitation only.",
  },

  faq: {
    eyebrow: "Questions",
    /*
      THE PAGE'S OWN H1, EXPANDED — not repeated, and the reason is size. The
      h1 is "How it works.", thirteen characters, which on a 1200px card is a
      few words adrift in a lot of graphite. This says the same thing with
      enough of it to fill the measure, and names the two engines while it is
      there.

      Same claim, more specific: that is the bar. The rule the home card set is
      that a card and a title must not make two DIFFERENT claims, because a
      search result and an unfurl show them together.

      It read "The ones members actually asked", which was true when this was
      the transition sheet. The lease, refund and prorated-credit questions
      have since been retired — every member they were written for was spoken
      to directly — and what is here now includes the Studio and downtown
      parking, which no member asked for in that sheet.
    */
    lines: ["How the Club and", "the Studio work."],
    out: "app/(site)/faq/opengraph-image.png",
    // Was "what happens to desks and offices". See the note on the page's own
    // description — the desk belongs to the letter, not to the FAQ.
    alt: "Geekdom FAQ — what club membership costs and includes, how to apply, how the Studio works, and where to park downtown.",
  },

  apply: {
    eyebrow: "Apply to the Club",
    /*
      THE PAGE'S OWN H1. It said "working on." while the h1 said "building." —
      the same sentence ending two different ways, shown side by side in every
      unfurl and search result. Neither was wrong; having both was.
    */
    lines: ["Tell us what you\u2019re", "building."],
    out: "app/(site)/apply/opengraph-image.png",
    alt: "Apply to the Club at Geekdom — one membership, by application, on the third floor in San Antonio.",
  },

  /*
    /events SHIPPED A CARD NOBODY COULD REGENERATE — the PNG was in the
    folder but had no entry here, so `npm run og` never touched it and it
    stayed a shader card. The h1 is "What's on."; the second line is the
    page's own description ("most of them open to non-members").
  */
  events: {
    eyebrow: "The calendar",
    lines: ["What’s on.", "Most of it is open."],
    out: "app/(site)/events/opengraph-image.png",
    alt: "Geekdom events — meetups, build sessions, office hours and pitch nights on the third floor, most of them open to non-members.",
  },

  /*
    /about, /contact and /media had no card and unfurled the homepage's. Each
    now carries its own page's words.
  */
  about: {
    eyebrow: `About · Since ${FOUNDED_YEAR}`,
    // The origin line, as the homepage and /about both tell it.
    lines: ["Geekdom started", "with an email."],
    out: "app/(site)/about/opengraph-image.png",
    alt: `About Geekdom — started with an email in ${FOUNDED_YEAR}; today a members' club and a venture layer in downtown San Antonio.`,
  },

  contact: {
    eyebrow: "Contact",
    // The h1, then the address — the second thing anyone reaching out needs.
    lines: ["Get in touch.", `${LOCATION.street}.`],
    out: "app/(site)/contact/opengraph-image.png",
    alt: `Contact Geekdom — ${LOCATION.full}.`,
  },

  media: {
    eyebrow: "Media",
    // The h1, cut to fit two lines: "For journalists, writers, and
    // researchers covering San Antonio's startup community."
    lines: ["For journalists", "and researchers."],
    out: "app/(site)/media/opengraph-image.png",
    alt: "Geekdom media — boilerplate, facts and press contacts for journalists, writers and researchers covering San Antonio's startup community.",
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
    out: "app/(site)/since-2011/opengraph-image.png",
    alt: `${SITE_NAME} — the photo wall. The people, the pitches, the late nights, and the community that showed up. Since ${FOUNDED_YEAR}.`,
  },
};

export const OG_SIZE = { width: 1200, height: 630 } as const;

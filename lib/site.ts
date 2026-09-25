/**
 * Site-wide constants: identity, the dates that drive the transition copy, and
 * navigation. Pure — safe to import from client components, email templates,
 * and the proxy alike.
 */

import { env, envOr } from "@/lib/env";

/**
 * Where this deployment thinks it lives.
 *
 * FALLING BACK TO LOCALHOST ON A DEPLOYMENT IS NEVER RIGHT, and it is not a
 * theoretical failure. With NEXT_PUBLIC_SITE_URL unset on the Vercel project,
 * this resolved to http://localhost:3000 in production, which became
 * `metadataBase` — so every absolute URL the site emitted pointed at a machine
 * no crawler can reach. The canonical, og:url and og:image on the live review
 * deploy all read localhost, and LinkedIn, unable to fetch the share card,
 * fell back to scraping the page for an <img> and unfurled a partner logo.
 *
 * So the ladder ends at localhost only when nothing else is available, which on
 * Vercel is never: NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is the project's
 * stable production domain and NEXT_PUBLIC_VERCEL_URL is this exact
 * deployment. Setting NEXT_PUBLIC_SITE_URL is still the right thing to do —
 * these are a floor, not a substitute — but forgetting it now costs a
 * cosmetically wrong domain rather than a site that describes itself as
 * localhost.
 *
 * ALL THREE ARE NEXT_PUBLIC_, deliberately. This module is imported by client
 * components, and Next only inlines variables matching the literal text
 * `process.env.NEXT_PUBLIC_X` into the browser bundle. Reading the server-side
 * VERCEL_URL here would give the server one origin and the browser
 * `undefined` — the two would disagree mid-hydration.
 *
 * Trailing slash stripped so `${SITE_URL}/apply` never doubles up.
 */
const vercelProduction = env(
  process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
);
const vercelDeployment = env(process.env.NEXT_PUBLIC_VERCEL_URL);

export const SITE_URL = (
  env(process.env.NEXT_PUBLIC_SITE_URL) ??
  (vercelProduction && `https://${vercelProduction}`) ??
  (vercelDeployment && `https://${vercelDeployment}`) ??
  "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_NAME = "Geekdom";

/** The line the whole site points at, straight from the members letter. */
export const TAGLINE = "Building San Antonio, one startup at a time.";

/**
 * THE POSITIONING STATEMENT, verbatim from the 2026 brand guide.
 *
 * This is the sentence Geekdom leads with, and until the homepage was rebuilt
 * it appeared on /club and nowhere else — while the homepage ran three other
 * claims at once (HOOK in the h1, PROMISE in the paragraph under it, and
 * TAGLINE_LINE below that, over an eyebrow calling Geekdom "a space for
 * problem solvers"). Four arguments in the first screen, none of them this
 * one.
 *
 * "SERIOUS" IS DOING REAL WORK and is not a flourish. It is the guide's own
 * filter, and it is what makes the sentence a positioning statement rather
 * than a description — a club for founders is a coworking space, a club for
 * SERIOUS founders is an application. Don't soften it.
 *
 * The homepage splits this across two spans to accent the back half; it slices
 * the constant rather than retyping it, so the accent cannot drift out of step
 * with this line.
 */
/* U+2019, not a straight quote. This renders at 72px in the homepage h1,
   where an ASCII apostrophe is unmistakable and looks like a bug. */
export const POSITIONING =
  "San Antonio\u2019s club for serious founders and builders.";

/** The half the homepage hero sets in Clay. Kept beside the line it splits. */
export const POSITIONING_ACCENT = "serious founders and builders.";

/**
 * THE TAGLINE, as the 2026 brand guide states it — and it is a different line
 * from `TAGLINE` above.
 *
 * Both are real and both are Geekdom's. `TAGLINE` is the operating line from
 * the members letter: what Geekdom does, in six words, and it is what the
 * footer and the close carry. This is the guide's stated tagline: the ARGUMENT
 * underneath that work, which the website source copy sets directly under the
 * homepage headline.
 *
 * It had no home on the site at all until the hero's two CTAs came out, even
 * though the origin section has been paraphrasing it the whole time
 * ("hundreds of companies got started because someone sat down next to the
 * right person"). Now it is stated once, in the brand's own words, in the
 * place the source copy puts it.
 *
 * Set in Fraunces wherever it appears — see components/site/editorial.tsx.
 */
export const TAGLINE_LINE =
  "The best things get built because someone sat down next to the right person in the right room.";

/**
 * THE CLUB'S COPY, SPLIT THE WAY `Source Copy v1` SPLITS IT.
 *
 * This was one shared object — claim / who / isnt — read by BOTH the
 * homepage's Club section and /club's hero, on the reasoning that one
 * argument typed in two places is how one of them ends up a year behind the
 * other. That reasoning still holds in general and it was the wrong call
 * here: Geekdom's source doc gives the two placements DIFFERENT copy on
 * purpose. The homepage gets a subhead and one paragraph that introduce the
 * Club to someone who has not met it; /club gets three paragraphs that
 * describe it to someone who has already clicked.
 *
 * So they are two constants rather than one, and the thing that stops them
 * drifting is no longer a shared object — it is that both are transcribed
 * from the same document and neither is written here.
 *
 * ⚠️ DO NOT MERGE THEM BACK. The overlap is real ("It's not coworking. It's
 * not an accelerator." appears in both), and deduplicating it would quietly
 * re-impose a structure the doc does not have.
 */
export const CLUB_HOME = {
  /** Home › The Club section › Subhead. */
  subhead:
    "A community and social layer for the people building San Antonio\u2019s future.",
  /** Home › The Club section › Body. */
  body: "Application-based membership for the people building what\u2019s next in San Antonio. Founders, engineers, creators, operators, and the corporate and civic leaders who want a hand in what the city becomes. Anchored by monthly rituals, build sessions, meetups, member-only events, and 24/7 access to the third-floor clubhouse.",
} as const;

/**
 * /club › Page header and Opening, verbatim.
 *
 * The doc separates the two: the header is an eyebrow and a headline and
 * nothing else, and the Opening is its own section of three paragraphs below
 * it. The hero used to carry all of it, which is why /club's fold ran to five
 * blocks of copy over a photograph.
 */
export const CLUB = {
  /** Page header › Headline. */
  headline:
    "Where San Antonio\u2019s founders and builders find their room.",
  /** Opening › Body, paragraphs 1–3. */
  opening: [
    // The lede is the first sentence alone. Geekdom: "break this paragraph
    // up and move 'Ritual activities…' into the body below" — the words are
    // unchanged, only where they sit.
    "Geekdom\u2019s Club is a members-only community for the people building San Antonio\u2019s next generation of companies and technologies.",
    "Ritual activities like build sessions, tech talks, fireside chats, and socials create new connections. Member-only channels keep the community connected beyond the room.",
    "Our downtown San Antonio clubhouse offers space to drop-in for focused work, meetings, coffee chats, and events in the historic Rand Building on Houston Street.",
    "It\u2019s not coworking. It\u2019s not an accelerator. It\u2019s a community powered by its mix of people, activities, and a clubhouse on the third floor of the Rand.",
  ],
} as const;

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
 * THE TITLE LINE — "Geekdom — Building San Antonio" in a browser tab, a search
 * result and the homepage's share card. Geekdom asked for it in place of
 * "Find your thinking partner." ("Geekdom - building San Antonio. Or
 * something like that."). It is the head of `TAGLINE`, "Building San Antonio,
 * one startup at a time.", so the title and the tagline say one thing.
 */
export const TITLE_LINE = "Building San Antonio";

/**
 * The promise — what you actually do about the hook.
 *
 * It carried the page <title> until Geekdom asked for "Building San Antonio"
 * there instead (see TITLE_LINE); it no longer reaches any title or card.
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
  /*
    THE SAME FLOOR, SPELLED FOR AN ADDRESS RATHER THAN A SENTENCE, and the two
    are not interchangeable.

    `floor` above is prose — it reads "the third floor" in eleven places, in
    running copy like "Elevator to the third floor" and "24/7 access to the
    third floor". Spelling it out is correct there and "the 3rd floor" would
    be wrong.

    An address block is not a sentence. It is scanned, it is short, and "3rd
    Floor" is the conventional form on a door, an envelope and a map listing.

    DON'T RECONCILE THESE. Somebody will notice the file says "Third floor" in
    one place and "3rd Floor" in another and make them agree; that is what
    this note is for.
  */
  floorShort: "3rd Floor",
  street: "110 E Houston St",
  city: "San Antonio",
  state: "TX",
  zip: "78205",
  /*
    "The Rand Building · 3rd Floor" — the first line of an address.

    BUILDING FIRST. It read "Third floor, The Rand Building", which leads on a
    position inside a place before naming the place. Nobody gives an address
    that way: you are told the building, then where in it.

    The separator is the middle dot the site already uses for this exact job —
    the email template sets `${floor} · ${full}`, and the eyebrows run "Since
    2011 · San Antonio". A comma here would be a third comma in a three-line
    address block.
  */
  get line1() {
    return `${this.building} · ${this.floorShort}`;
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

/**
 * WHERE THE TRANSITION IS RIGHT NOW. Three windows.
 *
 * ⚠️ CURRENTLY UNUSED. Its only consumer was /whats-changing, which has been
 * removed at Geekdom's request. Kept rather than deleted because
 * `CONTRACTS_END` and `CLUB_OPENS` are both still live elsewhere and the Club
 * opens on 5 October — a page that needs to read differently before and after
 * that date is plausible enough that the helper is worth its ten lines.
 *
 *   before      coworking still running, the change is announced
 *   between     contracts ended Sept 25, club not open until Oct 5
 *   after       the club is operating
 *
 * THE GAP IS NOT AN EDGE CASE — it is ten days long and San Antonio Startup +
 * Tech Week (Sept 28 – Oct 2) sits inside it. That is the highest-traffic week
 * of Geekdom's year, and a page that says "we'll be in touch this week" about
 * contracts that ended three days earlier would be saying it to more first-time
 * visitors than any other week.
 *
 * Read through this rather than comparing dates at the call site, so the pages
 * cannot disagree with each other about which window it is.
 */
export type TransitionPhase = "before" | "between" | "after";

export function transitionPhase(now: Date = new Date()): TransitionPhase {
  if (now >= CLUB_OPENS) return "after";
  if (now >= CONTRACTS_END) return "between";
  return "before";
}

/** Years since Geekdom opened — "Fifteen years ago…" in the letter. */
export const FOUNDED_YEAR = 2011;

export const CONTACT_EMAIL = "members@geekdom.com";

/**
 * /contact's routing table, from `Source Copy v1`.
 *
 * The doc's Contact page is four blocks, each naming the address for one kind
 * of question. Same reasoning `TEAM_CONTACTS` carries: "email us" on a page
 * about billing sends the anxious question to a shared inbox and adds a hop.
 *
 * ⚠️ SOME OF THESE ADDRESSES ARE NEW TO THIS REPO — `club@geekdom.com`
 * (Geekdom's swap for the doc's `mm@`) and `hello@geekdom.com` appear nowhere
 * in the codebase before now, and `press@geekdom.com` comes from the Media
 * page's spec. Worth
 * confirming all three are real mailboxes before launch; a contact page that
 * routes to an address nobody reads is worse than one that does not exist.
 * `CONTACT_EMAIL` (members@) is the one already in use for membership.
 */
/**
 * THE MEDIA BOILERPLATE, verbatim from `Source Copy v1`.
 *
 * Three paragraphs a journalist can paste without editing. It is a constant
 * rather than page markup because /media offers a copy button over it — the
 * button and the rendered prose have to be the same string or the clipboard
 * quietly ships something the page does not say.
 *
 * Note the third paragraph names LaunchSA as operated "in partnership with
 * the City of San Antonio", which is the exact verb `ECOSYSTEM` protects.
 */
export const BOILERPLATE_SHORT = [
  "Geekdom is San Antonio\u2019s club for serious founders and builders in tech and tech-enabled industries. It\u2019s a curated community of the people creating the city\u2019s next generation of scalable companies, along with the operators, investors, and mentors who invest in their success. Since 2011, Geekdom has helped serious founders grow companies that hire, scale, and stay rooted in San Antonio.",
  "Beyond the club, Geekdom convenes the broader startup community, including founders, capital, universities, industry, and government, so San Antonio\u2019s efforts reinforce each other and great companies come from here.",
  "Geekdom also operates LaunchSA, the city\u2019s open-access entrepreneurship hub, in partnership with the City of San Antonio.",
] as const;

/**
 * The fact sheet rows that are actually known.
 *
 * ⚠️ THE DOC'S FACT SHEET HAS FIVE MORE AND ALL FIVE ARE `[TBD]`: current
 * members, companies started by members since founding, capital raised by
 * member companies, jobs created, and companies acquired since 2020. Those
 * are the numbers a journalist quotes, so they are the ones that must not be
 * guessed — and a press page is the last place on the site to publish an
 * estimate. They slot in here the moment Geekdom supplies them.
 */
export const FACT_SHEET = [
  { label: "Founded", value: "2011" },
  { label: "Location", value: "Downtown San Antonio, Texas" },
] as const;

/** Programs operated, from the doc's fact sheet. */
export const PROGRAMS_OPERATED = [
  "Geekdom Club",
  "Geekdom Studio",
  "Community Fund",
  "LaunchSA (in partnership with the City of San Antonio)",
  "San Antonio Startup + Tech Week",
] as const;

/** Press inbox, from /media's spec. */
export const PRESS_EMAIL = "press@geekdom.com";

/**
 * /contact's four blocks, in `Source Copy v1`'s order — Membership,
 * Partnerships and Studio, Press, General. Press points at /media rather than
 * an inbox, as the doc writes it.
 *
 * /about renders the ones marked `onAbout`: the doc's "three-line contact list
 * for membership, partnerships, and press", from the same constant so the two
 * pages cannot disagree about an address.
 */
export interface ContactBlock {
  heading: string;
  body: string;
  email?: string;
  alsoEmail?: string;
  /** An internal page instead of an inbox. */
  page?: { href: string; label: string };
  onAbout: boolean;
}

export const CONTACT_BLOCKS: readonly ContactBlock[] = [
  {
    heading: "Membership questions",
    body: "For questions about applying, current membership, billing, or the Club:",
    // Geekdom: "Let's swap this for club@geekdom.com" (was mm@, from the
    // source copy).
    email: "club@geekdom.com",
    onAbout: true,
  },
  {
    heading: "Partnerships and Studio",
    body: "For corporate partnership inquiries or Studio-related conversations:",
    // Geekdom: "swap out the leslie email with partner@geekdom.com" — a
    // role inbox rather than a person's.
    email: "partner@geekdom.com",
    alsoEmail: "studio@geekdom.com",
    onAbout: true,
  },
  {
    heading: "Press",
    body: "For press and media inquiries, see our",
    page: { href: "/media", label: "Media page" },
    onAbout: true,
  },
  {
    heading: "General",
    body: "For anything else:",
    email: "hello@geekdom.com",
    onAbout: false,
  },
];

/*
  `LETTER_AUTHOR` IS GONE with the letter. It held Charles Woodin's name, role
  and email so /whats-changing could be signed rather than read as a corporate
  announcement. Geekdom asked for the letter and its page to be removed, so
  the signature has nothing left to sign.
*/


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
 * WHICH OF THE ONE-PAGER'S PROGRAMS STILL RUN, because the answer changed and
 * this file said the wrong thing for a while.
 *
 * The one-pager lists four: Startup Bootcamp, the Incubator, the
 * Pre-Accelerator, and the Community Fund. It predates the club, so the
 * reasonable assumption was that the club replaced all four. It didn't.
 *
 * TWO ARE LIVE, and they moved rather than ended — they sit under the Studio,
 * Geekdom's venture layer, not under the club:
 *
 *   - The Community Fund is how the Studio writes every check it writes.
 *     `MILESTONES` has been publishing its track record ($1.62M invested) this
 *     whole time, which should have been the tell.
 *   - Startup Bootcamp runs as open programming, for the wider community
 *     rather than for members.
 *
 * TWO ARE GONE: the Incubator and the Pre-Accelerator.
 *
 * Source: Geekdom's own website source copy (v1, 19 Sept 2026), which is also
 * where `STUDIO` below comes from. The earlier note here — and the matching
 * paragraph in /llms.txt — told crawlers all four were discontinued. Listing a
 * dead program is bad; denying a live one is worse, because the Studio is half
 * of what Geekdom does.
 */

/**
 * The Studio — the venture layer, and the half of Geekdom this site does not
 * yet have a page for.
 *
 * Here rather than in a page file because /llms.txt has to describe Geekdom
 * accurately NOW, before /studio is built, and because when that page does get
 * built it should read from the same constants rather than restating them.
 *
 * Every figure is from the source copy. `checkRange` and `foundersPerYear` are
 * the two most likely to move — they are the terms of an active fund, not
 * history — so treat them the way MILESTONES is treated: transcribed, not
 * rounded.
 */
export const STUDIO = {
  /** No open application. Founders are scouted and invited. */
  isOpenApplication: false,
  checkRange: "$20–30K",
  checkTerms: "SAFE",
  foundersPerYear: "4–6",
  engagement: "six to twelve months",
  fund: "Geekdom Community Fund",
  eir: {
    name: "Brian Sierakowski",
    role: "Entrepreneur in Residence",
  },
  email: "studio@geekdom.com",
  /** Open to the wider community, not only Studio companies. */
  /* "or events" is the doc's wording on /studio's open-programming
     paragraph; the homepage and llms.txt join this list with commas. */
  openPrograms: ["Office Hours", "Startup Bootcamp", "Select workshops or events"],
} as const;

/**
 * What the Studio looks for. Verbatim from the source copy — these are
 * investment criteria, so paraphrasing one is changing it.
 *
 * "$500 MRR, average entry $7K" is the line most likely to be misread as a
 * single threshold. It is a floor and a typical, and both numbers matter: the
 * floor is what makes a conversation possible, the average is what makes it
 * likely.
 */
export const STUDIO_CRITERIA = [
  "Pre-seed",
  "At least $500 MRR, with an average entry at $7K MRR",
  "Chasing billion-dollar markets",
  "Positioned to hit $1M+ ARR in six to twelve months with funding and hands-on support",
  "Tech or tech-enabled, with scalability baked in",
  "Pursuing a bootstrapped-to-venture path or a straight venture path",
  "Committed to this startup for the next five to ten years",
] as const;

/**
 * The Studio's backers. Named, because "supported by partners" without names
 * is the kind of unfalsifiable claim the brand guide's voice section exists to
 * stop.
 */
export interface StudioPartner {
  name: string;
  /**
   * Path under /public/partners. Trimmed of transparent padding on import.
   *
   * MUST HAVE AN ALPHA CHANNEL. `jockey-ventures.png` arrived as RGB flattened
   * onto white and rendered as a white box on Bone Light — the grounds here are
   * #FAF8F3 and #F4F1EB, so any white rectangle shows. It was keyed rather than
   * recomposited onto the section colour: alpha ramps from the distance to
   * white over the anti-aliased band only (min-channel 255 to 195, which is
   * 2.5% of that file's pixels), then the colour is unpremultiplied from white
   * so edge pixels carry no light fringe. The mark is NOT monochrome —
   * "VENTURES" is blue and the tagline grey — so the usual luminance-to-alpha
   * shortcut would have made the blue semi-transparent.
   */
  logo: string;
  /**
   * Rendered height, balanced on INK rather than on box area.
   *
   * These two happen to land on the same value, and that is a measurement
   * rather than laziness — don't collapse the field, the next logo will need
   * its own. Jockey is 8.3:1 at 21% ink coverage, Bexar 5.6:1 at 29%, and the
   * lower coverage almost exactly offsets the wider aspect: at 40px they are
   * 2804px2 and 2600px2 of ink, within 8%.
   *
   * THE EARLIER PAIRING BALANCED NEITHER. Jockey sat at h-7 against Bexar's
   * h-10 on the reasoning that a single height makes the wide one dominate.
   * On ink that put Bexar 89% ahead — it has a seal and two lines of bold
   * type where Jockey has a thin wordmark — so the fix was making the county
   * mark *stop* dominating, not shrinking the other one further. It also left
   * Jockey's "BUILD WITH US" about 4px tall.
   */
  logoHeight: string;
  /**
   * A short line under the mark, and it must NOT be the name again.
   *
   * This slot used to render `name`, which on a wordmark is an echo — at h-10
   * "JOCKEY VENTURES" sets at about a 15px cap height and reads perfectly
   * well, so the caption under it said nothing twice.
   *
   * IT CANNOT SIMPLY GO, because the two marks are not equally self-naming.
   * Bexar's is a 5.6:1 lockup whose top line, "BEXAR COUNTY TX", sets at
   * about 4.8px — an unreadable smudge at h-10 and still 5.8px at the h-12
   * the container caps at. Without a caption the row is a government seal
   * over "ECONOMIC & COMMUNITY DEVELOPMENT", which a San Antonio reader will
   * most likely take for the CITY. Geekdom operates LaunchSA for the City;
   * the County backs the fund. Those are different claims and the site is
   * careful about them everywhere else.
   *
   * So the line stays and carries what the mark can't. Same reasoning as the
   * required `role` on ECOSYSTEM entries: what a body IS to Geekdom is the
   * information, and a name that is already set in 40px of artwork is not.
   */
  role: string;
  href?: string;
}

/**
 * THE ONE FILM, and it is the closest thing this site has to a founder voice.
 *
 * Geekdom's own channel (@Geekdomsa) published a feature on KeepTabz, one of
 * the four companies in `PORTFOLIO` marked `studio: true`, with its founder on
 * camera. That is evidence of a kind /studio had none of: every other claim on
 * that page is Geekdom describing its own offer, and `MOCK_FOUNDER_VOICES` is
 * still empty because inventing a quote is not an option.
 *
 * TITLE TRANSCRIBED FROM THE oEMBED ENDPOINT, not retyped — same rule the
 * figures carry. `https://www.youtube.com/oembed?url=...&format=json` returns
 * it, needs no key, and is the only authority on somebody else's headline.
 *
 * IT NAMES ONE OF FOUR COMPANIES, which the Studio-companies section is
 * otherwise careful not to do — the photograph that used to lead that section
 * was moved to the hero partly for that reason. A film is a different case
 * from a photograph: it is Geekdom's own published work about a named company
 * rather than a stand-in for "a backed team", and it is captioned with whose
 * it is. If films appear for the others, this becomes a list.
 */
export const STUDIO_FILM = {
  youtubeId: "YAw8bMeLlQU",
  title:
    "The Smarter, Cheaper Way to Track Your Competition | KeepTabz Founder",
  company: "KeepTabz",
  /**
   * THE FOUNDER, NAMED. The guide's loudest rule is "Real people, named. No
   * stock.", and until this was transcribed the row said "KeepTabz" and left
   * the person in it anonymous — on the page whose whole gap is that no
   * founder speaks on it.
   */
  founder: "Franklin Morris",
  /**
   * EVERYTHING BELOW IS FOR `VideoObject`, and every field is transcribed
   * from YouTube rather than estimated — same rule the fund's figures carry.
   * `uploadDate` and `duration` are required and recommended respectively for
   * the rich result, and a wrong date is a wrong claim about when Geekdom
   * published something.
   *
   * Source: the watch page's own JSON (`uploadDate`, `lengthSeconds`) and the
   * oEmbed endpoint for the title. 2289 seconds is 38m09s.
   */
  uploadDate: "2026-05-04",
  /** ISO 8601, because that is what `VideoObject` requires. */
  duration: "PT38M9S",
  /** The same figure in prose, for llms.txt. Kept beside the ISO one rather
      than parsed out of it — two fields cannot disagree if both are read off
      the same source at the same time, and a parser here would be four lines
      to avoid a duplicated 38. */
  durationLabel: "38-minute",
  /** Referenced by URL in JSON-LD only. The page itself requests nothing from
      YouTube until somebody presses play — see components/site/video-card. */
  thumbnailUrl: "https://i.ytimg.com/vi/YAw8bMeLlQU/maxresdefault.jpg",
  /** One sentence, from the film's own description. */
  description:
    "Franklin Morris spent years as a VP of Marketing watching companies get blindsided by competitors, so he built something about it.",
} as const;

/*
  WHO CAPITALISES THE FUND, and these are logos rather than names now because
  a backer is a verifiable fact about the money, not borrowed credibility.

  THAT DISTINCTION MATTERS HERE. The homepage's partner marquee was removed for
  exactly the reason a logo wall is usually wrong on this site — nine other
  organizations' marks in the most valuable proof slot, which is how the
  "generic community organization" the guide says Geekdom is NOT presents
  itself. These two are different: they are on the page about the fund they
  back, there are two of them, and who funds a fund is material. Don't read
  this as licence to reopen the marquee.

  THE DOC SETTLES THE BEXAR COUNTY NAME, AND IT IS THE FUND.

  This entry has been three different strings. It started as "Economic
  Development Innovation Fund", was changed to "Economic & Community
  Development" because that is what the supplied logo reads and what the
  county's own site calls the DEPARTMENT, and is now back to the first one —
  because `Geekdom Website — Source Copy v1` writes "Bexar County Economic
  Development Innovation Fund", and the doc is the source of truth for copy.

  Both are real, which is why this kept moving: Economic & Community
  Development is the department, and the Economic Development Innovation Fund
  is a fund inside it. The fund is the counterparty — it is the money that
  backs the Studio — so the doc is naming the right thing and the mark on the
  logo is the department that houses it.

  ⚠️ THE LOGO THEREFORE CONTRADICTS THE CAPTION. The artwork reads "ECONOMIC
  & COMMUNITY DEVELOPMENT" above a name that says Innovation Fund. Worth
  asking Geekdom for the fund's own mark, or confirming they are happy with
  the department's logo over the fund's name.

  ⚠️ ONE THING FOR GEEKDOM TO CONFIRM. The documented Jockey relationship is
  with the PRE-ACCELERATOR, which this repo lists as legacy — Geekdom's own
  newsroom has "Geekdom Pre-Accelerator launches with Jockey Ventures as lead
  sponsor", a $100K sponsorship — and that post describes their founder Ben
  Jones as a Geekdom entrepreneur in residence, while the Studio's EIR is
  Brian Sierakowski. Both can be true, a sponsor who stayed on and a former
  EIR, but they are listed here as a STUDIO backer and that wants checking.
*/
export const STUDIO_PARTNERS: readonly StudioPartner[] = [
  {
    name: "Jockey Ventures",
    role: "Venture studio",
    logo: "/partners/jockey-ventures.png",
    logoHeight: "h-10",
    /*
      THEIR LINKEDIN, NOT jockeyvc.com, and the choice is deliberate. That
      domain is the one their LinkedIn lists, but it currently serves "Jockey
      Delivery", a same-day retail delivery service — so a reader clicking
      Geekdom's backers list lands somewhere that looks like a mistake.
      LinkedIn is unambiguously the firm and is stable. Swap it the day the
      domain points back at the studio.
    */
    href: "https://www.linkedin.com/company/jockeyvc",
  },
  {
    name: "Bexar County Economic Development Innovation Fund",
    role: "Bexar County, Texas",
    logo: "/partners/bexar-county-ecd.png",
    logoHeight: "h-10",
    href: "https://www.bexar.org/682/Economic-Community-Development",
  },
] as const;

/**
 * THE PORTFOLIO — companies started or backed at Geekdom.
 *
 * FIFTEEN YEARS OF EVIDENCE THAT WAS NOWHERE ON THE SITE. The homepage ran a
 * marquee of ecosystem ORGANIZATIONS (H-E-B, DEVSA, Tech Bloc) which says who
 * endorses Geekdom; this says what came out of it, which is the stronger claim
 * and the one the source copy asks for under "BUILT AT GEEKDOM".
 *
 * `studio: true` marks the four the Studio has actually backed, so /studio can
 * filter this list rather than keeping a second copy of four rows that would
 * immediately drift.
 *
 * NO LOGOS YET. The source copy calls for a monochrome logo grid; until those
 * files arrive the names set as a wordmark grid, which is the same fallback
 * `Partner.logo` already takes and reads better than a row of mismatched
 * marks. Stage and year are what make each row evidence rather than a list.
 *
 * TRANSCRIBED, NOT ESTIMATED — same rule as MILESTONES. "Acquired 2022" is a
 * checkable claim about a real company.
 *
 * ── LOGOS: WHY ONLY SEVEN, AND WHY THEY WERE HAND-PICKED ───────────────────
 *
 * They were harvested from each company's own site (and the Wayback Machine
 * for the dead ones), and the harvest CANNOT be trusted unreviewed. A scraper
 * looking for logo-shaped images finds customer walls, investor badges and
 * award seals, and it found plenty: it returned SAFRAN for Big Sun Solar,
 * NVIDIA and Microsoft for Simmie, PayRange and CPI for ParLevel, customer.io
 * and Baremetrics for Flightpath. Shipping that unexamined would have put
 * NVIDIA on Geekdom's portfolio wall as a company built at Geekdom. Every
 * logo below was looked at before it was committed, and anything added later
 * must be too.
 *
 * A FILENAME FILTER IS NOT ENOUGH, which is how the first pass came up short.
 * It only looked at assets with "logo" in the URL, and plenty of these sites
 * don't name them that way — RentBamboo's is `svg-white.svg`, Allosense's and
 * Changebot's are inline <svg> with no URL at all. The second pass reads the
 * fully-rendered DOM and takes every image reference, inline SVG included.
 *
 * THE FIVE THAT ARE STILL MISSING, and why, because each needs a different fix:
 *
 * ALL EIGHTEEN HAVE ONE. The last two came out of the Wayback Machine after a
 * first pass wrongly concluded they were unrecoverable — see their entries.
 * The mistake was querying the availability API for a bare domain, which
 * reports a single snapshot and nothing about assets; CDX lists every capture,
 * and the archived HTML lists assets the domain never hosted.
 *
 * THREE WERE SUPPLIED BY GEEKDOM rather than found — MagenTrust, Changebot and
 * GrantAppli — and each for a different reason worth knowing:
 *
 *   MagenTrust, Changebot   Circular badges filled with a gradient. Shipped as
 *                           flat JPEGs with no alpha at all, so the mask has
 *                           to be DERIVED from luminance. Opposite readings:
 *                           MagenTrust's ink is the gold sphere and its paper
 *                           is the white lattice; Changebot's ink is the black
 *                           ring and toggle and its paper is the gradient. The
 *                           recipe for each is on its entry below.
 *   GrantAppli              Every logo on their own site belongs to a client.
 *
 * WHICH IS THE REAL LESSON HERE: for a portfolio wall, asking beats scraping.
 * A scrape returns something for almost every company, and about half of it is
 * somebody else's mark.
 *
 * VERIFY BY SILHOUETTE BEFORE COMMITTING ONE. Flatten the asset's alpha to a
 * single color and look at it — that is precisely what the mask does, and it
 * is what caught Changebot before it shipped as a black dot.
 *
 * Heights are area-balanced rather than equal, by the same formula and for
 * the same reason as data/mock/partners.ts: these run 2.5:1 to 5.4:1, and one
 * height for all of them makes the wide ones dominate.
 */
export interface PortfolioCompany {
  name: string;
  /** Omit rather than guess. Several of the acquired ones have no live site. */
  href?: string;
  /**
   * WHAT `href` ACTUALLY POINTS AT, because it is not always the company.
   *
   * Four of these companies were acquired and their domains are gone or
   * redirect to the acquirer. The best link for them is a piece of press or
   * Geekdom's own founder interview — which is genuinely more useful than a
   * dead domain, but only if the page SAYS so. Someone clicking "Infocyte"
   * and landing on a news article without warning has been misled, even
   * helpfully.
   *
   * The wall renders this as a small label, so the destination is declared
   * before the click rather than discovered after it.
   */
  link?: "site" | "story" | "video";
  /** "Acquired 2022", "Series A", "Pre-seed", "Bootstrapped". */
  stage: string;
  founded: number;
  /** Backed by the Studio, as opposed to merely started here. */
  studio?: boolean;
  /**
   * One line on what the company does.
   *
   * SOURCED, NEVER INVENTED — the same rule MILESTONES carries, and it matters
   * more here because these are claims about other people's companies. Every
   * description below traces to the company's own site, its own press, or
   * Geekdom's own founder interview. A company with no description simply
   * renders without one; a guessed one is worse than none.
   */
  description?: string;
  /**
   * Path under /public/portfolio. OPTIONAL — without it the name renders as a
   * wordmark, which is the same fallback `Partner` takes and for the same
   * reason: it lets a company go up the day it is agreed rather than the day
   * someone digs out an SVG.
   *
   * RENDERED THROUGH A CSS MASK, not as an <img>, so every mark comes out in
   * one color whatever it arrived in. That is not a stylistic preference —
   * Geekdom's source copy asks for the grid "monochrome", and a harvest of
   * these eighteen turns up logos in every polarity there is: FloatMe, Big Sun
   * and Treatwalk all ship WHITE wordmarks that are invisible on Bone. A mask
   * reads alpha and ignores color, so it fixes polarity and the sponsor-wall
   * mismatch in one move. Same technique as crown-mask in globals.css.
   *
   * Which means the asset has to be a TRANSPARENT SVG or PNG whose alpha is
   * the wordmark itself. A logo on a solid plate masks to a solid rectangle.
   */
  logo?: string;
  /** Tailwind height for the mark, e.g. "h-6 sm:h-7". Ignored for wordmarks. */
  logoHeight?: string;
  /**
   * `symbol` means the asset is a MARK WITHOUT THE NAME IN IT, so the wall
   * sets the name beside it rather than leaving a shape on its own.
   *
   * Most of these companies ship a lockup — the tick sits above "CHECKUPS",
   * the paw sits inside "treatwalk" — and those read fine alone. A few ship
   * only the mark: RentBamboo's bamboo stripe, Allosense's circled A. On
   * their own sites neither appears without the name next to it, because
   * neither is recognizable enough to carry a row by itself.
   *
   * RentBamboo's own header is exactly this shape and there is nothing to
   * download that matches it — the icon is an <img> and "RentBamboo" is two
   * <span>s of live text beside it. So the wall reproduces the composition
   * rather than the file: their mark, our type.
   */
  logoMark?: "wordmark" | "symbol";
}

export const PORTFOLIO: readonly PortfolioCompany[] = [
  {
    name: "ParLevel Systems",
    logo: "/portfolio/parlevel-systems.png",
    logoHeight: "h-8",
    href: "https://www.parlevelsystems.com/",
    link: "site",
    description:
      "Vending management software for route operators — inventory, routes and cashless payments in one system.",
    stage: "Acquired 2022",
    founded: 2012,
  },
  {
    /*
      "Promoter.io", with an E. It was "Promotor.io" here for as long as this
      list has existed, carried over from the source copy. Geekdom's own
      YouTube channel settles it: the founder interview is titled
      "Promoter.io | Geekdom Stories".
    */
    name: "Promoter.io",
    /*
      RECOVERED FROM THE WAYBACK MACHINE. The domain is gone, so this is the
      mark as the site last served it.
      The capture is from December 2017, two years before Medallia bought
      them.
    */
    logo: "/portfolio/promoter-io.png",
    logoHeight: "h-8",
    href: "https://youtu.be/6e8ih7FNLEU",
    link: "video",
    description:
      "Net Promoter Score tooling for measuring customer loyalty. One of the first companies the Geekdom Fund backed; acquired by Medallia in 2019.",
    stage: "Acquired 2019",
    founded: 2013,
  },
  {
    name: "Infocyte",
    /*
      RECOVERED FROM THE WAYBACK MACHINE. The domain is gone, so this is the
      mark as the site last served it.
      A CDX query scoped to infocyte.com could never have found this: the
      asset was served from their WP Engine CDN on a wholly different
      hostname. It came out of the archived HTML instead, which is the
      lesson — read the archived PAGE, not just the archived domain.
    */
    logo: "/portfolio/infocyte.png",
    logoHeight: "h-8",
    href: "https://www.startupssanantonio.com/infocyte-cybersecurity-startup-acquired-by-datto/",
    link: "story",
    description:
      "Managed detection and response, built by two former Air Force cyber incident responders. Raised around $12M before Datto acquired it.",
    stage: "Acquired 2022",
    founded: 2014,
  },
  {
    name: "Flightpath Finance",
    logo: "/portfolio/flightpath-finance.svg",
    logoHeight: "h-7",
    href: "https://www.startupssanantonio.com/flightpath-finance-closes-515k-seed-round-wins-25k-geekdom-community-fund/",
    link: "story",
    description:
      "Financial modeling wired into a company's own accounting data. Won the $25,000 Geekdom Community Fund award in 2018.",
    stage: "Acquired 2021",
    founded: 2015,
  },
  {
    name: "Big Sun Solar",
    logo: "/portfolio/big-sun-solar.svg",
    logoHeight: "h-8",
    href: "https://www.bigsunsolar.com/",
    description:
      "Commercial solar for Texas businesses, nonprofits and municipalities — rooftop systems and canopies.",
    link: "site",
    stage: "Bootstrapped",
    founded: 2016,
  },
  {
    name: "Checkups",
    logo: "/portfolio/checkups.webp",
    logoHeight: "h-9",
    href: "https://checkups.us/",
    /*
      The only one of the eighteen whose site ships no meta description at all,
      so this is read off the page itself rather than lifted from a tag.
    */
    description:
      "Remote check-ins for community supervision — an app and dashboard that replace in-person probation visits.",
    link: "site",
    stage: "Bootstrapped",
    founded: 2017,
  },
  {
    name: "FloatMe",
    href: "https://floatme.com/",
    logo: "/portfolio/floatme.svg",
    logoHeight: "h-6",
    description:
      "Cash advances before payday, with spending alerts and budgeting tools alongside them.",
    link: "site",
    stage: "Series A",
    founded: 2018,
  },
  {
    name: "PorchPass",
    href: "https://www.porchpass.com/",
    logo: "/portfolio/porchpass.svg",
    logoHeight: "h-7",
    description:
      "Buys the land and the house for cash so a build can start up to 60 days sooner.",
    link: "site",
    stage: "Series A",
    founded: 2020,
  },
  {
    name: "Allosense",
    logo: "/portfolio/allosense.svg",
    logoHeight: "h-6",
    logoMark: "symbol",
    href: "https://www.allosense.com/",
    description:
      "Sensors, automation and observability for factory floors — test and measurement.",
    link: "site",
    stage: "Seed",
    founded: 2020,
  },
  {
    name: "Betty’s Co.",
    href: "https://bettysco.com/",
    logo: "/portfolio/bettys-co.svg",
    logoHeight: "h-8",
    description: "Gynecology, mental health and wellness care for young women.",
    link: "site",
    stage: "Pre-seed",
    founded: 2020,
  },
  {
    name: "GrantAppli",
    href: "https://grantappli.com/",
    /*
      Supplied by Geekdom, and it had to be: every logo on grantappli.com
      belongs to one of their CLIENTS — HOPE, Black Lives Matter, FIRST DAY,
      Hearing Thru Horses. A scrape of that page returns six real logos and
      not one of them is GrantAppli's. Same trap as KeepTabz, whose site
      offered up Netlify and the San Antonio Zoo.
    */
    logo: "/portfolio/grantappli.png",
    logoHeight: "h-6",
    description:
      "Grant writing and funder research in one place, for teams that apply often.",
    link: "site",
    stage: "Pre-seed",
    founded: 2023,
  },
  {
    name: "Simmie",
    href: "https://www.simmie.ai/",
    logo: "/portfolio/simmie.png",
    logoHeight: "h-7",
    description:
      "AI roleplay simulations that score sales reps against a company's own standard.",
    link: "site",
    stage: "Pre-seed",
    founded: 2024,
  },
  {
    name: "Openlane",
    href: "https://www.theopenlane.io/",
    logo: "/portfolio/openlane.svg",
    logoHeight: "h-6",
    description:
      "Security and compliance — define your controls once and reuse the program across frameworks.",
    link: "site",
    stage: "Pre-seed",
    founded: 2024,
    studio: true,
  },
  {
    name: "RentBamboo",
    logo: "/portfolio/rentbamboo.svg",
    logoHeight: "h-6",
    logoMark: "symbol",
    href: "https://rentbamboo.com/",
    description:
      "An AI leasing agent that answers inquiries and books tours for property managers.",
    link: "site",
    stage: "Pre-seed",
    founded: 2024,
    studio: true,
  },
  {
    name: "KeepTabz",
    logo: "/portfolio/keeptabz.svg",
    logoHeight: "h-7",
    href: "https://www.keeptabz.ai/",
    description:
      "Competitive intelligence — a competitor's news, pricing, campaigns and reviews in one place.",
    link: "site",
    stage: "Pre-seed",
    founded: 2025,
    studio: true,
  },
  {
    name: "MagenTrust",
    href: "https://magentrust.ai/",
    /*
      DERIVED FROM A JPEG, which is why this is the one asset in here that was
      built rather than downloaded. MagenTrust ship a gold geodesic sphere with
      no transparency anywhere on their site — masked as-is it is a solid
      square, and their SVG icon is a filled disc that masks to a black dot.
      The alpha here comes from the JPEG's own luminance: gold goes opaque, the
      white lattice lines go transparent, so the lattice reads as holes rather
      than ink. Regenerate it the same way if the source ever changes.
    */
    logo: "/portfolio/magentrust.png",
    logoHeight: "h-6",
    logoMark: "symbol",
    description:
      "Behavioral identity verification that re-checks who you are throughout a session. No card reader, no second device.",
    link: "site",
    stage: "Pre-seed",
    founded: 2025,
  },
  {
    name: "Treatwalk",
    logo: "/portfolio/treatwalk.png",
    logoHeight: "h-9",
    href: "https://www.treatwalk.com/",
    description:
      "A mobile app for walking, running and hiking with your dog, with training and progress tracking.",
    link: "site",
    stage: "Pre-seed",
    founded: 2025,
  },
  {
    name: "Changebot",
    href: "https://www.changebot.ai/",
    /*
      DERIVED FROM A JPEG, like MagenTrust's — but read the other way round.

      There IS a wordmark on changebot.ai, in the footer, and it is live text:
      two <span>s reading "Changebot" and ".ai", with no file behind it. So the
      badge is the only asset there is, and masked as shipped it is a solid
      disc.

      What rescues it is that the DESIGN is the black ring and the black
      toggle; the green-to-cyan gradient is only fill. Thresholding on
      luminance keeps the black and drops the gradient, so the mask comes out
      as a ring with a toggle inside it — the mark, legibly. The opposite
      reading to MagenTrust, whose ink was the bright part and whose paper was
      the white lattice.
    */
    logo: "/portfolio/changebot.png",
    logoHeight: "h-6",
    logoMark: "symbol",
    description:
      "A hosted changelog and embeddable widget, so customers and support can see what shipped.",
    link: "site",
    stage: "Pre-seed",
    founded: 2025,
    studio: true,
  },
];

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
   * When real files do arrive, ask for SINGLE-COLOR versions. Marks vary in
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

export interface NavLink {
  href: string;
  label: string;
}

export const SOCIALS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/geekdom/" },
  { label: "Instagram", href: "https://www.instagram.com/geekdomsa" },
  { label: "X", href: "https://twitter.com/Geekdom" },
  { label: "YouTube", href: "https://www.youtube.com/c/Geekdomsa" },
] as const;

/**
 * THE CONVENING WORK — the answer to "what is Geekdom in 2026".
 *
 * WHY THIS EXISTS. The site could describe the Club and the Studio perfectly
 * and still leave a visitor thinking Geekdom is a nice floor with a small fund
 * attached. It isn't. Geekdom operates the city's open-access entrepreneurship
 * hub for the City of San Antonio, runs the region's startup week, and sits on
 * the team that put San Antonio into MIT's regional program. That is the
 * standing that makes the two membership products worth anything: the Club and
 * the Studio are how you PARTICIPATE, and this is why there is something to
 * participate in.
 *
 * Geekdom's own Media boilerplate says it plainly — "Beyond the club, Geekdom
 * convenes the broader startup community, including founders, capital,
 * universities, industry, and government, so San Antonio's efforts reinforce
 * each other" — and none of it appeared in page copy anywhere. It existed only
 * as four link labels in a footer column called "Related".
 *
 * THE VERB IS THE WHOLE POINT, and it is different for each one. "Partner" is
 * a word that hides the difference between running something and being invited
 * to it, and a site that blurs them is making a claim it can't support. So
 * `role` is a required field and each entry states the relationship exactly:
 *
 *   operates     Geekdom runs it, day to day
 *   runs         Geekdom produces it
 *   backed by    someone else's fund; Geekdom is a recipient
 *   sits on      a seat at someone else's table
 *
 * ⚠️ TWO OF THESE NEED CONFIRMING FROM GEEKDOM before launch. Accelerate South
 * Texas is a component fund of the San Antonio Area Foundation that grants TO
 * organizations supporting entrepreneurs, so Geekdom is a grantee rather than
 * an operator — but Geekdom's own About copy lists it alongside things it
 * runs, which is ambiguous. MIT REAP admits REGIONS, not companies, so the
 * accurate claim is that San Antonio is in the cohort and Geekdom sits on the
 * regional team. Both are written conservatively here. Upgrading a verb is
 * cheap; being caught overclaiming a relationship with the City or with MIT is
 * not.
 *
 * LAUNCHSA IS THE SENSITIVE ONE. The 2026 brand guide gives it a section: the
 * two brands stay separate, and copy must "never suggest that LaunchSA
 * resources are available to Geekdom members, or vice versa." The `boundary`
 * field carries that sentence to wherever the entry renders, so the separation
 * travels with the data instead of relying on whoever writes the next page to
 * remember it.
 */
export interface EcosystemEntry {
  name: string;
  href: string;
  /** Geekdom's actual relationship. See the note above — never "partner". */
  role: string;
  /** One or two sentences. What it is, for whom. */
  description: string;
  /** A date, a scale, a cadence — whatever makes it concrete. */
  detail?: string;
  /** A separation that must travel with the entry wherever it renders. */
  boundary?: string;
}

export const ECOSYSTEM: readonly EcosystemEntry[] = [
  {
    name: "LaunchSA",
    href: "https://launchsa.org",
    role: "Operated by Geekdom, in partnership with the City of San Antonio",
    description:
      "San Antonio's open-access resource center for small business owners and entrepreneurs. Advising, workshops, and networking — free, and open to anyone at any stage.",
    detail: "Inside the Central Library, 600 Soledad",
    boundary:
      "A separate program with its own brand and its own audience. LaunchSA is open to everyone; Geekdom's Club is not. Membership of one is not access to the other.",
  },
  {
    name: "San Antonio Startup + Tech Week",
    href: "https://www.sasw.co/",
    role: "Run by Geekdom",
    description:
      "The region's startup week. Five days, five circuits — Founder, Tech & Builders, AI & Applied Innovation, Small Business & Solopreneur, and Capital.",
    detail: "September 28 – October 2, 2026",
  },
  {
    name: "Accelerate South Texas",
    href: "https://saafdn.org/accelerate-south-texas/",
    // Geekdom's own words on /about: "We helped create Accelerate South
    // Texas, a fund at the San Antonio Area Foundation." This read "a fund
    // Geekdom is backed by", which undersold it.
    role: "A San Antonio Area Foundation fund Geekdom helped create",
    description:
      "A component fund of the San Antonio Area Foundation that funds the organizations supporting entrepreneurs across South Texas — startup, nonprofit and small business creation, and the job growth that follows.",
  },
  {
    name: "MIT REAP",
    href: "https://reap.mit.edu",
    role: "San Antonio is in the cohort; Geekdom sits on the regional team",
    description:
      "MIT's Regional Entrepreneurship Acceleration Program admits up to eight regions a year for a two-year engagement, working a five-stakeholder model across founders, capital, universities, industry and government.",
    detail: "A two-year engagement",
  },
];

/**
 * The footer's "Beyond the club" column, derived from ECOSYSTEM rather than
 * listed again.
 *
 * IT USED TO BE ITS OWN ARRAY, `RELATED`, written before `ECOSYSTEM` existed —
 * the same four organisations in a second place, already drifting ("Startup +
 * Tech Week" here against "San Antonio Startup + Tech Week" there). Two lists
 * of the same four things is one list that will be wrong.
 *
 * The footer needs only a name and a URL, so it takes those. Everything that
 * makes ECOSYSTEM careful — the exact verb for each relationship, the LaunchSA
 * separation the brand guide requires — stays on the homepage section that has
 * room to state it.
 */
export const BEYOND_THE_CLUB: NavLink[] = ECOSYSTEM.map((e) => ({
  href: e.href,
  label: e.name,
}));

/**
 * The utility row under the footer proper. Small, quiet, and the one part of
 * the site that exists because it has to rather than because it argues
 * anything.
 */
export const LEGAL: NavLink[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** Public calendar the events page links out to when Luma isn't configured. */
/**
 * Geekdom's application form on Typeform (`Source Copy v1`: "Embed Typeform
 * that feeds into current Airtable").
 *
 * THIS IS THE FORM ID, not the ID Geekdom sent. Their snippet was a "live
 * embed" (`data-tf-live="01M3AFG25RTFW121XX356HREK9"`), which resolves to this
 * form at load — read from the live embed's iframe URL
 * (form.typeform.com/to/xzboPb6K). The popup needs the form ID itself.
 */
export const TYPEFORM_FORM_ID = "xzboPb6K";

export const LUMA_CALENDAR_URL = envOr(
  process.env.NEXT_PUBLIC_LUMA_CALENDAR_URL,
  "https://luma.com/geekdom",
);

/**
 * "THIS MONTH IN THE CLUB" on the homepage — Geekdom's source copy, verbatim.
 *
 * HAND-MAINTAINED, AND MONTHLY. The source copy's note: "This list should be
 * maintained monthly. Ideal state: pulls from Luma via API or other tracking
 * source. Interim: editable CMS field or mixture of both." There is no CMS
 * yet, so this array is the interim field. When Luma is connected, merge its
 * events in rather than replacing this — some entries (Open Coffee Club at
 * Creme) are not Geekdom-hosted and won't be on the calendar.
 *
 * `date` is display text exactly as the source writes it ("Sept 23"), not a
 * Date: the source abbreviates September as "Sept", which no locale format
 * produces, and nothing sorts or filters on it. Keep entries in date order.
 */
/**
 * Startup + Tech Week's own site. `www` is its canonical host — the SASW repo
 * (next-sasw, lib/event.ts) notes that bare `sasw.co` redirects.
 */
export const SASW_SITE = "https://www.sasw.co";

/*
  EVERY ROW LINKS OUT — Geekdom: "link to the sasw.co website here… make
  every event clickable to their event page on the Startup + Tech Week site."
  URLs come from the SASW repo and were checked live (200):

    The Model        /schedule/the-model
    Access Granted   /schedule/access-granted
    PySanAntonio II  /schedule/pysanantonio — NOT /schedule/pysanantonio-ii,
                     which 404s. SASW gives a headline activation a `page`
                     separate from its edition slug so the URL outlives 2026.

  The kickoff and final-day rows aren't single events, so they go to the
  week's home and its schedule. The Sept 23 Open Coffee Club row came out
  once it had passed; a non-SASW entry would link to LUMA_CALENDAR_URL.
*/
export const THIS_MONTH: { date: string; title: string; href: string }[] = [
  {
    date: "Sept 28",
    title: "San Antonio Startup + Tech Week kicks off",
    href: SASW_SITE,
  },
  {
    date: "Sept 28",
    title: "The Model — a half-day summit at the intersection of AI and creative",
    href: `${SASW_SITE}/schedule/the-model`,
  },
  {
    date: "Sept 30",
    title: "Access Granted — a half-day summit for security and cyber",
    href: `${SASW_SITE}/schedule/access-granted`,
  },
  {
    date: "Oct 2",
    title: "PySanAntonio II",
    href: `${SASW_SITE}/schedule/pysanantonio`,
  },
  {
    date: "Oct 2",
    title: "Final day of San Antonio Startup + Tech Week",
    href: `${SASW_SITE}/schedule`,
  },
];

/**
 * THE TWO ENGINES, and that is the whole nav.
 *
 * Geekdom does two things: it runs a members' club, and it runs a venture
 * layer that backs a handful of the founders in it. The nav used to list four
 * items — Membership, The Floor, Events, What's Changing — which named one
 * page of the club, one room inside it, its calendar, and a transition that
 * completes in September. None of them said Geekdom has a second engine at
 * all, and /studio did not exist to be linked to.
 *
 * `Apply` is the third item and is not in this array: the navbar renders it as
 * a button, which is what the website source copy asks for ("Apply should be
 * styled as the primary action"). Keeping it out of NAV is also what stops it
 * being rendered twice, since the footer builds its Explore column from NAV.
 *
 * EVERYTHING DROPPED IS STILL REACHABLE, from the footer and from inside the
 * two pages — the clubhouse from the Club page itself, /events from the
 * month-in-the-Club module on both, and /faq from the footer.
 * The brand guide caps the nav at 4-5 items; the argument for two is that a
 * visitor's first question is which of the two things Geekdom does applies to
 * them, and a four-item nav answered a question nobody was asking.
 */
export const NAV: NavLink[] = [
  { href: "/club", label: "The Club" },
  { href: "/studio", label: "Studio" },
];


/*
  THE FOOTER'S COLUMNS, AS `Source Copy v1` SPECIFIES THEM.

  The doc gives four: Explore (About, Media, Contact), Programs (The Club,
  Studio, Field Notes, Apply), Related, Social. Geekdom's feedback is that the
  footer should match it, that the Membership column should go, and that "The
  letter" and "Manage membership" come out.

  ⚠️ FOUR OF THE DOC'S SEVEN INTERNAL LINKS HAVE NO PAGE YET — /about, /media,
  /contact and /field-notes. They are listed here with `pending: true` and the
  footer does not render them, because shipping four dead links to fix a
  footer is a worse footer. Build the page, drop the flag, and the link
  appears; nothing else has to change.

  Field Notes is the one that should stay pending longest: the doc's own note
  says "hide section and page until we populate with several articles".
*/
interface FooterLink extends NavLink {
  /** No page behind it yet. Rendered only once this is gone. */
  pending?: boolean;
}

export const FOOTER_EXPLORE: FooterLink[] = [
  { href: "/about", label: "About" },
  { href: "/media", label: "Media" },
  { href: "/contact", label: "Contact" },
];

export const FOOTER_PROGRAMS: FooterLink[] = [
  { href: "/club", label: "The Club" },
  { href: "/studio", label: "Studio" },
  { href: "/field-notes", label: "Field Notes", pending: true },
  { href: "/apply", label: "Apply" },
];

/** Drops anything with no page behind it. */
export function live(links: FooterLink[]): NavLink[] {
  return links
    .filter((l) => !l.pending)
    .map(({ href, label }) => ({ href, label }));
}

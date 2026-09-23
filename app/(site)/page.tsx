import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
  HEADING,
  ARROW,
  LINK_ARROW,
  MONO,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { Photo } from "@/components/site/photo";
import { TypeHero } from "@/components/site/type-hero";
import { PortfolioWall } from "@/components/site/portfolio-wall";
import { OfferWipe } from "@/components/site/offer-wipe";
// GMarkShader: the hero held it until the photograph took that edge. Kept as
// an import-less note rather than an unused import — see the hero below.
import { MemberVoices } from "@/components/site/member-voices";
import { PHOTOS } from "@/lib/photos";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import {
  CLUB_HOME,
  FOUNDED_YEAR,
  LOCATION,
  POSITIONING,
  POSITIONING_ACCENT,
  PROMISE,
  SITE_NAME,
  STUDIO,
  TAGLINE_LINE,
  LUMA_CALENDAR_URL,
  THIS_MONTH,
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} — ${PROMISE}`,
  path: "",
  description: SITE_DESCRIPTION,
});


/**
 * THE HOMEPAGE, REBUILT AROUND THE QUESTION IT WAS ACTUALLY BEING ASKED.
 *
 * The page this replaces answered "Geekdom used to be coworking — what is it
 * now?" That is a transition question, it was written for people who already
 * had a desk here, and by 2026 almost nobody arriving on this page is one of
 * them. Seven of its ten sections argued a single point: that one membership
 * is worth $100 a month. The price, the nine-item benefit list and the room's
 * daily rhythm all lived here, which made the homepage a membership landing
 * page with the rest of Geekdom mentioned in passing.
 *
 * What it answers now: WHAT IS GEEKDOM IN 2026, and which door is mine.
 *
 * The spine, and why each beat is where it is:
 *
 *   1  Hero            One claim. The guide's positioning line, not three
 *                      competing hooks. No CTA — the nav carries Apply.
 *   2  Built here      EVIDENCE BEFORE ARGUMENT. Eighteen companies, 2012 to
 *                      2025, four acquired. This slot used to hold a marquee
 *                      of other organizations' logos.
 *   3  (removed)       "What Geekdom is in 2026", the ECOSYSTEM block. Taken
 *                      off at Geekdom's request. The four entries are still
 *                      linked from the footer's "Beyond the club" column.
 *   4  The Club        One door.
 *   5  The Studio      The other door.
 *   6  (removed)       "How the two fit together", the Club → Studio pipeline.
 *                      Geekdom: "We don't want to ever indicate that there is
 *                      some clear pathway from Club to Studio." Don't rebuild
 *                      it, and don't move its argument into another section.
 *   7  (removed)       "Why there's an application". Geekdom: "I definitely
 *                      don't want to talk about why an application." The slot
 *                      is held open for them to decide what fits; member
 *                      voices render here when there are any.
 *   8  This month      Source copy verbatim: a dated list from THIS_MONTH
 *                      and a link to the public Luma calendar.
 *   9  Since 2011      The origin as ADDITION, not subtraction.
 *   10 Close           One ask.
 *
 * WHAT MOVED OFF, and where it went: the price and the benefit list to /club,
 * where they are the closing argument rather than the middle of a larger
 * story; the think/build/show rhythm to /club as well. Nothing was deleted.
 */
/**
 * A photograph with an editorial caption.
 *
 * The 2026 guide asks for these by name in its website section — "full-bleed
 * member photography with editorial captions" — and the homepage carried none.
 * A caption is also the cheapest way to make a picture stop reading as
 * decoration: it says the frame was chosen rather than dropped in.
 *
 * `<figure>`/`<figcaption>` rather than a div and a p, because that is what
 * the elements are for and it gives assistive tech the association for free.
 */
/*
  THE BLEED, IN ONE PLACE.

  `calc(544px - 50vw)` is the distance from the container's content edge to the
  viewport edge: the container caps at max-w-6xl (1152px) with lg:px-8, so its
  content is 1088px and half of that is 544. A negative margin of that size
  pushes the element exactly to the edge and no further.

  ONLY ABOVE 1152px. Below it the container is narrower than its max, the
  expression goes positive, and the margin would pull the image IN rather than
  push it out — a silent, wrong-direction bug. Same guard the hero's aside uses.

  THE CAPTION HAS TO BE PUT BACK. It is a child of the figure, so it inherits
  the negative margin and slides off the screen with the photograph — which is
  precisely what happened the first time this shipped: "BRIAN SIERAKOWSKI,
  WORKING A PRODUCT PROBLEM" ran off the left edge, missing its first letters.
  The matching positive padding returns it to the text column where a caption
  belongs.
*/
const BLEED = {
  right: {
    figure: "[@media(min-width:1152px)]:mr-[calc(544px-50vw)]",
    caption: "",
  },
  left: {
    figure: "[@media(min-width:1152px)]:ml-[calc(544px-50vw)]",
    caption: "[@media(min-width:1152px)]:pl-[calc(50vw-544px)]",
  },
} as const;

/**
 * One of the two offerings, as a panel. The whole panel is the link.
 *
 * STRETCHED LINK, not an <a> wrapping the panel: the link is the CTA text,
 * and its `::after` covers the panel, so the hit area is the whole box while
 * the accessible name stays "Explore the Club" rather than every word inside.
 * The padding lives on the inner wrapper, which is the link's positioning
 * context, so the `::after` reaches all four edges.
 *
 * THE HOVER INVERTS THE PANEL. The first version drew a Clay rule across the
 * top and stepped the ground one tone; it read as timid. Now the opposite
 * ground wipes in — Graphite into the Club, Bone into the Studio — from
 * whichever edge the pointer entered by, and back out through the edge it
 * leaves by (`OfferWipe`). The type inverts along the wipe edge, so the two panels trade places in
 * the palette as you move between them. Meanwhile the type on the panel you
 * are NOT on recedes (`offer-pair` in globals.css), so the pair reads as a choice
 * between two things, one at a time.
 *
 * Flat, square, brand colors only: no gradient, no shadow, no lift. Keyboard
 * focus triggers exactly the same state plus a Clay ring. On touch there is
 * no hover, so a tap simply follows the link.
 *
 * `reveal` is the scroll-in in globals.css.
 */
function Offering({
  ink = false,
  href,
  eyebrow,
  title,
  subhead,
  body,
  cta,
  className,
}: {
  /** Graphite at rest, wiping to Bone on hover. */
  ink?: boolean;
  href: string;
  eyebrow: string;
  title: string;
  subhead: string;
  body: string;
  cta: string;
  className?: string;
}) {
  const copy = { eyebrow, title, subhead, body, cta };
  return (
    <article
      className={cn(
        "offer reveal group relative isolate overflow-hidden border transition-[border-color] duration-500",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-clay has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-bone-light",
        ink
          ? "border-graphite bg-graphite"
          : "border-border bg-bone hover:border-graphite has-[a:focus-visible]:border-graphite",
        className,
      )}
    >
      <OfferCopy tone={ink ? "dark" : "light"} href={href} {...copy} />
      {/*
        THE FILL CARRIES ITS OWN COPY OF THE TYPE, in the inverted colors,
        clipped by the same edge. The first cut flipped the text color on a
        timer while the ground wiped, so mid-wipe the heading sat dark on the
        incoming Graphite — for a moment the one word that matters was
        invisible. With the type inside the clip, it changes color exactly
        along the wipe line and is never unreadable.

        Laid out identically (same padding, same width, same wraps), so the
        two layers register. `aria-hidden` and no link: the panel reads and
        clicks once, through the layer underneath.
      */}
      <OfferWipe className={ink ? "bg-bone" : "bg-graphite"}>
        <OfferCopy tone={ink ? "light" : "dark"} {...copy} />
      </OfferWipe>
    </article>
  );
}

/**
 * The type inside an `Offering`, in one of two color sets. With `href` it is
 * the real layer — the link, and the thing a screen reader reads. Without,
 * it is the inverted copy riding inside the fill: the CTA becomes a span.
 */
function OfferCopy({
  tone,
  href,
  eyebrow,
  title,
  subhead,
  body,
  cta,
}: {
  tone: "light" | "dark";
  href?: string;
  eyebrow: string;
  title: string;
  subhead: string;
  body: string;
  cta: string;
}) {
  // Literal class strings, so Tailwind can see every one.
  const c =
    tone === "dark"
      ? { eyebrow: "text-bone", strong: "text-bone", body: "text-bone/70" }
      : {
          eyebrow: "text-concrete",
          strong: "text-graphite",
          body: "text-muted-foreground",
        };
  const ctaClass = cn(
    "mt-auto inline-flex items-center gap-1.5 self-start pt-10 font-medium underline decoration-clay decoration-2 underline-offset-2",
    c.strong,
  );
  const ctaInner = (
    <>
      {cta}
      <ArrowRight className={ARROW.internal} strokeWidth={2} />
    </>
  );

  return (
    <div
      className={cn(
        "flex h-full flex-col p-8 sm:p-10 lg:p-12",
        // Only the real layer recedes when the other panel is hovered.
        href && "offer-content",
      )}
    >
      <p className={cn(MONO.eyebrow, c.eyebrow)}>{eyebrow}</p>
      {/* The inverted copy is not a second heading in the outline. */}
      {href ? (
        <h2 className={cn("mt-4", HEADING.heading, c.strong)}>{title}</h2>
      ) : (
        <p className={cn("mt-4", HEADING.heading, c.strong)}>{title}</p>
      )}
      <p className={cn("mt-6 max-w-2xl text-xl leading-relaxed", c.strong)}>
        {subhead}
      </p>
      <p className={cn("mt-5 max-w-xl leading-relaxed", c.body)}>{body}</p>
      {href ? (
        <Link
          href={href}
          className={cn(ctaClass, "after:absolute after:inset-0 focus-visible:outline-none")}
        >
          {ctaInner}
        </Link>
      ) : (
        <span className={ctaClass}>{ctaInner}</span>
      )}
    </div>
  );
}

function Frame({
  photo,
  aspect,
  sizes,
  caption,
  bleed,
  className,
}: {
  photo: (typeof PHOTOS)[keyof typeof PHOTOS];
  aspect: string;
  sizes: string;
  /** Optional — the Club's photograph runs without one, at Geekdom's request. */
  caption?: string;
  /** Run the photograph off that edge of the viewport. */
  bleed?: keyof typeof BLEED;
  className?: string;
}) {
  const b = bleed ? BLEED[bleed] : null;
  return (
    <figure className={cn(b?.figure, className)}>
      <Photo photo={photo} aspect={aspect} sizes={sizes} />
      {caption && (
        <figcaption
          className={cn("mt-3", MONO.label, "text-muted-foreground", b?.caption)}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * "Fifteen" rather than "15", without pinning the number.
 *
 * The source doc spells this count out in prose and a numeral reads wrong
 * mid-sentence, but hardcoding the word makes the line false the year after
 * next. Covers the range Geekdom will plausibly be in during this site's
 * life and falls back to the numeral outside it, which is wrong-looking
 * rather than wrong.
 */
const YEAR_WORDS: Record<number, string> = {
  14: "Fourteen",
  15: "Fifteen",
  16: "Sixteen",
  17: "Seventeen",
  18: "Eighteen",
  19: "Nineteen",
  20: "Twenty",
};
function spellYears(n: number): string {
  return YEAR_WORDS[n] ?? String(n);
}

export default function HomePage() {
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <>
      {/*
        ── SECTION ORDER FOLLOWS `Geekdom Website — Source Copy v1` ──────────

        The doc's homepage spine is: Hero, The Club, Studio, This month in the
        Club, Since 2011, In the Studio, Portfolio wall, Field Notes teaser,
        Apply CTA. This page ran a different one — portfolio and the convening
        section ahead of the two engines — which was a deliberate call written
        up in AGENTS.md and is not the one Geekdom asked for.

        EVERY SECTION HERE IS NOW IN THE DOC. Three that weren't were ruled on
        and are off at Geekdom's request — "What Geekdom is in 2026" (the
        ECOSYSTEM block), "How the two fit together" (the Club → Studio
        pipeline) and "Why there's an application". Don't bring any back.

        TWO OF THE DOC'S SECTIONS DO NOT EXIST YET: "In the Studio" (rotating
        founder cards — the doc's example is Kelsey Waters of Openlane) and
        the "Field Notes teaser", which needs the /field-notes page. Both are
        marked in the doc as CMS-backed and Field Notes is flagged there as
        "hide section and page until we populate with several articles".
      */}

      {/* ── 1 · Hero ─────────────────────────────────────────────────── */}
      {/*
        ONE CLAIM, from Geekdom's own source copy, which specifies this hero
        exactly: the positioning line, the tagline in Fraunces, a caption, and
        no CTA.

        There used to be four claims competing in the first screen — an eyebrow
        that called Geekdom "a space for problem solvers" (using the one word
        the brand is running from), a headline about unfair advantage, a
        paragraph about thinking partners, and the tagline. All four were good
        lines. Together they were noise, and the guide's actual positioning
        statement wasn't among them.

        "Make people your unfair advantage" is not lost — it closes the page,
        which is where a line that good belongs once the argument is made.
      */}
      <TypeHero
        eyebrow={
          <>
            Since {FOUNDED_YEAR}
            {/* The city is the first thing to go when the line gets tight. */}
            <span className="hidden sm:inline"> · {LOCATION.city}</span>
          </>
        }
        /*
          Sliced from POSITIONING rather than retyped, so the accent can't
          drift out of step with lib/site.ts — and it falls back to the plain
          line if the constant is ever reworded, rather than rendering a
          half-highlighted sentence.
        */
        /*
          THE LINE BREAKS ARE SET HERE, NOT LEFT TO `text-balance`.

          The headline is three lines at 72px and the browser was choosing
          which three. `text-wrap: balance` equalizes line LENGTHS, which is
          the wrong objective for a sentence with a clause in it — it will
          happily put "founders" on a row by itself if that evens the block
          out, and on a 1470px MacBook Air it did.

          What it should break on is the sense:

              San Antonio's club for
              serious founders and
              builders.

          which is also exactly where the Clay accent starts, so the first
          forced break costs nothing extra — it is the boundary the span was
          already drawn on.

          ONLY AT lg. Below 1024px the type steps down to 60px and then 48px
          while the column narrows faster, so these three lines stop fitting
          and a forced break would strand words mid-phrase. Measured in Rubik
          500 inside the h1's `max-w-4xl`: 732 / 705 / 287 against 896px of
          measure at 72px. It fits with room; it does not at 60.

          THE SPACE GOES BEFORE THE `<br>`, both times. When the rule is
          hidden the space is the word separator and has to be there; when it
          renders, a space at the end of a line collapses and costs nothing.
          Putting it after would leave a visible indent on the wrapped line.
        */
        /*
          ALL BONE, NO CLAY SPAN — see the note in type-hero.tsx. On this
          ground Clay measures 2.30:1 and the accent moves to the rule above
          the eyebrow. POSITIONING_ACCENT still drives the LINE BREAKS, so the
          headline breaks on its clause exactly as before and the constant
          stays the single source for where that clause starts.
        */
        title={
          POSITIONING.endsWith(POSITIONING_ACCENT) ? (
            <>
              {POSITIONING.slice(0, -POSITIONING_ACCENT.length)}
              <br className="hidden lg:block" />
              {POSITIONING_ACCENT.slice(
                0,
                POSITIONING_ACCENT.lastIndexOf(" "),
              )}{" "}
              <br className="hidden lg:block" />
              {POSITIONING_ACCENT.slice(
                POSITIONING_ACCENT.lastIndexOf(" ") + 1,
              )}
            </>
          ) : (
            POSITIONING
          )
        }
        /*
          THE PHOTOGRAPH IS THE GROUND NOW, and the g-mark that used to hold
          this edge is off the homepage.

          WHAT THE TRADE ACTUALLY IS. The mark here was a WebGL gradient
          running through a brand mark, and the 2026 guide bans gradients on
          the marks outright — it was the pending-sign-off exception, live on
          the most-seen screen on the site. What replaces it is "full-bleed
          member photography", which the guide asks for by name. On
          brand-compliance grounds that is a gain, not a swap of like for like.

          WHY THIS FRAME, of nineteen. `conversation` is the only one in the
          library that satisfies all three things the composition needs — see
          the note on `media` in type-hero.tsx — and it has a fourth going for
          it that nothing else does: IT IS NATIVELY BLACK AND WHITE. The
          reference sites reach this register by applying `grayscale`. Doing
          that to a Geekdom photograph would flatten the warm palette the brand
          is built on; this frame simply arrives there.

          It is also the right SUBJECT, which matters more here than anywhere
          else on the site. Two people standing in the middle of the floor,
          talking. Not a desk, not the amenities, not a room shot. The line
          that has to survive every rewrite is that the thinking partner is a
          person, in a room, on the third floor — and this is the only frame
          that is literally that sentence.

          TO PUT THE MARK BACK: drop `media` and pass
          `aside={<GMarkShader className="h-[min(32rem,56svh)] w-auto" />}`,
          then return the Editorial below to `text-graphite/90`.
        */
        media={{ photo: PHOTOS.conversation }}
        tail={
          /*
            The caption the source copy asks for. Mono, because it is an
            address — something you scan, not something you read.

            IT IS ALSO THE PAGE'S ONE CONCRETE FACT ABOVE THE FOLD. Everything
            else up here is a claim; this says the thing is a real room in a
            real building on a street you can walk down, which is the argument
            the whole site rests on.

            PLAIN TEXT, NOT A <p>. `tail` renders inside TypeHero's own
            paragraph, which already carries the mono eyebrow styling — a <p>
            here nests one inside another, which React can't hydrate and the
            browser silently reparents.
          */
          <>
            {/*
              "Third floor, Rand Building. Houston Street." — the doc's
              caption, and `LOCATION.building` is "The Rand Building", so the
              article is trimmed here rather than changed at the constant,
              which the address line elsewhere needs in full.
            */}
            {LOCATION.floor}, {LOCATION.building.replace(/^The /, "")}. Houston
            Street.
          </>
        }
      >
        <Editorial className="max-w-2xl text-2xl leading-[1.45] text-bone/90">
          {TAGLINE_LINE}
        </Editorial>
      </TypeHero>

      {/*
        A FULL-BLEED PHOTOGRAPH USED TO SIT HERE AND HAS BEEN REMOVED.

        Its own note explained the job: "what the fold gives up, the next
        screen gets back — full width, the room, no type over it." That was
        written when the hero was type only, with nothing but a headline above
        the fold, and it was the right call then.

        Two things have since taken the job away from it. The hero carries the
        g-mark at full height, so the fold no longer gives anything up. And
        every other photograph here gained an editorial caption, which left
        this one the only SILENT image on the page — atmosphere with no
        argument, sitting between the claim and the evidence and delaying the
        evidence by a screen.

        `welcomeHero` is now unused. It stays in lib/photos.ts: it is the
        warmest frame in the library — two members greeting each other, a room
        applauding around them — and /about or /club will want it.
      */}

      {/* ── 4 · The Club and the Studio ──────────────────────────────── */}
      {/*
        TWO PANELS, SIDE BY SIDE, NO PHOTOGRAPHS — Geekdom's brief. The two
        sections used to run one after the other, each a copy column beside a
        photograph, and Geekdom found it "too standard and basic" and too
        photo-heavy. What they asked for instead: the Club and the Studio
        "more clearly next to each other to communicate the split between
        them" as the two main offerings, in clean bordered boxes with
        different grounds, a hover effect, and a soft transition on scroll.

        THE GROUNDS CARRY THE SPLIT. The Club is Bone with a hairline on this
        Bone Light band; the Studio is Graphite. Nothing between them says one
        leads to the other — Geekdom has ruled that out explicitly — they are
        two offerings, shown as two.

        COPY IS THE SOURCE COPY, unchanged: `CLUB_HOME` for the Club, the doc's
        Subhead and Body for the Studio, figures from `STUDIO`.
      */}
      <Section tone="bone-light">
        <div className="offer-pair grid gap-5 lg:grid-cols-2 lg:gap-6">
          <Offering
            href="/club"
            eyebrow="Community"
            title="The Club"
            subhead={CLUB_HOME.subhead}
            body={CLUB_HOME.body}
            cta="Explore the Club"
          />
          <Offering
            ink
            href="/studio"
            eyebrow="Venture"
            title="Studio"
            subhead="A venture layer for the founders going all in."
            body={`We back ${STUDIO.foundersPerYear} founders a year with ${STUDIO.checkRange} ${STUDIO.checkTerms} checks from the Community Fund and hands-on work from our EIR. Not an accelerator. Not a cohort. A serious commitment to a small number of founders building toward scale.`}
            cta="Explore Studio"
            className="reveal-late"
          />
        </div>
      </Section>

      {/*
        EMPTY TODAY, so it renders nothing and the Club/Studio band (Bone
        Light) meets "This month" (Bone) directly. The day real voices land, this band sits
        between two different tones and matches one of them whichever it
        takes — retone "This month" and the sections below it when that
        happens, rather than letting two same-tone bands touch.
      */}
      <MemberVoices />

      {/* ── 8 · This month in the Club ──────────────────────────────── */}
      {/*
        GEEKDOM'S SOURCE COPY, IN ITS LIST LAYOUT: a header, dated one-line
        entries, one link out to the public calendar. It replaced a Luma card
        grid under "Come see how the room feels" — Luma isn't connected, so in
        production that grid never rendered and the section was a fallback
        sentence. The list lives in `THIS_MONTH` in lib/site.ts, which is
        maintained by hand monthly until there's a CMS or a Luma feed.
      */}
      <Section tone="bone">
        <SectionTitle>This month in the Club</SectionTitle>
        <ul className="mt-10 border-b border-border">
          {THIS_MONTH.map((item) => (
            <li
              key={`${item.date}-${item.title}`}
              className="grid gap-1 border-t border-border py-5 sm:grid-cols-[8rem_1fr] sm:gap-6"
            >
              <span className={cn(MONO.label, "pt-1 text-muted-foreground")}>
                {item.date}
              </span>
              <span className="text-lg leading-snug text-graphite">
                {item.title}
              </span>
            </li>
          ))}
        </ul>
        <a
          href={LUMA_CALENDAR_URL}
          target="_blank"
          rel="noreferrer noopener"
          className={cn("mt-10", LINK_ARROW)}
        >
          Explore our public events calendar
          <ArrowUpRight aria-hidden="true" className={ARROW.external} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </Section>

      {/* ── 9 · Since 2011 ─────────────────────────────────────────── */}
      {/*
        THE FULL PHOTOGRAPHIC BAND WAS TRIED HERE AND TAKEN BACK OUT, and the
        reason is this particular photograph rather than the treatment.

        A band needs a frame with somewhere for the copy to live — a subject
        off to one side and dead space on the other, which is what DEVSA and
        Startup Week are both working with. This one is the opposite: a posed,
        symmetrical portrait with Graham and Nick centered under the old wall
        sign and nothing spare anywhere in it. Copy over the left half lands on
        Graham's face and on "Welcome to", and the scrim that makes the copy
        readable is laid over the one thing in the photograph worth seeing.

        So it is contained, and it is the SHORTEST frame on the page — 16:9
        against the Club's 4:3 and the Studio's 3:2. It is also uncropped on
        purpose: both men and the sign above them are all load-bearing, and
        there is no crop that keeps three subjects in a symmetrical frame.

        The page still darkens once. It just does it at the close, one section
        below, which is where the ask is.

        THE ORIGIN AS ADDITION, NOT SUBTRACTION. This slot used to hold "The
        desk was never the point" — the members letter's line, which is about
        what Geekdom STOPPED doing and was written for people who had a desk
        here. Almost nobody arriving now did. "Geekdom started with an email"
        is the same history read forward, and it has an actual photograph of
        the two people in it.
      */}
      <Section tone="bone-light">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>Since {FOUNDED_YEAR}</Eyebrow>
            <SectionTitle>Geekdom started with an email.</SectionTitle>
            {/*
              THE DOC'S BODY, WITH THE COUNT STILL COMPUTED.

              `Source Copy v1` writes "Fifteen years ago, Graham Weston
              received an email from a founder that said San Antonio was
              missing a startup and tech community. Geekdom was born as the
              answer. Today, it powers the next generation of venture
              companies in San Antonio and the builders behind them."

              That is the whole body — Geekdom asked for the source copy and
              nothing added after it ("weird extra stuff and AI edits"), so
              don't append a second paragraph. The one thing not taken literally is
              "Fifteen": hardcoding it makes the sentence wrong on 1 January,
              so it spells the number computed from `FOUNDED_YEAR`. Same
              reasoning /since-2011 uses for its heading — the doc is the
              source of truth for the words, not for a figure that changes
              while nobody is looking.
            */}
            <Lede>
              {spellYears(years)} years ago, Graham Weston received an email
              from a founder that said San Antonio was missing a startup and
              tech community. Geekdom was born as the answer. Today, it powers
              the next generation of venture companies in San Antonio and the
              builders behind them.
            </Lede>
            {/*
              "Read our story → /about" — the doc's CTA for this section. It
              was "Read the letter to our members" pointing at
              /whats-changing, which Geekdom asked to remove along with the
              page; /about now exists, so the slot has the destination the doc
              always gave it.
            */}
            <Link href="/about" className={cn("mt-8", LINK_ARROW)}>
              Read our story
              <ArrowRight className={ARROW.internal} strokeWidth={2} />
            </Link>
          </div>
          <Frame
            photo={PHOTOS.grahamNick}
            aspect="aspect-[16/9]"
            sizes="(min-width: 1024px) 536px, 100vw"
            caption="Graham Weston and Nick Longo, 2011"
          />
        </div>
      </Section>

      {/* ── 2 · Built at Geekdom ─────────────────────────────────────── */}
      {/*
        EVIDENCE BEFORE ARGUMENT, and this slot is why the partner marquee is
        gone.

        That strip ran nine other organizations' logos under the headline
        "Building this with us", pinned to the base of the hero — the most
        valuable proof slot on the site, given away to borrowed credibility. It
        inverted the brand guide's two-voice principle ("quiet about ourselves,
        loud about our people"), a wall of civic and nonprofit marks is exactly
        how the "generic community organization" the guide says Geekdom is NOT
        presents itself, and the list was provisional anyway — pulled from
        Startup Week's sponsor wall, with a note in its own file saying the
        real one still had to come from Geekdom.

        This says the same thing honestly. Eighteen companies started here,
        oldest first, 2012 through 2025 unbroken, four of them acquired. It is
        checkable, which is what the guide's voice section asks for and what
        "$422.7M raised" can never be on its own.

        Reference: Brickyard runs its portfolio as a plain numbered list with
        no logos at all, and it is the most credible page on their site for
        exactly that reason. A grid of wordmarks with a stage and a year reads
        as a record; a grid of logos reads as a sponsor wall.
      */}
      <Section tone="bone">
        <Eyebrow>Built at {SITE_NAME}</Eyebrow>
        <PortfolioWall className="mt-8" />
      </Section>

      {/* ── 10 · Close ───────────────────────────────────────────────── */}
      {/*
        One question, one answer, one button. The close used to carry HOOK as
        its heading under a "Building something?" eyebrow, plus a second CTA
        to the Luma calendar; Geekdom asked for the question alone as the
        heading and Apply as the only action. The calendar link isn't lost —
        "This month in the Club" carries it.
      */}
      <Section tone="graphite">
        <div className="max-w-3xl">
          <SectionTitle className="text-bone">
            Building something<span className="text-clay">?</span>
          </SectionTitle>
          <Lede className="mt-6 text-bone/70">
            Membership is by application. We respond within two weeks.
          </Lede>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="on-ink">
              Apply to {SITE_NAME}
            </ButtonLink>
          </div>
        </div>
      </Section>

    </>
  );
}

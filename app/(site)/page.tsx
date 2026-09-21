import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
  Standfirst,
  FIGURE,
  HEADING,
  LINK_ARROW,
  MONO,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { EventCard } from "@/components/site/event-card";
import { Photo } from "@/components/site/photo";
import { TypeHero } from "@/components/site/type-hero";
import { PortfolioWall } from "@/components/site/portfolio-wall";
// GMarkShader: the hero held it until the photograph took that edge. Kept as
// an import-less note rather than an unused import — see the hero below.
import { MemberVoices } from "@/components/site/member-voices";
import { PHOTOS } from "@/lib/photos";
import { priceLabel } from "@/lib/membership";
import { safeUpcomingEvents } from "@/lib/luma";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import {
  ECOSYSTEM,
  FOUNDED_YEAR,
  GOAL,
  HOOK,
  LOCATION,
  LUMA_CALENDAR_URL,
  MILESTONES,
  PORTFOLIO,
  POSITIONING,
  POSITIONING_ACCENT,
  PROMISE,
  SITE_NAME,
  STUDIO,
  TAGLINE_LINE,
} from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} — ${PROMISE}`,
  path: "",
  description: SITE_DESCRIPTION,
});

export const revalidate = 300;

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
 *   3  What Geekdom is The convening work — LaunchSA, Startup Week, the fund,
 *                      MIT REAP. None of it was anywhere in page copy.
 *   4  The Club        One door.
 *   5  The Studio      The other door.
 *   6  How they connect THE SECTION THAT DIDN'T EXIST. The pipeline is the
 *                      whole thesis and it was a parenthetical on /studio.
 *   7  Who's in it     People.
 *   8  What's on       Something to turn up to without joining anything.
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
    photo: "[@media(min-width:1152px)]:rounded-r-none",
    caption: "",
  },
  left: {
    figure: "[@media(min-width:1152px)]:ml-[calc(544px-50vw)]",
    photo: "[@media(min-width:1152px)]:rounded-l-none",
    caption: "[@media(min-width:1152px)]:pl-[calc(50vw-544px)]",
  },
} as const;

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
  caption: string;
  /** Run the photograph off that edge of the viewport. */
  bleed?: keyof typeof BLEED;
  className?: string;
}) {
  const b = bleed ? BLEED[bleed] : null;
  return (
    <figure className={cn(b?.figure, className)}>
      <Photo photo={photo} aspect={aspect} sizes={sizes} className={b?.photo} />
      <figcaption
        className={cn("mt-3", MONO.label, "text-muted-foreground", b?.caption)}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

export default async function HomePage() {
  // `safeUpcomingEvents` swallows Luma failures and returns [] — a third-party
  // outage should never take the homepage down.
  const events = await safeUpcomingEvents(3);
  const price = priceLabel();
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <>
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
            {LOCATION.floor}, {LOCATION.building}. Houston Street.
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
      <Section tone="bone-light">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Built at {SITE_NAME}</Eyebrow>
            <SectionTitle>
              {PORTFOLIO.length} companies, {years} years.
            </SectionTitle>
          </div>
          <Link
            href="/studio"
            className={LINK_ARROW}
          >
            How we back them
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        <PortfolioWall className="mt-12" />

        {/*
          The milestones sit UNDER the companies, not above them. They are the
          aggregate of the list you just read rather than a free-floating brag,
          and a figure placed after its evidence is an argument where the same
          figure placed before it is a claim.
        */}
        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-border pt-12 sm:grid-cols-3">
          {MILESTONES.map((m) => (
            <div key={m.label}>
              <dt className={cn(FIGURE.md, "text-graphite")}>{m.figure}</dt>
              <dd className={cn("mt-2", MONO.label, "leading-relaxed text-muted-foreground")}>
                {m.label}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── 3 · What Geekdom is in 2026 ──────────────────────────────── */}
      {/*
        THE SECTION THE SITE HAS NEVER HAD.

        A visitor could read every page and conclude Geekdom is a nice floor
        with a small fund attached. It operates the city's open-access
        entrepreneurship hub for the City of San Antonio, produces the region's
        startup week, and sits on the team that put San Antonio into MIT's
        regional program. Geekdom's own Media boilerplate says so; none of it
        was in page copy anywhere, only as four link labels in a footer column
        called "Related".

        This is what makes the two membership products mean anything. The Club
        and the Studio are how you participate; this is why there is something
        to participate in.

        THE VERBS ARE THE CONTENT. Each entry states the exact relationship —
        operated, run, backed by, sits on — rather than flattening all four
        into "partner". See ECOSYSTEM in lib/site.ts for why that field is
        required and which two still need confirming.
      */}
      <Section tone="bone">
        {/*
          `items-start` is what makes the sticky column below work at all. A
          grid item stretches to the row's height by default, so the left
          column would be exactly as tall as the list beside it and would have
          nowhere to travel — `position: sticky` on a full-height element is a
          no-op, and it fails silently, which is why this looks like a
          typo-level detail and isn't.
        */}
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          {/*
            THE CLAIM HOLDS WHILE THE EVIDENCE SCROLLS.

            The heading and the two ledes make one argument — Geekdom convenes
            the city's startup community — and the four entries beside them are
            what backs it up. Letting the claim scroll away means the reader
            meets "operated by Geekdom, in partnership with the City of San
            Antonio" with no heading in view to attach it to.

            `top-24` rather than flush: the navbar is h-16 (64px) and sticky
            itself, so anything pinned at `top-0` slides under it. 96px clears
            it with a little air.

            `lg:` only. Below that the two stack, the left column is directly
            above the list rather than beside it, and pinning it would just
            eat a phone's viewport.
          */}
          <div className="lg:sticky lg:top-24">
            <Eyebrow>What we are</Eyebrow>
            <SectionTitle>
              The institution behind San Antonio&rsquo;s startup community.
            </SectionTitle>
            <Lede>
              {SITE_NAME} runs a members&rsquo; club and a venture fund. It also
              convenes the wider community — founders, capital, universities,
              industry and government — so the city&rsquo;s efforts reinforce
              each other instead of running in parallel.
            </Lede>
            <Lede className="mt-5">{GOAL}</Lede>
          </div>

          <ul>
            {ECOSYSTEM.map((entry) => (
              <li key={entry.name} className="border-t border-border py-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn(
                      HEADING.item,
                      "text-graphite decoration-clay decoration-2 underline-offset-4 hover:underline",
                    )}
                  >
                    {entry.name}
                  </a>
                  {entry.detail && (
                    <span className={cn(MONO.label, "text-muted-foreground")}>
                      {entry.detail}
                    </span>
                  )}
                </div>
                {/*
                  The role line is set apart from the description because it is
                  the load-bearing half: "operated by Geekdom, in partnership
                  with the City" is a different claim from "partner", and the
                  page should not let a reader skim past the difference.

                  SENTENCE CASE, NOT TRACKED-OUT MONO — and that is a fix, not
                  a preference. This line and the `detail` line beside the name
                  were BOTH uppercase mono, so every entry stacked two
                  competing labels above its prose and the section read as four
                  rows of shouting before it read as four sentences. The
                  strings were always written in sentence case; only the
                  `uppercase` class was transforming them.

                  Medium weight on graphite keeps it the most important line in
                  the entry without a third type treatment. The mono is now
                  doing one job here — the `detail` — which is what MONO is
                  for: the thing you scan, not the thing you read.

                  GRAPHITE, NOT CLAY. Clay is the obvious choice for a line
                  that wants emphasis, and it is 3.5:1 on bone, which fails AA
                  at this size. globals.css is explicit that Clay carries no
                  small text on any ground in this palette, and a line stating
                  Geekdom's relationship with the City of San Antonio is the
                  last place to make an exception.
                */}
                <p className="mt-2 text-sm font-medium leading-snug text-graphite">
                  {entry.role}
                </p>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {entry.description}
                </p>
                {/*
                  Carried from the data, not written here. The brand guide
                  requires the LaunchSA separation to appear wherever the two
                  are mentioned together — see ECOSYSTEM in lib/site.ts.
                */}
                {entry.boundary && (
                  <p className="mt-3 border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
                    {entry.boundary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── 4 · The Club ─────────────────────────────────────────────── */}
      <Section tone="bone-light">
        {/*
          THE THREE PHOTOGRAPHS ON THIS PAGE NO LONGER RHYME, which was the
          whole problem: Club, Studio and Since-2011 were each a rounded
          rectangle, vertically centerd, in half a two-column grid — the same
          move three times, and two of them at the same 4:3.

          What varies now is scale, shape and alignment. This one is the
          largest (1.15fr, ~584px) and sits at the TOP of its row; the Studio's
          is smaller, wider and sits low; the 2011 frame is a small sharp plate.
          Nothing is centerd in its box any more, so the eye is given a reason
          to move down the page rather than a rhythm to fall asleep in.

          THE COLUMN BLEED WAS TRIED HERE AND TAKEN BACK OUT. Running the
          Club's and the Studio's photographs off the viewport edge made two
          ordinary product sections shout, and neither has the pixels to do it
          well — 1600px and 1548px against the ~1760 a 1920 display wants.

          The origin section near the close was then given that band instead,
          and it came back out too — for a different reason, written up there.
          NO PHOTOGRAPH ON THIS PAGE IS FULL WIDTH NOW. All three are
          contained, and what varies is size, crop and alignment: this one is
          large 4:3 and top-aligned, the Studio's is smaller 3:2 and sits low,
          the 2011 frame is a short wide plate.
        */}
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
            <Eyebrow>Community</Eyebrow>
            <SectionTitle>The Club</SectionTitle>
            <Standfirst>
              Hard problems don&rsquo;t get solved alone. So we built the room
              where the right person is already sitting.
            </Standfirst>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Application-based membership for founders, engineers, creators,
              operators, and the corporate and civic leaders who want a hand in
              what the city becomes. Monthly rituals, build sessions, office
              hours, member-only events, and 24/7 access to the third floor.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              It&rsquo;s not coworking. It&rsquo;s not an accelerator.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/club">Explore the Club</ButtonLink>
              {price && (
                <span className="inline-flex items-center text-muted-foreground">
                  {price}, by application
                </span>
              )}
            </div>
          </div>
          {/*
            PICKED AT 584px, WHICH IS THE ONLY SIZE THAT MATTERS HERE.

            Two frames were tried before this one and both failed at the size
            they actually render. `theRoom` is not a room at all — it is four
            faces at close range, and it sat here under a caption claiming an
            ambient view of a floor the frame does not contain. `fullHouse` is
            genuinely the room, but a laptop, a tripod and a table edge eat its
            bottom-left quarter, so at 584px you read the clutter first and the
            room second; it is also an APPLAUSE moment, which belongs to the
            events section rather than to a section about membership.

            `speaking` is the one that holds up small: the wall of windows and
            downtown behind it, the floor's own colour on the right, a clear
            focal point, and — the part that decides it — a row of listening
            faces you can still read at 584px. The copy above says the room is
            where the right person is already sitting. This is people sitting
            in it, turned toward each other.
          */}
          <Frame
            photo={PHOTOS.speaking}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 584px, 100vw"
            caption="A session on the third floor"
          />
        </div>
      </Section>

      {/* ── 5 · The Studio ───────────────────────────────────────────── */}
      <Section tone="bone">
        {/*
          The counterweight to the Club section above: its photograph is large
          and top-aligned, so this one is smaller, a wider crop, and sits LOW —
          `self-end` drops it against the bottom of the copy instead of
          floating beside its middle. Two sections that mirror each other are
          still a rhyme; two that answer each other are a rhythm.

          0.85fr, so roughly 460px. That is also the most this source can carry
          sharply: 1198px covers 599 CSS px at 2x and no more.
        */}
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          {/* Photo first in source order on desktop so the two product
              sections mirror each other rather than stacking identically. */}
          {/*
            Brian at the whiteboard, not two members talking by the windows.

            The frame this replaced (`oneOnOne`) is a good CLUB picture and a
            poor Studio one: this section promises "hands-on work from our
            Entrepreneur in Residence", and a photograph of two people in
            conversation does not show that. This one does — the EIR, named
            three lines away, actually doing the work the section is selling.
          */}
          <Frame
            photo={PHOTOS.brianWhiteboard}
            aspect="aspect-[3/2]"
            sizes="(min-width: 1024px) 460px, 100vw"
            caption="Brian Sierakowski, working a product problem"
            className="lg:order-first lg:self-end"
          />
          <div>
            <Eyebrow>Venture</Eyebrow>
            <SectionTitle>Studio</SectionTitle>
            <Standfirst>
              For the founders going all in, a check and six to twelve months
              of someone&rsquo;s undivided attention.
            </Standfirst>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              We back {STUDIO.foundersPerYear} founders a year with{" "}
              {STUDIO.checkRange} {STUDIO.checkTerms} checks from the{" "}
              {STUDIO.fund} and hands-on work from our {STUDIO.eir.role}.
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Not an accelerator. Not a cohort. No open application — founders
              are scouted and invited.
            </p>
            <div className="mt-8">
              <ButtonLink href="/studio" variant="outline">
                Explore Studio
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* ── 6 · How they connect ─────────────────────────────────────── */}
      {/*
        THE THESIS, AND IT WAS A PARENTHETICAL.

        Naming two products does not explain them. The sentence that does lives
        on /studio in a subordinate clause — "Club membership isn't a
        prerequisite, but most Studio relationships start there" — and it is
        the single most important sentence on the site, because it is the only
        thing that makes the two halves one business rather than a landlord
        with a side fund.

        It runs both directions, and both are load-bearing:
          Club → Studio   membership is the on-ramp. That is what makes it
                          worth more than rent on a nice floor.
          Studio → Club   the portfolio is the proof the room works. Eighteen
                          companies is the reason to believe the membership is
                          worth having.

        On the ink band because it is the argument, not a feature — the same
        weight the mission statement used to carry here.
      */}
      <Section tone="graphite">
        <Eyebrow onInk>How the two fit together</Eyebrow>
        <SectionTitle className="text-bone">
          One is the on-ramp. The other is where it leads.
        </SectionTitle>
        <Lede className="text-bone/70">
          Most Studio relationships start in the Club. Not because
          membership buys you a check — it doesn&rsquo;t, and there&rsquo;s
          nothing to apply to — but because the work is easier to see up close.
        </Lede>

        <ol className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
          {[
            {
              title: "You join the room",
              body: "Apply to the Club. A person reads it. If it's a fit, you're on the third floor with everyone else building something here.",
            },
            {
              title: "You get known for the work",
              body: "Office hours, build sessions, pitch nights. Over months, the people around you learn what you're building and how you handle the hard part of it.",
            },
            {
              title: "Sometimes we go all in",
              body: `Four to six times a year, the Studio backs one. ${STUDIO.checkRange}, ${STUDIO.engagement} of hands-on work, and the local customers and investors who make the next round possible.`,
            },
          ].map((step, i) => (
            <li key={step.title}>
              {/* Bone, not clay: on a graphite ground Clay is 4.3:1, which
                  clears AA for large text only and this is 12px. */}
              <p className={cn(MONO.label, "text-bone/70")}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className={cn("mt-3", HEADING.subhead, "text-bone")}>
                {step.title}
              </h3>
              <p className="mt-3 leading-relaxed text-bone/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── 7 · Why there's an application ───────────────────────────── */}
      {/*
        THIS SECTION USED TO BE A SECOND "WHO'S IN THE ROOM" AND IT DUPLICATED
        /club's, which is the page that should own that.

        The overlap was not just thematic. Both carried the same eyebrow, both
        opened on a list of the same member types, and both closed with an
        identical three-up photo grid — two of whose three frames were the same
        photographs. A reader going homepage → Explore the Club met the same
        section twice in four screens, the second time in Geekdom's own source
        copy and therefore better written.

        So /club keeps the roster and the give-first culture, and this keeps
        the one line the other never had: who is here is the whole product.
        That is not a description of the members, it is the argument for the
        gate — the reason an application exists at all, and the reason the
        Studio can scout from the room. A different claim deserved a different
        section rather than a reworded copy of one.

        ONE PHOTOGRAPH, NOT THREE, for the same reason. A 3-up grid here would
        rhyme with /club's whatever the copy above it said.

        AND IT HAS TO BE FACES. This slot held `fullHouse` — the whole floor,
        packed — which is a fine picture and the wrong argument: at 1088px
        wide a head in it is about thirty pixels tall, so the one thing this
        section is about, WHO, was the one thing you could not make out.
        `theRoom` is four people at close range. Cropped to 16:7 it becomes a
        frieze of faces rather than a room with people in it, which is the
        difference between the claim above it and the claim below.

        `makeAPoint` WAS TRIED HERE AND HELD OFF, and it is the closer call on
        the page. It puts six readable people across the measure against this
        frame's three, which is more "who" — but it also arrives right under
        the Club section's `speaking`, and the two are the same photograph in
        substance: a group in session, shot from the back of the room. This
        one is the only CLOSE-RANGE frame on the homepage, and scale variety is
        what stops the five photographs here from rhyming.

        Its out-of-focus foreground head costs about a quarter of the frame and
        cannot be cropped out — at 16:7 from a 3:2 source, cover crops
        vertically and `object-position` has no horizontal slack to work with.
        It is left in as what it is: a shallow-depth device that puts the
        reader inside the room rather than watching it.
      */}
      <Section tone="bone">
        <Eyebrow>Why there&rsquo;s an application</Eyebrow>
        <SectionTitle>Who&rsquo;s here is the whole product.</SectionTitle>
        <Lede>
          Everything else on this page can be copied. A floor, a calendar, a
          check — none of it is hard to reproduce. The room is the part that
          isn&rsquo;t, and it stays that way only if someone is paying
          attention to who joins it.
        </Lede>
        <Lede className="mt-5">
          So there is an application, and a person on the Geekdom team reads
          every one. It takes about ten minutes to write and we answer within
          two weeks, either way.
        </Lede>

        <Frame
          photo={PHOTOS.theRoom}
          aspect="aspect-[16/7]"
          sizes="(min-width: 1152px) 1088px, 100vw"
          caption="Mid-session, third floor"
          className="mt-14"
        />
      </Section>

      <MemberVoices />

      {/* ── 8 · What's on ────────────────────────────────────────────── */}
      {/*
        The one section addressed to someone who is not going to join today.
        Most of the calendar is open, and an event is the only no-commitment
        way into any of this — which is also, per /studio, how a founder who
        isn't ready to apply gets on the radar.
      */}
      <Section tone="bone-light">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>This month</Eyebrow>
            <SectionTitle>Come see how the room feels.</SectionTitle>
          </div>
          <Link
            href="/events"
            className={LINK_ARROW}
          >
            All events
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>

        {events.length > 0 ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <Lede className="mt-10 max-w-xl">
            The full calendar lives on Luma — meetups, build sessions, office
            hours, and pitch nights, most of them open to non-members.
          </Lede>
        )}
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
      <Section tone="bone">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>Since {FOUNDED_YEAR}</Eyebrow>
            <SectionTitle>Geekdom started with an email.</SectionTitle>
            <Lede>
              {years} years ago, Graham Weston received an email from a founder
              saying San Antonio was missing a startup and tech community.
              Geekdom was the answer to it.
            </Lede>
            <Lede className="mt-5">
              The shape has changed since — a coworking floor, then programs,
              then a club and a fund. What hasn&rsquo;t is the thing being
              answered: founders need the right people around them at the right
              moment. The space changes. The people in it don&rsquo;t.
            </Lede>
            <Link
              href="/whats-changing"
              className={cn("mt-8", LINK_ARROW)}
            >
              Read the letter to our members
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
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

      {/* ── 10 · Close ───────────────────────────────────────────────── */}
      {/*
        HOOK gets the last word. It was the h1 for the life of the old site and
        it is too good to retire — but as an opening claim it competed with the
        positioning line and with the tagline, and a visitor met three
        arguments before a single fact. Here it has the whole page behind it,
        which is the only place an assertion like that can actually land.
      */}
      {/*
        THE HEADINGS WERE THE WRONG WAY ROUND HERE. "Building something?" was
        an <h2> at 24px and HOOK — the page's closing claim, the line that was
        the h1 of the old site — was a <p> at 48px. To a screen reader the
        close announced the question and not the answer.

        It is now the same shape as every other section on this page: eyebrow,
        SectionTitle, Lede, CTAs. That also retires a `!text-bone` override,
        which was there only because `Subhead` bakes in `text-graphite` and
        this is the one place it lands on a dark ground.
      */}
      <Section tone="graphite">
        <div className="max-w-3xl">
          <Eyebrow onInk>Building something?</Eyebrow>
          <SectionTitle className="text-bone">
            {HOOK.replace(/\.$/, "")}
            <span className="text-clay">.</span>
          </SectionTitle>
          <Lede className="mt-6 text-bone/70">
            Membership is by application. We respond within two weeks.
          </Lede>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="on-ink">
              Apply to {SITE_NAME}
            </ButtonLink>
            <ButtonAnchor
              external
              href={LUMA_CALENDAR_URL}
              variant="on-ink-outline"
              size="lg"
            >
              Come to an event first
            </ButtonAnchor>
          </div>
        </div>
      </Section>
    </>
  );
}

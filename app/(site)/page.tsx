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
  Subhead,
  FIGURE,
  HEADING,
  MONO,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { EventCard } from "@/components/site/event-card";
import { Photo } from "@/components/site/photo";
import { TypeHero } from "@/components/site/type-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PortfolioWall } from "@/components/site/portfolio-wall";
import { InkField } from "@/components/site/ink-field";
import { GMarkShader } from "@/components/site/crown-shader";
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
        title={
          POSITIONING.endsWith(POSITIONING_ACCENT) ? (
            <>
              {POSITIONING.slice(0, -POSITIONING_ACCENT.length)}
              <span className="text-clay">{POSITIONING_ACCENT}</span>
            </>
          ) : (
            POSITIONING
          )
        }
        aside={
          <InkField
            maskClassName="crown-mask"
            className="aspect-[55/41] h-auto w-[29rem] min-w-0 shrink-0 translate-x-[15%]"
            alpha={0.95}
          />
        }
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
        <Editorial className="max-w-2xl text-2xl leading-[1.45] text-graphite/90">
          {TAGLINE_LINE}
        </Editorial>
      </TypeHero>

      <PhotoBand
        photo={PHOTOS.welcomeHero}
        aspect="lg:aspect-video"
        priority
      />

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
            className="inline-flex items-center gap-1.5 font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
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
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-16">
          <div>
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

                  GRAPHITE, NOT CLAY, and this was caught on review rather than
                  designed. Clay is the obvious choice for a line that wants
                  emphasis — and it is 3.5:1 on bone, which fails AA at this
                  size. The rule in globals.css is explicit that Clay does not
                  carry small text on any ground in this palette, and a line
                  stating Geekdom's relationship with the City of San Antonio
                  is the last place to make an exception. Graphite is 15.3:1
                  and the mono + uppercase already separates it from the prose.
                */}
                <p className={cn("mt-2", MONO.label, "text-graphite")}>
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
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className={cn(MONO.label, "text-muted-foreground")}>
              Community
            </p>
            <SectionTitle className="!mt-3">The Club</SectionTitle>
            <p className="mt-6 text-xl leading-relaxed text-graphite">
              Hard problems don&rsquo;t get solved alone. So we built the room
              where the right person is already sitting.
            </p>
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
          <Photo
            photo={PHOTOS.theRoom}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 544px, 100vw"
          />
        </div>
      </Section>

      {/* ── 5 · The Studio ───────────────────────────────────────────── */}
      <Section tone="bone">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Photo first in source order on desktop so the two product
              sections mirror each other rather than stacking identically. */}
          <Photo
            photo={PHOTOS.oneOnOne}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 544px, 100vw"
            className="lg:order-first"
          />
          <div>
            <p className={cn(MONO.label, "text-muted-foreground")}>Venture</p>
            <SectionTitle className="!mt-3">Studio</SectionTitle>
            <p className="mt-6 text-xl leading-relaxed text-graphite">
              For the founders going all in, a check and six to twelve months
              of someone&rsquo;s undivided attention.
            </p>
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

      {/* ── 7 · Who's in the room ────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Who&rsquo;s in the room</Eyebrow>
        <SectionTitle>Find your people.</SectionTitle>
        <Lede>
          Founders, engineers, and creators. The operators and investors
          who&rsquo;ve done it before. The corporate and civic leaders who want
          a hand in what this city becomes.
        </Lede>
        <Lede className="mt-5">
          Who&rsquo;s here is the whole product — which is why there&rsquo;s an
          application, and why a person reads every one.
        </Lede>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <Photo photo={PHOTOS.makeAPoint} aspect="aspect-[3/2]" sizes="(min-width: 640px) 341px, 100vw" />
          <Photo photo={PHOTOS.speaking} aspect="aspect-[3/2]" sizes="(min-width: 640px) 341px, 100vw" />
          <Photo photo={PHOTOS.headsDown} aspect="aspect-[3/2]" sizes="(min-width: 640px) 341px, 100vw" />
        </div>
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
            className="inline-flex items-center gap-1.5 font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
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
          <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
            The full calendar lives on Luma — meetups, build sessions, office
            hours, and pitch nights, most of them open to non-members.
          </p>
        )}
      </Section>

      {/* ── 9 · Since 2011 ───────────────────────────────────────────── */}
      {/*
        THE ORIGIN, AS ADDITION RATHER THAN SUBTRACTION.

        This slot used to hold "The desk was never the point" — the members
        letter's line, and the emotional peak of the old page. It is the right
        line in the wrong place: it is about what Geekdom STOPPED doing,
        written for someone who just lost a desk, and almost nobody arriving
        here ever had one. To a new visitor it reads as an apology for a thing
        they never knew existed.

        "Geekdom started with an email" is Geekdom's own origin from its source
        copy, and it does the opposite work: it says this place has always been
        the answer to somebody asking for it. Which is exactly what the Club
        and the Studio are — the current shape of that answer.

        The letter is still one click away, where it belongs.
      */}
      <Section tone="bone">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_14rem] lg:gap-16">
          <div>
            <Eyebrow>Since {FOUNDED_YEAR}</Eyebrow>
            <SectionTitle>Geekdom started with an email.</SectionTitle>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {years} years ago, Graham Weston received an email from a founder
              saying San Antonio was missing a startup and tech community.
              Geekdom was the answer to it.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              The shape has changed since — a coworking floor, then programs,
              then a club and a fund. What hasn&rsquo;t is the thing being
              answered: founders need the right people around them at the right
              moment. The space changes. The people in it don&rsquo;t.
            </p>
            <Link
              href="/whats-changing"
              className="mt-8 inline-flex items-center gap-1.5 font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
            >
              Read the letter to our members
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
          <GMarkShader className="mx-auto h-56 w-auto sm:h-72 lg:h-[26rem]" />
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
      <Section tone="graphite">
        <div className="max-w-3xl">
          <Subhead className="!text-bone">Building something?</Subhead>
          <p className={cn("mt-4", HEADING.heading, "text-bone")}>
            {HOOK.replace(/\.$/, "")}
            <span className="text-clay">.</span>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-bone/70">
            Membership is by application. We respond within two weeks.
          </p>
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

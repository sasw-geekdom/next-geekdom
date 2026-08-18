import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/lib/format";
import { ArrowRight } from "lucide-react";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
  FIGURE,
  HEADING,
} from "@/components/site/section";
import { EventCard } from "@/components/site/event-card";
import { Photo } from "@/components/site/photo";
import { TypeHero } from "@/components/site/type-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PartnerRow } from "@/components/site/partner-row";
import { InkField } from "@/components/site/ink-field";
import { GMarkShader } from "@/components/site/crown-shader";
import { MemberVoices } from "@/components/site/member-voices";
import { PHOTOS } from "@/lib/photos";
import { BENEFITS, priceLabel } from "@/lib/membership";
import { safeUpcomingEvents } from "@/lib/luma";
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/seo";
import {
  HOOK,
  MILESTONES,
  GOAL,
  CLUB_OPENS,
  LOCATION,
  LUMA_CALENDAR_URL,
  MISSION,
  PROMISE,
  SITE_NAME,
  TAGLINE,
} from "@/lib/site";

/**
 * Five minutes, at the segment level. The fetch-level revalidate in lib/luma.ts
 * only applies when the fetch runs — if Luma is down or unconfigured at build
 * time the page would otherwise be prerendered as permanently static with the
 * events section missing. See the note on app/(site)/events/page.tsx.
 */
/*
  The homepage sets its own, rather than leaning on the root layout.

  The layout supplies the <title> and <meta description> defaults for every
  page, but it deliberately declares no openGraph or canonical any more — those
  inherit, and a canonical of "/" on every page was telling Google the whole
  site was a duplicate of this one. So the homepage now claims "/" explicitly,
  the same way every other page claims its own path.
*/
export const metadata: Metadata = pageMetadata({
  title: `${SITE_NAME} — ${PROMISE}`,
  path: "",
  description: SITE_DESCRIPTION,
});

export const revalidate = 300;

/**
 * How the room works. Three modes, in the order a problem actually moves
 * through them: you think it through, you build it, you put it in front of
 * people who'll tell you the truth.
 */
const MODES = [
  {
    title: "Think it through",
    body: "Bring the thing you're stuck on. Office hours with mentors who've hit the same wall, fireside chats about the unglamorous middle, and the hallway conversation that reframes the whole problem.",
    photo: PHOTOS.oneOnOne,
  },
  {
    title: "Build it",
    body: "Heads down, together. Build sessions where the goal is to ship something before you leave, and drop-in workspace for the days you just need to focus.",
    photo: PHOTOS.headsDown,
  },
  {
    title: "Put it in front of people",
    body: "Say it out loud to a room that will tell you the truth. Pitch nights, demos, and the honest read you can't get from people who already agree with you.",
    photo: PHOTOS.pitch,
  },
];

export default async function HomePage() {
  // `safeUpcomingEvents` swallows Luma failures and returns [] — a third-party
  // outage should never take the homepage down.
  const events = await safeUpcomingEvents(3);
  const price = priceLabel();

  /*
    The hook with its closing phrase in gold. Derived from the HOOK constant by
    slicing rather than retyped, so the accent can't quietly drift out of step
    with lib/site.ts — and it falls back to the plain string if the constant is
    ever reworded, instead of rendering a half-highlighted sentence.

    Rust, not gold: this headline sits on SAND now, where rust measures 5.0:1
    and passes AA. Gold on this ground is 1.8:1 and would be unreadable — the
    two are not interchangeable, which is the standing rule in globals.css.
  */
  const ACCENT = "unfair advantage.";
  const title = HOOK.endsWith(ACCENT) ? (
    <>
      {HOOK.slice(0, -ACCENT.length)}
<span className="text-rust">{ACCENT}</span>
    </>
  ) : (
    HOOK
  );

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {/*
        Type carries the fold; the photograph comes straight after it.

        No image up here on purpose. The claim is the strongest thing the
        homepage has, and giving it the whole viewport at 8xl is what makes it
        read as a claim rather than a caption.
      */}
      <TypeHero
        eyebrow={
          <>
            A space for problem solvers
            {/* The city is the first thing to go when the line gets tight. */}
            <span className="hidden sm:inline"> · {LOCATION.city}</span>
          </>
        }
        title={title}
        footer={<PartnerRow />}
        aside={
          /*
            The crown, built out of the two pigments rather than filled with the
            standard flow. The mask does the shape; the shader knows nothing
            about it. `aspect-[55/41]` is the crown's own ratio — the mask is
            `contain`, so any other box letterboxes the mark inside it.
          */
          <InkField
            maskClassName="crown-mask"
            className="aspect-[55/41] h-auto w-[29rem] min-w-0 shrink-0 translate-x-[15%]"
            alpha={0.95}
          />
        }
        // PROTOTYPE — the g-mark in the hero's empty right zone.
      >
        <p className="text-xl leading-relaxed text-ink/75">
          {PROMISE} Not a tool — a person. The one who breaks the problem down
          with you, builds on your idea, and tells you the truth about it.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row short:mt-7">
          <ButtonLink href="/apply" size="lg">
            Apply for membership
          </ButtonLink>
          <ButtonLink href="/the-floor" size="lg" variant="outline">
            See the floor
          </ButtonLink>
        </div>
      </TypeHero>

      {/*
        What the fold gives up, the next screen gets back — full width, the
        room, no type over it.

        The UNCROPPED frame, deliberately. Cropped, it is one man standing
        alone; whole, it is two members greeting each other, which is the
        sentence above it made literal. The crop only existed because a hero
        put a headline across his face — with no type on the image, that reason
        is gone.

        16/9 rather than the default 3:1: this file is 3:2, and a 3:1 letterbox
        would throw away half its height and start cutting heads.
      */}
      <PhotoBand
        photo={PHOTOS.welcomeHero}
        aspect="lg:aspect-video"
        priority
      />

      {/* ── What Geekdom does ────────────────────────────────────────── */}
      {/*
        THE SECTION THE PAGE WAS MISSING.

        Everything else here describes a PLACE and what is in it — a room, a
        cafe, a calendar. None of it said that Geekdom is an organisation that
        does something. A visitor could read the whole page and conclude they
        were being sold access to a nice floor.

        Mentorship leads because Geekdom's own one-pager calls it "at the core
        of everything we do", and on this page it had been reduced to one bullet
        among nine.

        The numbers sit here, immediately under the claim, rather than five
        screens down where they were. They are the only hard evidence the site
        has, and proof placed after someone has already decided to leave is not
        proof. Both reference sites put their figures directly below the hero.
      */}
      <Section tone="white">
        <Eyebrow>What we do</Eyebrow>
        <SectionTitle>Building San Antonio, one startup at a time.</SectionTitle>
        <Lede>
          Geekdom is a startup community, not a landlord. Mentorship is the core
          of it — founders sitting with people who have already hit the wall
          they&rsquo;re hitting — wrapped in programming, events, and the
          introductions that come from being in the room every week.
        </Lede>
        <Lede className="mt-5">{GOAL}</Lede>

        {/*
          The evidence for "fifteen years in", and the only hard numbers on the
          site. They sit INSIDE this section rather than in a band of their own
          because they are the proof of the claim directly above them — a
          floating stats strip is a brag, the same numbers under a sentence
          about the track record are an argument.

          `tabular-nums` so the figures line up as a grid rather than drifting
          on the varying widths of proportional digits.
        */}
        <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-border pt-12 sm:grid-cols-3">
          {MILESTONES.map((m) => (
            <div key={m.label}>
              <dt className={cn(FIGURE.md, "text-ink")}>
                {m.figure}
              </dt>
              <dd className="mt-2 font-mono text-xs uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
                {m.label}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <Section tone="ink">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow onInk>Why this room</Eyebrow>
            <SectionTitle className="text-white">
              Hard problems don&rsquo;t get solved alone.
            </SectionTitle>
            {/*
              mt-6, matching Lede. Sections that used the Lede primitive sat at
              24px under their heading while the three that hand-rolled their
              own paragraph had drifted to 32 and 40 — the same class of problem
              the button and type scales fixed, one level down.
            */}
            <div className="mt-6 flex flex-col gap-6">
              {MISSION.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-lg leading-relaxed text-white/70"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
          {/* The black-and-white frame is deliberate here — it's the one image
              that sits on the ink band, and colour photography against that
              ground fights the section instead of settling into it. */}
          <Photo
            photo={PHOTOS.conversation}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 544px, 100vw"
          />
        </div>
      </Section>

      {/* ── Who's in the room ────────────────────────────────────────── */}
      <Section tone="deep">
        <Eyebrow>Who&rsquo;s in the room</Eyebrow>
        <SectionTitle>Find your people.</SectionTitle>
        <Lede>
          Founders, engineers, and creators. The operators and investors
          who&rsquo;ve done it before. The corporate and civic leaders who want a
          hand in what this city becomes.
        </Lede>
        <Lede className="mt-5">
          Who&rsquo;s here is the whole product — which is why there&rsquo;s an
          application, and why a person reads every one. San Antonio&rsquo;s
          startup community has grown in infrastructure, in investor activity,
          and in the number of companies that belong on a national stage. This is
          the room where the next one starts.
        </Lede>

        {/*
          Three frames, not two — this is the section that claims a range of
          people, so it should show one. The earlier pair was two men from the
          same afternoon, which argued the opposite of the copy above it.
          Someone asking, someone leading, someone pushing back.
        */}
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <Photo
            photo={PHOTOS.theRoom}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.speaking}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.makeAPoint}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
        </div>
      </Section>

      {/* ── Member voices ────────────────────────────────────────────── */}
      {/*
        Placed straight after "Who's in the room" on purpose: that section
        claims a range of people, and this is where some of them get to speak
        for themselves. Empty until there are real quotes.
      */}
      <MemberVoices />

      {/* ── How the room works ───────────────────────────────────────── */}
      <Section tone="white">
        <Eyebrow>How it works</Eyebrow>
        <SectionTitle>Break the problem down together.</SectionTitle>
        <Lede>
          Every hard thing you&rsquo;re building moves through the same three
          stages. The room is built for all of them.
        </Lede>

        <ul className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
          {MODES.map((mode, i) => (
            <li key={mode.title}>
              <Photo
                photo={mode.photo}
                aspect="aspect-[3/2]"
                sizes="(min-width: 1024px) 341px, (min-width: 640px) 50vw, 100vw"
              />
              {/*
                Label tracking, not eyebrow. These numerals are attached to the
                heading directly beneath them; the wider 0.18em is for a kicker
                standing on its own. See MONO in section.tsx.
              */}
              <p className="mt-5 font-mono text-xs tracking-[0.14em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className={cn("mt-2", HEADING.subhead, "text-ink")}>
                {mode.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {mode.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ── What you get ─────────────────────────────────────────────── */}
      <Section tone="deep">
        <Eyebrow>{LOCATION.floor} · {LOCATION.street}</Eyebrow>
        <SectionTitle>Everything on the floor, one membership.</SectionTitle>

        {/* The establishing shot — the actual room being described, so the
            benefit list below reads as an inventory of somewhere real. */}
        <Photo
          photo={PHOTOS.theFloorWide}
          aspect="aspect-[16/8]"
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="mt-6"
        />

        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <h3 className={cn(HEADING.item, "text-ink")}>
                {benefit.title}
              </h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col gap-6 rounded-xl border border-border bg-white p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            {price ? (
              <p className={cn(FIGURE.md, "text-ink")}>
                {price.split("/")[0]}
                <span className="text-lg font-medium text-muted-foreground">
                  /{price.split("/")[1]}
                </span>
              </p>
            ) : (
              <p className={cn(FIGURE.sm, "text-ink")}>
                Pricing coming soon
              </p>
            )}
            {/*
              NOT the NOT_INCLUDED list, which used to run here.

              Three negations directly beneath the price and beside the CTA is
              the worst possible place for them: at the moment of deciding, the
              page was reading as a list of deductions. That list was written
              for existing coworking members who needed to know what was
              ending — for someone who never had a desk it is only subtraction,
              and it still appears on /membership under "What it isn't", which
              is where a comparison belongs.

              What replaces it answers the two questions actually being asked at
              a price with an APPLY button on it: am I paying now, and am I
              stuck? Both answers are true — the Stripe checkout link is only
              issued after a person approves the application, and cancelling
              runs through the billing portal.
            */}
            <p className="mt-2 text-muted-foreground">
              Nothing is charged until you&rsquo;re accepted, and you can cancel
              any time.
            </p>
            {/*
              WHEN. The page asked for an application and a card without ever
              saying when the thing being bought starts — a date the FAQ has
              had all along and the homepage did not.
            */}
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              The club opens {formatLongDate(CLUB_OPENS)}
            </p>
          </div>
          <ButtonLink href="/apply" size="lg" className="shrink-0">
            Apply for membership
          </ButtonLink>
        </div>
      </Section>

      {/* ── Events ───────────────────────────────────────────────────── */}
      {
        <Section tone="white">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>What&rsquo;s next</Eyebrow>
              <SectionTitle>Explore what&rsquo;s on.</SectionTitle>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 font-medium text-rust hover:underline"
            >
              All events
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          {/*
            NEVER an empty section. This used to be wrapped in
            `{events.length > 0 && …}`, so a missing Luma key on production
            deleted the whole thing silently — taking the "there is always
            something on" proof with it, with no error anywhere to notice.
            An empty calendar now points at the calendar instead.
          */}
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
      }

      {/* ── The origin ───────────────────────────────────────────────── */}
      {/*
        MOVED to just before the close, and that is the point. "The space
        changes. The people in it don't." only lands if you have been told a
        space changed — sitting five sections earlier, most readers reached the
        close without that setup and the line read as a non sequitur.
      */}
      {/*
        The one place on the homepage a mark appears at size, with the flow
        running through it.

        It belongs to THIS section specifically: the mark is the oldest thing
        Geekdom owns, and this is the section about the fifteen years behind the
        change. Anywhere else on the page it would be decoration; here it's the
        subject. The paragraphs run one column rather than two to make room for
        it, which they can afford — the measure was wide and thin at 2x.

        The g, not the crown: the crown is wide and shallow and sat as a band
        beside the copy, while the g stands the full height of the text block
        and holds the right edge of the section.
      */}
      <Section tone="sand">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_14rem] lg:gap-16">
          <div>
            <Eyebrow>Fifteen years in</Eyebrow>
            <SectionTitle>The desk was never the point.</SectionTitle>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Geekdom opened as a coworking space for geeks. A shared desk was
              the best tool we had for putting builders next to each other, and
              it worked — hundreds of companies got started because someone sat
              down next to the right person.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              But the desk was never really the point. The point was the person
              sitting next to you. So we stopped selling desks and started
              building the room around the thing that was actually working.
            </p>
            <Link
              href="/whats-changing"
              className="mt-8 inline-flex items-center gap-1.5 font-medium text-rust hover:underline"
            >
              Read the letter to our members
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          {/*
            SIZED BY HEIGHT, not width. The g-mark is 40x127 — nearly four times
            taller than it is wide — so giving it a column width the way the
            crown took one would make it about 1,200px tall. Constrain the
            height and let the width follow.
          */}
          <GMarkShader className="mx-auto h-56 w-auto sm:h-72 lg:h-[26rem]" />
        </div>
      </Section>

      {/* ── Close ────────────────────────────────────────────────────── */}
      <Section tone="ink">
        <div className="max-w-3xl">
          <p className={cn(HEADING.heading, "text-white")}>
            The space changes.
            <br />
            <span className="text-gold">The people in it don&rsquo;t.</span>
          </p>
          <p className="mt-6 text-lg leading-relaxed text-white/70">
            {TAGLINE} If it still calls to you, we hope you&rsquo;re excited to
            keep building with us too.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="on-ink">
              Apply for membership
            </ButtonLink>
            <ButtonAnchor
              external
              href={LUMA_CALENDAR_URL}
              variant="on-ink-outline"
              size="lg"
            >
              Browse the calendar
            </ButtonAnchor>
          </div>
        </div>
      </Section>
    </>
  );
}

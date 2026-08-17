import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Container,
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
} from "@/components/site/section";
import { EventCard } from "@/components/site/event-card";
import { Photo } from "@/components/site/photo";
import { PHOTOS } from "@/lib/photos";
import { BENEFITS, priceLabel } from "@/lib/membership";
import { safeUpcomingEvents } from "@/lib/luma";
import {
  HOOK,
  LOCATION,
  LUMA_CALENDAR_URL,
  MISSION,
  PROMISE,
  TAGLINE,
} from "@/lib/site";

/**
 * Five minutes, at the segment level. The fetch-level revalidate in lib/luma.ts
 * only applies when the fetch runs — if Luma is down or unconfigured at build
 * time the page would otherwise be prerendered as permanently static with the
 * events section missing. See the note on app/(site)/events/page.tsx.
 */
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

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {/*
        The photograph is the ground the hero sits on, not a block beside it. On
        desktop it holds the right side and dissolves leftward into the page;
        on mobile it's a plain image in the flow between the headline and the
        body copy. Stops live in `.hero-bleed` / `.hero-blur` in globals.css.

        The Container is NOT `relative`, on purpose. The photograph lives inside
        it in the DOM (it has to, to land between the headline and the body copy
        on mobile) but on desktop it goes `absolute` and must resolve against
        the SECTION to reach the screen edge — a positioned Container would trap
        it inside the 72rem measure. It still paints behind the text, because a
        `-z-10` child of the isolated section sits above that section's
        background and below its in-flow content.
      */}
      <section className="relative isolate overflow-hidden bg-sand">
        {/*
          HEIGHT. `calc(100svh - 4rem)` is the viewport minus the sticky
          navbar's h-16, so on a large monitor or a TV the hero fills exactly
          the space below the header instead of stopping short of it.

          PADDING is symmetric at lg (`py-16`), which is the part that was
          actually broken. `justify-center` centres the copy in the CONTENT box,
          so the old pt-28/pb-24 pair pushed it permanently low — and on a
          MacBook Air the copy was tall enough to exceed that box entirely, at
          which point justify-center stops doing anything and everything sits
          under 112px of dead padding. Equal padding lets it centre for real.
        */}
        <Container className="pt-20 pb-20 sm:pt-28 sm:pb-24 lg:flex lg:min-h-[calc(100svh-4rem)] lg:flex-col lg:justify-center lg:py-16">
          <Eyebrow>
            A space for problem solvers
            {/* The city is the first thing to go when the line gets tight. */}
            <span className="hidden sm:inline"> · {LOCATION.city}</span>
          </Eyebrow>
          {/*
            6xl from lg up. The copy is held to max-w-2xl so it clears the
            photograph's fade; 7xl inside that measure pushes "unfair
            advantage." onto a third line and crowds the paragraphs beneath it.
          */}
          <h1 className="mt-5 max-w-2xl text-5xl font-bold leading-[1.02] tracking-[-0.03em] text-ink sm:text-7xl lg:text-6xl">
            {HOOK}
          </h1>

          {/*
            One element for both layouts — `relative` in flow on mobile,
            `lg:absolute` on desktop. Rendering two and hiding one per
            breakpoint would fetch the page's heaviest asset twice, because a
            `priority` image downloads even inside a `display:none` parent.

            The two overlay divs are inert below lg: their classes exist only
            inside the desktop media query, so on a phone this is just a photo.

            The element is narrow and full-height on desktop, which suits the
            near-square crop: at 1440 it's 691×766 against the file's 0.93, so
            almost nothing is thrown away. Widths are set so the element begins
            just past where the copy ends, leaving the gradient only a short
            distance to do its work — solid page colour to 6%, clear by 20%.
            Text clears the fade by +31px in the worst case.

            Mobile uses an aspect close to the file's own so the composition
            arrives intact rather than being centre-cropped into a letterbox.
          */}
          <div className="relative mt-10 aspect-9/10 w-full overflow-hidden rounded-xl bg-sand-deep sm:aspect-4/3 lg:absolute lg:inset-y-0 lg:left-auto lg:right-0 lg:-z-10 lg:mt-0 lg:aspect-auto lg:h-full lg:w-[40%] lg:rounded-none lg:bg-transparent xl:w-[46%] 2xl:w-[48%]">
            <Image
              src={PHOTOS.welcomeHero.src}
              alt={PHOTOS.welcomeHero.alt}
              fill
              /*
                `object-right` here — the opposite of the previous frame, because
                the crop moved the subject. He now sits at 55–97% of the file, so
                anchoring RIGHT is what guarantees he survives whatever
                horizontal crop the viewport imposes. He is full-frame on every
                size from a 1024px laptop to a 4K TV; the seated members behind
                him are what yields when space is tight (1% at 1024px, 43% on a
                MacBook Air, 56% from 1080p up).
              */
              className="object-cover lg:object-right"
              sizes="(min-width: 1536px) 48vw, (min-width: 1280px) 46vw, (min-width: 1024px) 40vw, 100vw"
              placeholder="blur"
              priority
            />
            <div className="hero-blur pointer-events-none absolute inset-0" />
            <div className="hero-bleed pointer-events-none absolute inset-0" />
          </div>

          <p className="mt-10 max-w-xl text-xl leading-relaxed text-ink/75 lg:mt-8">
            {PROMISE} Not a tool — a person. The one who breaks the problem down
            with you, builds on your idea, and tells you the truth about it.
          </p>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-ink/75">
            Geekdom is a membership club for founders and builders in San
            Antonio. One membership{price ? `, ${price}` : ""}. No dedicated
            desks. No offices. Just the {LOCATION.floor.toLowerCase()}, and
            everyone on it.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg">
              Apply for membership
            </ButtonLink>
            <ButtonLink href="/the-floor" size="lg" variant="outline">
              See the floor
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <Section tone="ink">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow onInk>Why this room</Eyebrow>
            <SectionTitle className="text-white">
              Hard problems don&rsquo;t get solved alone.
            </SectionTitle>
            <div className="mt-8 flex flex-col gap-6">
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
              <p className="mt-5 font-mono text-xs tracking-[0.18em] text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-2xl font-bold leading-tight text-ink">
                {mode.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {mode.body}
              </p>
            </li>
          ))}
        </ul>
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

      {/* ── The origin ───────────────────────────────────────────────── */}
      <Section tone="white">
        <Eyebrow>Fifteen years in</Eyebrow>
        <SectionTitle>The desk was never the point.</SectionTitle>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <p className="text-lg leading-relaxed text-muted-foreground">
            Geekdom opened as a coworking space for geeks. A shared desk was the
            best tool we had for putting builders next to each other, and it
            worked — hundreds of companies got started because someone sat down
            next to the right person.
          </p>
          <p className="text-lg leading-relaxed text-muted-foreground">
            But the desk was never really the point. The point was the person
            sitting next to you. So we stopped selling desks and started building
            the room around the thing that was actually working.
          </p>
        </div>
        <Link
          href="/whats-changing"
          className="mt-8 inline-flex items-center gap-1.5 font-medium text-rust hover:underline"
        >
          Read the letter to our members
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
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
          className="mt-10"
        />

        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title}>
              <h3 className="text-lg font-semibold text-ink">
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
              <p className="text-4xl font-bold tracking-tight text-ink">
                {price.split("/")[0]}
                <span className="text-lg font-medium text-muted-foreground">
                  /{price.split("/")[1]}
                </span>
              </p>
            ) : (
              <p className="text-3xl font-bold tracking-tight text-ink">
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
          </div>
          <ButtonLink href="/apply" size="lg" className="shrink-0">
            Apply for membership
          </ButtonLink>
        </div>
      </Section>

      {/* ── Events ───────────────────────────────────────────────────── */}
      {events.length > 0 && (
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

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </Section>
      )}

      {/* ── Close ────────────────────────────────────────────────────── */}
      <Section tone="ink">
        <div className="max-w-3xl">
          <p className="text-4xl font-bold leading-[1.1] text-white sm:text-5xl">
            The space changes.
            <br />
            <span className="text-gold">The people in it don&rsquo;t.</span>
          </p>
          <p className="mt-8 text-lg leading-relaxed text-white/70">
            {TAGLINE} If it still calls to you, we hope you&rsquo;re excited to
            keep building with us too.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="on-ink">
              Apply for membership
            </ButtonLink>
            <a
              href={LUMA_CALENDAR_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-13 items-center justify-center rounded-lg border border-white/25 px-7 text-lg font-medium text-white transition-colors hover:bg-white/10"
            >
              Browse the calendar
            </a>
          </div>
        </div>
      </Section>
    </>
  );
}

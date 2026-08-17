import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, Section, SectionTitle } from "@/components/site/section";
import { Photo } from "@/components/site/photo";
import { BleedHero } from "@/components/site/bleed-hero";
import { PHOTOS } from "@/lib/photos";
import { BENEFITS } from "@/lib/membership";
import { LOCATION } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Floor",
  description:
    "The third floor is the home of the Geekdom club — drop-in workspace, a cafe, reservable meeting rooms, and the programming that fills them.",
};

/**
 * What the room actually is.
 *
 * FLOOR NUMBER — "third floor" comes straight from the members letter. It's
 * the single fact on this page most likely to need correcting, so it reads
 * from LOCATION.floor rather than being typed into the copy; see lib/site.ts.
 */

const RHYTHM = [
  {
    title: "Meetups",
    body: "The regular gatherings that put you next to people you'd never have scheduled a meeting with.",
  },
  {
    title: "Build sessions",
    body: "Heads down, together. Ship something by the end of the day instead of talking about it.",
  },
  {
    title: "Office hours",
    body: "Mentors who've done it before, on the calendar, for the specific thing blocking you.",
  },
  {
    title: "Fireside chats",
    body: "The unglamorous middle of the story, told by the people who lived it.",
  },
  {
    title: "Pitch nights",
    body: "Say it out loud to a room that will tell you the truth.",
  },
  {
    title: "Retreats",
    body: "Away from the room, with the people you'd want in it. Small and focused.",
  },
];

export default function TheFloorPage() {
  return (
    <>
      <BleedHero
        eyebrow={`${LOCATION.floor} · ${LOCATION.street}`}
        title={
          <>
            One floor. All of it pointed at{" "}
            <span className="text-gold">one thing.</span>
          </>
        }
        photo={PHOTOS.theFloor}
        priority
      >
        <p className="text-lg leading-relaxed text-white/75">
          We consolidated on purpose. A place you come to do your best thinking,
          have your most important conversations, and be around people who raise
          your game.
        </p>
      </BleedHero>

      {/* What's in the room */}
      <Section tone="white" className="pt-4">
        <h2 className="text-2xl font-bold text-ink">What&rsquo;s in the room</h2>

        {/*
          Three of the benefits below are places rather than ideas — the cafe,
          the drop-in seating, the build sessions. Showing them here means the
          list that follows reads as a description of somewhere real rather than
          a list of amenities.
        */}
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <Photo
            photo={PHOTOS.theCafe}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.dropIn}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.programming}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
        </div>

        <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="border-t border-border pt-5">
              <h3 className="font-semibold text-ink">{benefit.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/* The rhythm */}
      <Section tone="ink">
        <Eyebrow onInk>The rhythm</Eyebrow>
        <SectionTitle className="text-white">
          What fills the calendar.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          New programming built to go deeper with the startups shaping our
          future — plus virtual platforms that take the energy beyond the rooms.
        </p>

        {/*
          The one major section that had no photograph. Six kinds of programming
          described in text on an ink band reads as a spec sheet; a frame of an
          actual fireside chat — which is item four on the list — gives the
          claims somewhere to land.
        */}
        <Photo
          photo={PHOTOS.fireside}
          aspect="aspect-[16/8]"
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="mt-12"
        />

        <ul className="mt-14 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {RHYTHM.map((item) => (
            <li key={item.title} className="border-t border-white/15 pt-5">
              <h3 className="font-semibold text-gold">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-white/65">{item.body}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/events" size="lg" variant="on-ink">
            See what&rsquo;s on
          </ButtonLink>
          <ButtonLink
            href="/apply"
            size="lg"
            className="border border-white/25 bg-transparent text-white hover:bg-white/10"
            variant="ghost"
          >
            Apply for membership
          </ButtonLink>
        </div>
      </Section>

      {/* Finding it */}
      <Section tone="deep">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>Finding us</Eyebrow>
            <SectionTitle>{LOCATION.building}</SectionTitle>
            <p className="mt-4 text-lg text-muted-foreground">{LOCATION.full}</p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Downtown, on Houston Street, a block off the Riverwalk. Take the
              elevator to the {LOCATION.floor.toLowerCase()}.
            </p>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(`Geekdom, ${LOCATION.postal}`)}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-8 inline-flex h-13 items-center justify-center rounded-lg bg-rust px-7 text-lg font-medium text-white transition-colors hover:bg-rust-deep"
            >
              Open in Maps
            </a>
          </div>
          {/* Downtown is visible through the windows here, which is the one
              thing the address copy can only assert. It also shows the floor
              between events — tables, daylight, conversation — which is what
              most of a membership actually looks like. */}
          <Photo
            photo={PHOTOS.byTheWindows}
            aspect="aspect-[3/2]"
            sizes="(min-width: 1024px) 544px, 100vw"
          />
        </div>
      </Section>
    </>
  );
}

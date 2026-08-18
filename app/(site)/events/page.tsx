import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import { Container, Eyebrow, Section, SectionTitle, Subhead } from "@/components/site/section";
import { EventCard } from "@/components/site/event-card";
import { TypeHero } from "@/components/site/type-hero";
import { hasEventsToShow, safePastEvents, safeUpcomingEvents } from "@/lib/luma";
import { LUMA_CALENDAR_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Meetups, build sessions, office hours, fireside chats, and pitch nights on the third floor. The Geekdom calendar.",
};

/**
 * Revalidate every five minutes, declared at the segment rather than left to
 * the `next.revalidate` on the fetch inside lib/luma.ts.
 *
 * Those only apply when the fetch actually runs. If Luma is unreachable at
 * build time — or the key isn't set yet — `safeUpcomingEvents` swallows the
 * error and returns [], no fetch is recorded, and the page is prerendered as
 * permanently static with an empty calendar. This guarantees it comes back.
 */
export const revalidate = 300;

/**
 * The calendar.
 *
 * A COMPACT TYPE HEADER, not the full-bleed photograph the floor and the
 * homepage-adjacent pages use. This page's job is the list: a listing that
 * spends a whole viewport on a hero pushes the first event below the fold and
 * hides the thing the visitor came for. The photograph's argument has already
 * been made by the time anyone gets here.
 *
 * Server Component, so the API key never reaches the browser and the rendered
 * list is indexable.
 */
export default async function EventsPage() {
  const configured = hasEventsToShow();
  const upcoming = await safeUpcomingEvents(24);

  // Only reach for past events when there's a thin upcoming list to pad — a
  // full calendar shouldn't cost a second API round trip on every render.
  const past = configured && upcoming.length < 3 ? await safePastEvents(3) : [];

  return (
    <>
      <TypeHero
        size="compact"
        eyebrow="The calendar"
        title={
          <>
            What&rsquo;s <span className="text-rust">on.</span>
          </>
        }
      >
        <p className="text-lg leading-relaxed text-muted-foreground">
          Meetups, build sessions, office hours with mentors, fireside chats,
          and pitch nights. Some are members only. Plenty aren&rsquo;t — come
          see how the room feels before you apply.
        </p>
      </TypeHero>

      <section className="bg-sand pb-24">
        <Container>
          {upcoming.length > 0 ? (
            <>
              <h2 className="sr-only">Upcoming events</h2>
              <EventGrid events={upcoming} />
            </>
          ) : (
            <EmptyState configured={configured} />
          )}

          {past.length > 0 && (
            <div className="mt-20">
              <Subhead>Recently</Subhead>
              <p className="mt-2 text-muted-foreground">
                A sense of what happens here.
              </p>
              <div className="mt-8 opacity-75">
                <EventGrid events={past} />
              </div>
            </div>
          )}

          <div className="mt-16 rounded-xl border border-border bg-white p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div>
              <Subhead className="text-xl">Never miss one</Subhead>
              <p className="mt-1 text-muted-foreground">
                Subscribe on Luma and everything new lands on your calendar.
              </p>
            </div>
            <ButtonAnchor
              external
              href={LUMA_CALENDAR_URL}
              variant="ink"
              className="mt-5 shrink-0 sm:mt-0"
            >
              Subscribe on Luma
            </ButtonAnchor>
          </div>
        </Container>
      </section>

      <Section tone="ink">
        <Eyebrow onInk>Want in on the members-only ones?</Eyebrow>
        <SectionTitle className="text-white">
          The best conversations happen in the room.
        </SectionTitle>
        <ButtonLink href="/apply" size="lg" variant="on-ink" className="mt-8">
          Apply for membership
        </ButtonLink>
      </Section>
    </>
  );
}

/**
 * FLEX-WRAP, NOT GRID — and that's the one structural thing worth copying from
 * the reference.
 *
 * A three-column grid left-aligns a final row of two, which reads as a hole on
 * the right of an otherwise symmetrical page. Wrapping flex items with
 * `justify-center` centres whatever the last row happens to hold. Calendars
 * almost never divide by three, so this is the common case, not the edge one.
 *
 * Widths subtract the gap so three still fit per row: `gap-6` is 1.5rem, and
 * each of the three cards gives up two thirds of one.
 */
function EventGrid({ events }: { events: Parameters<typeof EventCard>[0]["event"][] }) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
        >
          <EventCard event={event} />
        </div>
      ))}
    </div>
  );
}

/**
 * Two genuinely different empty states.
 *
 * A missing API key is a deployment problem and should read as "the calendar
 * lives over there", not as "Geekdom has no events" — which is what a single
 * generic empty state would tell every visitor to a preview deploy.
 */
function EmptyState({ configured }: { configured: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <CalendarX
        className="mx-auto h-8 w-8 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <Subhead className="mt-5 text-xl">
        {configured
          ? "Nothing on the calendar right now."
          : "The calendar lives on Luma."}
      </Subhead>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
        {configured
          ? "New events go up regularly — subscribe on Luma and you'll know first."
          : "Head over to see everything coming up on the third floor."}
      </p>
      <ButtonAnchor external href={LUMA_CALENDAR_URL} className="mt-7">
        Open the calendar
      </ButtonAnchor>
    </div>
  );
}

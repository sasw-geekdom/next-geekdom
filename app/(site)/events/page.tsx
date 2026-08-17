import type { Metadata } from "next";
import { CalendarX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, Section, SectionTitle } from "@/components/site/section";
import { EventCard } from "@/components/site/event-card";
import { PhotoHero } from "@/components/site/photo-hero";
import { PHOTOS } from "@/lib/photos";
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
 * Events come from Luma, cached for five minutes (see lib/luma.ts). This page
 * is a Server Component so the API key never reaches the browser and the
 * rendered list is indexable.
 */
export default async function EventsPage() {
  const configured = hasEventsToShow();
  const upcoming = await safeUpcomingEvents(24);

  // Only reach for past events when there's a thin upcoming list to pad — a
  // full calendar shouldn't cost a second API round trip on every render.
  const past =
    configured && upcoming.length < 3 ? await safePastEvents(3) : [];

  return (
    <>
      <PhotoHero
        eyebrow="The calendar"
        title={
          <>
            What&rsquo;s <span className="text-rust">on.</span>
          </>
        }
        photo={PHOTOS.fullHouse}
        priority
      >
        <p className="text-lg leading-relaxed text-muted-foreground">
          Meetups, build sessions, office hours with mentors, fireside chats,
          and pitch nights. Some are members only. Plenty aren&rsquo;t — come see
          how the room feels before you apply.
        </p>
      </PhotoHero>

      <Section tone="white" className="pt-4">
        {upcoming.length > 0 ? (
          <>
            <h2 className="sr-only">Upcoming events</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState configured={configured} />
        )}

        {past.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-ink">Recently</h2>
            <p className="mt-2 text-muted-foreground">
              A sense of what happens here.
            </p>
            <div className="mt-8 grid gap-6 opacity-75 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 rounded-xl border border-border bg-sand p-7 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Never miss one
            </h2>
            <p className="mt-1 text-muted-foreground">
              Subscribe on Luma and everything new lands on your calendar.
            </p>
          </div>
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-ink px-5 font-medium text-white transition-colors hover:bg-ink/90 sm:mt-0"
          >
            Subscribe on Luma
          </a>
        </div>
      </Section>

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
 * Two genuinely different empty states.
 *
 * A missing API key is a deployment problem and should read as "the calendar
 * lives over there", not as "Geekdom has no events" — which is what a single
 * generic empty state would tell every visitor to a preview deploy.
 */
function EmptyState({ configured }: { configured: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-sand px-6 py-16 text-center">
      <CalendarX
        className="mx-auto h-8 w-8 text-muted-foreground"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <h2 className="mt-5 text-xl font-semibold text-ink">
        {configured
          ? "Nothing on the calendar right now."
          : "The calendar lives on Luma."}
      </h2>
      <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
        {configured
          ? "New events go up regularly — subscribe on Luma and you'll know first."
          : "Head over to see everything coming up on the third floor."}
      </p>
      <a
        href={LUMA_CALENDAR_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-rust px-5 font-medium text-white transition-colors hover:bg-rust-deep"
      >
        Open the calendar
      </a>
    </div>
  );
}

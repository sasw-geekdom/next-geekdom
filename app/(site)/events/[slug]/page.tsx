import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Container, Eyebrow, PageTitle } from "@/components/site/section";
import { EventJsonLd } from "@/components/site/structured-data";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { ButtonAnchor } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEventDate, formatTime } from "@/lib/format";
import {
  eventLocation,
  isNearlyFull,
  safeEventBySlug,
  type LumaEventDetail,
} from "@/lib/luma";

/**
 * Five minutes, matching the listing. `dynamicParams` is left at its default so
 * an event published on Luma a minute ago resolves on first request instead of
 * 404ing until the next deploy — there is no `generateStaticParams` here for
 * the same reason: the set of events is not known at build time and pinning it
 * would freeze the calendar.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await safeEventBySlug(slug);
  if (!event) return { title: "Event not found", robots: { index: false } };

  // First paragraph only, trimmed. Descriptions run long and a meta description
  // past ~160 characters is truncated by search engines mid-word anyway.
  const summary = event.description?.split("\n").find(Boolean)?.slice(0, 200);

  const url = `${SITE_URL}/events/${slug}`;

  return {
    title: event.name,
    description: summary,
    // Its own canonical, like every other page. Without one it inherits the
    // root's, and a calendar that turns over weekly would have every event on
    // it pointing at the homepage.
    alternates: { canonical: `/events/${slug}` },
    openGraph: {
      title: `${event.name} · ${SITE_NAME}`,
      description: summary,
      type: "article",
      url,
      siteName: SITE_NAME,
      /*
        The organiser's own poster, when there is one. Left undefined otherwise,
        which is not a gap: the events segment ships an opengraph-image.png and
        Next falls back to it for every child route that doesn't override.
      */
      images: event.cover_url ? [{ url: event.cover_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${event.name} · ${SITE_NAME}`,
      description: summary,
    },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await safeEventBySlug(slug);

  /*
    404 covers all three failure modes on purpose: a malformed slug, an event
    that has been deleted or made private, and Luma being unreachable.
    `safeEventBySlug` never throws, so none of them can surface as a 500 on a
    page that gets shared into group chats and indexed.
  */
  if (!event) notFound();

  const membersOnly = event.visibility === "members-only";
  const nearlyFull = isNearlyFull(event);
  const past = new Date(event.end_at) < new Date();

  return (
    <main className="flex-1 bg-sand">
      {/*
        Event schema, which is what puts a date, a time and a place into the
        search result rather than a blue link. Only for events that haven't
        happened — marking up a past event asks to be shown as upcoming.
      */}
      {!past && (
        <EventJsonLd
          name={event.name}
          description={event.description ?? undefined}
          startAt={event.start_at}
          endAt={event.end_at}
          url={`${SITE_URL}/events/${slug}`}
          image={event.cover_url ?? undefined}
          location={eventLocation(event)}
        />
      )}

      <Container className="py-14 sm:py-20">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
          All events
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">
          <div>
            <Eyebrow>{past ? "Past event" : "Upcoming"}</Eyebrow>
            <PageTitle className="mt-4">
              {event.name}
            </PageTitle>

            {(membersOnly || nearlyFull) && (
              <div className="mt-5 flex flex-wrap gap-2">
                {membersOnly && <Badge tone="rust">Members only</Badge>}
                {nearlyFull && (
                  <Badge tone="gold">
                    {event.spots_remaining === 0
                      ? "Waitlist"
                      : `${event.spots_remaining} spots left`}
                  </Badge>
                )}
              </div>
            )}

            {event.cover_url && (
              <div className="relative mt-10 aspect-16/9 w-full overflow-hidden rounded-xl bg-sand-deep">
                <Image
                  src={event.cover_url}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover"
                />
              </div>
            )}

            <Description text={event.description} />
          </div>

          {/*
            The registration rail. Sticky on desktop only — on a phone it just
            sits at the end of the page, which is where someone who has finished
            reading expects it.
          */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-white p-6">
              <dl className="flex flex-col gap-4 text-sm">
                <Fact icon={CalendarDays} label="Date">
                  {formatEventDate(event.start_at)}
                </Fact>
                <Fact icon={Clock} label="Time">
                  {formatTime(event.start_at)} – {formatTime(event.end_at)}
                </Fact>
                <Fact icon={MapPin} label="Location">
                  {eventLocation(event)}
                </Fact>
                {membersOnly && (
                  <Fact icon={Users} label="Access">
                    Members only
                  </Fact>
                )}
              </dl>

              {/*
                Registration stays on Luma, always. Capacity, waitlists and the
                guest list live there, and taking sign-ups here would create a
                second source of truth that can disagree about whether an event
                is full.
              */}
              {past ? (
                <p className="mt-6 text-sm text-muted-foreground">
                  This one has already happened.{" "}
                  <Link href="/events" className="text-rust underline">
                    See what&rsquo;s coming up
                  </Link>
                  .
                </p>
              ) : (
                <ButtonAnchor
                  external
                  href={event.url}
                  className="mt-6 w-full"
                >
                  {event.registration_open === false
                    ? "View on Luma"
                    : "Register on Luma"}
                </ButtonAnchor>
              )}
            </div>

            {!past && membersOnly && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Not a member yet?{" "}
                <Link href="/apply" className="text-rust underline">
                  Apply for membership
                </Link>
                .
              </p>
            )}
          </aside>
        </div>
      </Container>
    </main>
  );
}

/**
 * The blurb, as paragraphs.
 *
 * Deliberately renders `description` (plain text) rather than `description_md`.
 * Luma's markdown is written by whoever created the event — including partners
 * who host on this calendar — and putting third-party markup through a renderer
 * onto our domain is an injection surface for the sake of some bold text. Split
 * on blank lines, print paragraphs, done.
 */
function Description({ text }: { text: LumaEventDetail["description"] }) {
  const paragraphs = (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!paragraphs.length) return null;

  return (
    <div className="mt-10 flex flex-col gap-5 text-lg leading-relaxed text-ink/80">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
        strokeWidth={1.6}
        aria-hidden="true"
      />
      <div>
        <dt className="sr-only">{label}</dt>
        <dd className="text-ink">{children}</dd>
      </div>
    </div>
  );
}

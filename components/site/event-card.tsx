import Image from "next/image";
import Link from "next/link";
import { formatEventDate } from "@/lib/format";
import { eventLocation, eventSlug, isNearlyFull, type LumaEvent } from "@/lib/luma";
import { Badge } from "@/components/ui/badge";
import { HEADING } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * One event from the Luma calendar.
 *
 * Links INWARD now, to `/events/[slug]`, where it used to link straight out to
 * lu.ma. The detail page is a real page on this domain — indexable, shareable,
 * and carrying the club's voice — and it still hands registration to Luma,
 * which is what stops the two ever disagreeing about capacity. The card no
 * longer needs `target="_blank"`, because staying on the site is the point.
 *
 * Cover art is the largest thing on the card, and the fields under it are
 * title, place, date — in that order. The old card led with the date in mono
 * and stacked three icon rows under the title; at the size a grid card renders,
 * the icons were decoration and the time was detail nobody needs until they're
 * deciding, which is what the detail page is for.
 */
export function EventCard({ event }: { event: LumaEvent }) {
  const nearlyFull = isNearlyFull(event);
  const membersOnly = event.visibility === "members-only";

  return (
    <Link
      href={`/events/${eventSlug(event)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-sand-deep">
        {event.cover_url && (
          <Image
            src={event.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className={cn(HEADING.item, "text-ink group-hover:text-rust")}>
          {event.name}
        </h3>
        <p className="mt-2 truncate text-sm text-muted-foreground">
          {eventLocation(event)}
        </p>
        {/* Mono, because a date is scanned rather than read. */}
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          {formatEventDate(event.start_at)}
        </p>

        {/*
          Below the image, not over it. Every badge tone here is a TINT — they
          are built to sit on the page's own ground, and floating one on top of
          an arbitrary event cover would put translucent colour over whatever
          that photograph happens to be, which no tone can be legible against.
        */}
        {(membersOnly || nearlyFull) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {membersOnly && <Badge tone="rust">Members only</Badge>}
            {nearlyFull && (
              <Badge tone="gold">
                {event.spots_remaining === 0
                  ? "Waitlist"
                  : `${event.spots_remaining} left`}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

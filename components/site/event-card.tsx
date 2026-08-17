import Image from "next/image";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/format";
import { eventLocation, isNearlyFull, type LumaEvent } from "@/lib/luma";
import { Badge } from "@/components/ui/badge";

/**
 * One event from the Luma calendar.
 *
 * Links out to Luma rather than to a local detail page: registration, waitlists
 * and capacity all live there, and mirroring them here would mean two places
 * that can disagree about whether an event is full.
 */
export function EventCard({ event }: { event: LumaEvent }) {
  const nearlyFull = isNearlyFull(event);

  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
    >
      {event.cover_url ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-deep">
          <Image
            src={event.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        // Not every event has cover art. A flat band keeps the grid's rows
        // aligned instead of letting one card come up short.
        <div className="aspect-[16/9] w-full bg-sand-deep" />
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-rust">
            {formatDate(event.start_at)}
          </p>
          {nearlyFull && (
            <Badge tone="gold">
              {event.spots_remaining === 0
                ? "Waitlist"
                : `${event.spots_remaining} left`}
            </Badge>
          )}
        </div>

        <h3 className="mt-2 text-lg font-semibold leading-snug text-ink group-hover:text-rust">
          {event.name}
        </h3>

        <dl className="mt-4 flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Time</dt>
            <CalendarDays
              className="h-4 w-4 shrink-0"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <dd>{formatTime(event.start_at)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Location</dt>
            <MapPin
              className="h-4 w-4 shrink-0"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <dd className="truncate">{eventLocation(event)}</dd>
          </div>
          {event.visibility === "members-only" && (
            <div className="flex items-center gap-2">
              <dt className="sr-only">Access</dt>
              <Users
                className="h-4 w-4 shrink-0"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <dd>Members only</dd>
            </div>
          )}
        </dl>
      </div>
    </a>
  );
}

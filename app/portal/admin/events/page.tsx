import { ExternalLink } from "lucide-react";
import { getUpcomingEvents, isLumaConfigured, eventLocation } from "@/lib/luma";
import { listEvents } from "@/lib/content/events";
import { EventManager } from "@/components/admin/event-manager";
import { MONO } from "@/components/site/section";
import { Badge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { formatDateTime } from "@/lib/format";
import { LUMA_CALENDAR_URL } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "This month in the Club" };

/**
 * "This month in the Club" — the homepage list, edited here.
 *
 * TWO DIFFERENT THINGS ON ONE PAGE, deliberately kept apart:
 *   · The LIST is the homepage's, and it's edited here (`events` collection).
 *     It carries events Geekdom doesn't host — Open Coffee Club, the AWS and
 *     ACM meetups — which will never be on Luma.
 *   · The LUMA CALENDAR, below, stays read-only: Luma is the system of record
 *     for Geekdom's own events (registration, waitlists, guest comms), and a
 *     second editor for those would be a second answer to "which is right".
 *     It appears once LUMA_API_KEY is set.
 */
export default async function AdminEventsPage(props: PageProps<"/portal/admin/events">) {
  const { add } = await props.searchParams;
  const list = await listEvents();
  // Server time, handed down so "upcoming" is decided once, here.
  const now = new Date().getTime();
  const configured = isLumaConfigured();

  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = [];
  let error: string | null = null;

  if (configured) {
    try {
      events = await getUpcomingEvents(50);
    } catch (e) {
      // Surfaced rather than swallowed — on a staff page, "the API key is
      // wrong" is exactly what the person reading needs to know.
      error = e instanceof Error ? e.message : "Failed to load events.";
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Site content"
        title="This month in the Club"
        description="The homepage's event list. Rows leave the site when their event ends."
        actions={
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonClass("outline", "sm", "border-border bg-bone-light")}
          >
            Luma calendar
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
          </a>
        }
      />

      <AdminSection>
        <EventManager events={list} now={now} startAdding={add === "1"} />
      </AdminSection>

      <AdminSection>
        <h2 className={cn(MONO.label, "mb-3 text-muted-foreground")}>
          On the Luma calendar
        </h2>
        {!configured && (
          <Notice
            title="Luma isn't connected yet."
            body="Once LUMA_API_KEY is set, Geekdom's own events from Luma show here, read-only. Until then, add them to the list above by hand."
          />
        )}

        {error && <Notice title="Couldn't reach Luma." body={error} />}

        {configured && !error && events.length === 0 && (
          <p className=" border border-dashed border-border bg-bone-light px-6 py-16 text-center text-sm text-muted-foreground">
            No upcoming events on the calendar.
          </p>
        )}

        {events.length > 0 && (
          <div className="overflow-hidden border border-border bg-bone-light">
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4"
                >
                  <div className="min-w-0 md:flex-1">
                    <p className="truncate font-medium text-graphite">
                      {event.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {eventLocation(event)}
                    </p>
                  </div>

                  <div className="md:w-56">
                    <p className="text-sm text-graphite">
                      {formatDateTime(event.start_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 md:w-52 md:justify-end">
                    {event.visibility === "members-only" && (
                      <Badge tone="info">Members</Badge>
                    )}
                    {typeof event.spots_remaining === "number" && (
                      <Badge tone={event.spots_remaining <= 5 ? "pending" : "neutral"}>
                        {event.spots_remaining} left
                      </Badge>
                    )}
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted-foreground transition-colors hover:text-graphite"
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={1.7} />
                      <span className="sr-only">Open {event.name} on Luma</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminSection>
    </>
  );
}

/*
  The dashed notice the member portal uses for anything provisional — it was
  a Clay tint with a brown (#7A5405) warning icon, neither in the palette.
*/
function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-border px-5 py-4">
      <p className="font-medium text-graphite">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

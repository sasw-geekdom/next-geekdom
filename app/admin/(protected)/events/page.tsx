import { ExternalLink, TriangleAlert } from "lucide-react";
import { getUpcomingEvents, isLumaConfigured, eventLocation } from "@/lib/luma";
import { Badge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { formatDateTime } from "@/lib/format";
import { LUMA_CALENDAR_URL } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Events" };

/**
 * Read-only view of the Luma calendar.
 *
 * Deliberately read-only: Luma is the system of record for events, and its own
 * editor handles registration, ticketing, waitlists, and guest comms. A partial
 * CRUD surface here would be a second place to change an event and a guaranteed
 * source of disagreement about which one is right.
 */
export default async function AdminEventsPage() {
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
        title="Events"
        description="Upcoming, from the Luma calendar."
        actions={
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={buttonClass("outline", "sm", "border-border bg-white")}
          >
            Manage on Luma
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
          </a>
        }
      />

      <AdminSection>
        {!configured && (
          <Notice
            title="Luma isn't connected."
            body="Set LUMA_API_KEY to pull the calendar. Keys are per-calendar and need Luma Plus — create one at luma.com/calendar/manage/api-keys."
          />
        )}

        {error && <Notice title="Couldn't reach Luma." body={error} />}

        {configured && !error && events.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">
            No upcoming events on the calendar.
          </p>
        )}

        {events.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4"
                >
                  <div className="min-w-0 md:flex-1">
                    <p className="truncate font-medium text-ink">
                      {event.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {eventLocation(event)}
                    </p>
                  </div>

                  <div className="md:w-56">
                    <p className="text-sm text-ink">
                      {formatDateTime(event.start_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 md:w-52 md:justify-end">
                    {event.visibility === "members-only" && (
                      <Badge tone="sky">Members</Badge>
                    )}
                    {typeof event.spots_remaining === "number" && (
                      <Badge tone={event.spots_remaining <= 5 ? "gold" : "neutral"}>
                        {event.spots_remaining} left
                      </Badge>
                    )}
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-muted-foreground transition-colors hover:text-rust"
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

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-gold/50 bg-gold/10 p-5">
      <TriangleAlert
        className="mt-0.5 h-5 w-5 shrink-0 text-[#7a5405]"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink/75">{body}</p>
      </div>
    </div>
  );
}

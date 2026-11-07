import { ExternalLink } from "lucide-react";
import { listEvents } from "@/lib/content/events";
import { EventManager } from "@/components/admin/event-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { LUMA_CALENDAR_URL } from "@/lib/site";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "This month in the Club" };

/**
 * "This month in the Club" — the homepage list, edited here (`events`
 * collection). Luma is not connected to the app and won't be: the calendar
 * stays on Luma, and the header links there.
 */
export default async function AdminEventsPage(props: PageProps<"/portal/admin/events">) {
  const { add } = await props.searchParams;
  const list = await listEvents();
  // Server time, handed down so "upcoming" is decided once, here.
  const now = new Date().getTime();

  return (
    <>
      <PageHeader
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
    </>
  );
}


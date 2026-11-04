import Link from "next/link";
import { listActivity, AREA_LABELS, type ActivityArea } from "@/lib/admin/activity";
import { ActivityList } from "@/components/admin/activity-list";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Activity" };

/**
 * WHO CHANGED WHAT — the admin's edit history, newest first, filterable by
 * area (?area=field-notes). The last 300 changes: the filter runs after the
 * read so the query needs no composite index (lib/admin/activity.ts).
 */
export default async function AdminActivityPage(props: PageProps<"/portal/admin/activity">) {
  const { area } = await props.searchParams;
  const pick = typeof area === "string" && area in AREA_LABELS ? (area as ActivityArea) : null;
  const all = await listActivity(300).catch(() => []);
  const entries = pick ? all.filter((e) => e.area === pick) : all;
  const areas = (Object.keys(AREA_LABELS) as ActivityArea[]).filter((a) => all.some((e) => e.area === a));

  return (
    <>
      <PageHeader eyebrow="Admin portal" title="Activity" description="Every change made in the admin, and who made it." />
      <AdminSection>
        {areas.length > 1 && (
          <nav aria-label="Filter by area" className="mb-6 flex flex-wrap gap-2">
            <Link href="/portal/admin/activity" aria-current={!pick ? "page" : undefined} className={buttonClass(!pick ? "ink" : "outline", "sm")}>
              All
            </Link>
            {areas.map((a) => (
              <Link
                key={a}
                href={`/portal/admin/activity?area=${a}`}
                aria-current={pick === a ? "page" : undefined}
                className={buttonClass(pick === a ? "ink" : "outline", "sm")}
              >
                {AREA_LABELS[a]}
              </Link>
            ))}
          </nav>
        )}
        <div className={cn(entries.length && "border-t border-border")}>
          <ActivityList entries={entries} />
        </div>
      </AdminSection>
    </>
  );
}

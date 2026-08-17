import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDashboardStats, listApplications } from "@/lib/admin/queries";
import { ApplicationBadge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { formatDate } from "@/lib/format";

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([
    getDashboardStats(),
    listApplications({ limit: 8 }),
  ]);

  const peak = Math.max(1, ...stats.applicationsByDay.map((d) => d.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Applications and membership, at a glance."
      />

      <AdminSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Applications" value={stats.applicationsTotal} />
          <Stat
            label="Awaiting review"
            value={stats.applicationsNew}
            accent={stats.applicationsNew > 0}
          />
          <Stat label="Active members" value={stats.membersActive} />
          <Stat
            label="Past due"
            value={stats.membersPastDue}
            accent={stats.membersPastDue > 0}
          />
        </div>

        {/* Applications over time */}
        <section className="mt-8 rounded-xl border border-border bg-white p-6">
          <h2 className="text-sm font-semibold text-ink">
            Applications, last 14 days
          </h2>
          {/*
            A bare CSS bar chart rather than a charting library — four numbers
            and a sparkline don't justify shipping one. Bars are given an
            explicit minimum so a zero day still reads as a day on the axis.
          */}
          <div className="mt-6 flex h-32 items-end gap-1.5">
            {stats.applicationsByDay.map((day) => (
              <div
                key={day.date}
                className="group relative flex-1"
                style={{ height: "100%" }}
              >
                <div className="flex h-full items-end">
                  <div
                    className="w-full rounded-t bg-rust/80 transition-colors group-hover:bg-rust"
                    style={{
                      height: `${Math.max(2, (day.count / peak) * 100)}%`,
                    }}
                  />
                </div>
                <span className="sr-only">
                  {day.date}: {day.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>{stats.applicationsByDay[0]?.date}</span>
            <span>
              {stats.applicationsByDay[stats.applicationsByDay.length - 1]?.date}
            </span>
          </div>
        </section>

        {/* Recent applications */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              Latest applications
            </h2>
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 text-sm font-medium text-rust hover:underline"
            >
              All applications
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
              No applications yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
              {recent.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-sand"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">
                        {app.name}
                        {app.company && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · {app.company}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {app.audience} · {app.stage}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        {formatDate(app.createdAt)}
                      </span>
                      <ApplicationBadge status={app.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AdminSection>
    </>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${
          accent ? "text-rust" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

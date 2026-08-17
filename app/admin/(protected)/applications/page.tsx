import Link from "next/link";
import { Download } from "lucide-react";
import { listApplications } from "@/lib/admin/queries";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/firebase/collections";
import { ApplicationBadge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Applications" };

export default async function ApplicationsPage(
  props: PageProps<"/admin/applications">,
) {
  const params = await props.searchParams;
  const raw = typeof params.status === "string" ? params.status : undefined;

  // Validate against the known set rather than passing the query string
  // through — an arbitrary value would build a Firestore query for a status
  // that can't exist and silently return an empty list.
  const status = APPLICATION_STATUSES.includes(raw as ApplicationStatus)
    ? (raw as ApplicationStatus)
    : undefined;

  const applications = await listApplications({ status });

  return (
    <>
      <PageHeader
        title="Applications"
        description={`${applications.length} ${status ? status : "total"}`}
        actions={
          <a
            href={`/api/admin/export/applications${status ? `?status=${status}` : ""}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 text-sm font-medium text-ink transition-colors hover:bg-sand-deep"
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Export CSV
          </a>
        }
      />

      <AdminSection>
        {/* Status filter */}
        <nav aria-label="Filter by status" className="flex flex-wrap gap-2">
          <FilterChip href="/admin/applications" active={!status}>
            All
          </FilterChip>
          {APPLICATION_STATUSES.map((s) => (
            <FilterChip
              key={s}
              href={`/admin/applications?status=${s}`}
              active={status === s}
            >
              <span className="capitalize">{s}</span>
            </FilterChip>
          ))}
        </nav>

        {applications.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center text-sm text-muted-foreground">
            Nothing here{status ? ` with status “${status}”` : " yet"}.
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
            {/* A list on small screens, a table from md up — a six-column table
                on a phone is unreadable however it's styled. */}
            <ul className="divide-y divide-border">
              {applications.map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/admin/applications/${app.id}`}
                    className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-sand md:flex-row md:items-center md:gap-4"
                  >
                    <div className="min-w-0 md:flex-1">
                      <p className="truncate font-medium text-ink">
                        {app.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {app.email}
                      </p>
                    </div>
                    <div className="min-w-0 md:w-48">
                      <p className="truncate text-sm text-ink">
                        {app.company || "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.audience}
                      </p>
                    </div>
                    <div className="hidden md:block md:w-40">
                      <p className="truncate text-sm text-muted-foreground">
                        {app.stage}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 md:w-44 md:justify-end">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </span>
                      <ApplicationBadge status={app.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminSection>
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3.5 text-sm font-medium transition-colors",
        active
          ? "bg-ink text-white"
          : "border border-border bg-white text-ink/70 hover:bg-sand-deep",
      )}
    >
      {children}
    </Link>
  );
}

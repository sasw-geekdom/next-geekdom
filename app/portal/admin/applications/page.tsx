import { Download } from "lucide-react";
import { listApplications } from "@/lib/admin/queries";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/firebase/collections";
import {
  applicationQuery,
  naturalDir,
  orderApplications,
  parseApplicationQueue,
  type ApplicationQueue,
  type ApplicationSort,
} from "@/lib/admin/review-queue";
import { APPLICATION_LABELS } from "@/components/ui/badge";
import { ApplicationStatusLabel, RowLink, Table, Tabs, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";
import { planOf } from "@/lib/membership";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Applications" };

/*
  THE APPLICATIONS WORKFLOW — tabs per stage, opening on Initial review
  (the work waiting), each with its count. One read of the whole list,
  filtered here: a status filter plus a date sort would need a composite
  index, and the list is hundreds, not thousands.

  A TABLE, sorted in the URL (?sort=name|plan|city|submitted&dir=asc|desc;
  newest first by default) so a sorted view can be shared. The Status
  column shows only on "All" — on a stage tab it would repeat the tab on
  every row. Company shows only when someone in view gave one.
*/

export default async function ApplicationsPage(
  props: PageProps<"/portal/admin/applications">,
) {
  const params = await props.searchParams;
  const queue = parseApplicationQueue(params);
  const { status, sort, dir } = queue;

  const all = await listApplications({ limit: 2000 }).catch(() => []);
  const count = (s: ApplicationStatus) => all.filter((a) => a.status === s).length;
  const applications = orderApplications(all, queue);

  const showCompany = applications.some((a) => a.company);
  const showStatus = status === "all";
  const href = (q: Partial<ApplicationQueue>) => `/portal/admin/applications?${applicationQuery({ ...queue, ...q })}`;
  // Clicking the sorted column flips it; another column starts at its natural order.
  const sortBy = (s: ApplicationSort) => ({
    dir: sort === s ? dir : null,
    href: href({ sort: s, dir: sort === s ? (dir === "asc" ? "desc" : "asc") : naturalDir(s) }),
  });
  // The row link carries the view, so Previous / Next on the detail page walks these rows.
  const rowQuery = applicationQuery(queue);

  return (
    <>
      <PageHeader
        title="Applications"
        description={`${count("initial_review")} waiting for initial review · ${count("team_review")} in team review`}
        actions={
          <a
            href={`/api/admin/export/applications${status !== "all" ? `?status=${status}` : ""}`}
            className={buttonClass("outline", "sm", "border-border bg-bone-light")}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Export CSV
          </a>
        }
      />

      <AdminSection>
        <Tabs
          label="Filter by stage"
          items={[
            ...APPLICATION_STATUSES.map((s) => ({ href: href({ status: s }), label: APPLICATION_LABELS[s], count: count(s), active: status === s })),
            { href: href({ status: "all" }), label: "All", count: all.length, active: status === "all" },
          ]}
        />

        {applications.length === 0 ? (
          <p className="mt-6 border border-dashed border-border bg-bone-light px-6 py-16 text-center text-sm text-muted-foreground">
            {status === "initial_review"
              ? "Nothing waiting for initial review. New applications from /apply land here."
              : status === "all"
                ? "No applications yet. They arrive from /apply."
                : `Nothing in ${APPLICATION_LABELS[status].toLowerCase()}.`}
          </p>
        ) : (
          <Table className="mt-6">
            <thead>
              <tr>
                <Th sort={sortBy("name")}>Name</Th>
                <Th className="hidden w-[20%] md:table-cell">Email</Th>
                {showCompany && <Th className="hidden w-[14%] lg:table-cell">Company</Th>}
                <Th className="hidden w-24 md:table-cell" sort={sortBy("plan")}>Plan</Th>
                <Th className="hidden w-36 lg:table-cell" sort={sortBy("city")}>City</Th>
                <Th className={cn("hidden w-[18%]", showStatus ? "2xl:table-cell" : "xl:table-cell")}>Describes themselves</Th>
                <Th className="w-28" sort={sortBy("submitted")}>Submitted</Th>
                {showStatus && <Th className="w-36">Status</Th>}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <Tr key={app.id}>
                  <Td>
                    <RowLink href={`/portal/admin/applications/${app.id}?${rowQuery}`}>{app.name}</RowLink>
                  </Td>
                  <Td className="hidden text-muted-foreground md:table-cell">{app.email}</Td>
                  {showCompany && <Td className="hidden lg:table-cell">{app.company || <span className="text-muted-foreground">—</span>}</Td>}
                  <Td className="hidden md:table-cell">{planOf(app.plan).name}</Td>
                  <Td className="hidden lg:table-cell">{app.city || <span className="text-muted-foreground">—</span>}</Td>
                  <Td className={cn("hidden text-muted-foreground", showStatus ? "2xl:table-cell" : "xl:table-cell")}>{app.describes[0] ?? "—"}</Td>
                  <Td className="tabular-nums text-muted-foreground">{tableDate(app.createdAt)}</Td>
                  {showStatus && (
                    <Td>
                      <ApplicationStatusLabel status={app.status} />
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </AdminSection>
    </>
  );
}

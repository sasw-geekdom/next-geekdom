import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
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
  type SortDir,
} from "@/lib/admin/review-queue";
import { APPLICATION_LABELS } from "@/components/ui/badge";
import { ApplicationStatusLabel, RowLink, Status, Table, Tabs, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";
import { TableSearch } from "@/components/admin/table-search";
import type { Application } from "@/lib/admin/types";
import { planOf } from "@/lib/membership";
import { RECOMMENDATION_LABELS } from "@/lib/application-research";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Applications" };

/*
  THE APPLICATIONS WORKFLOW — tabs per stage, opening on Research
  (the work waiting), each with its count. One read of the whole list,
  filtered here: a status filter plus a date sort would need a composite
  index, and the list is hundreds, not thousands.

  A TABLE, sorted in the URL (?sort=name|plan|city|submitted&dir=asc|desc;
  newest first by default) so a sorted view can be shared — Vercel's list
  conventions: ONE "Applicant" cell (name and any flags — Current member,
  From Airtable — then their one-sentence pitch beneath; email is in
  search and on the page), a PROGRESS cell whose question changes with
  the tab (write-up / recommendation / payment / where declined),
  WAITING (days since applying) on the open stages with anything past
  /apply's two-week promise in red, and SEARCH (?q=, name/email/company/
  city) above the table. "Describes themselves" came off: a phrase cut to
  a few words helped no one pick the next application — it's on the page.
  The Status column shows only on "All" — on a stage tab it would repeat
  the tab on every row.
*/

export default async function ApplicationsPage(
  props: PageProps<"/portal/admin/applications">,
) {
  const me = await requireAdmin();
  const params = await props.searchParams;
  const queue = parseApplicationQueue(params);
  const { status, sort, dir } = queue;
  const q = (typeof params.q === "string" ? params.q : "").trim();

  const everything = await listApplications({ limit: 2000 }).catch(() => []);
  // SEARCH: name, email, company or city — after the one read, like the tabs.
  const needle = q.toLowerCase();
  const all = needle
    ? everything.filter((a) => [a.name, a.email, a.company, a.city].some((v) => v?.toLowerCase().includes(needle)))
    : everything;
  const count = (s: ApplicationStatus) => all.filter((a) => a.status === s).length;
  const total = (s: ApplicationStatus) => everything.filter((a) => a.status === s).length;
  const applications = orderApplications(all, queue);

  const open = status === "initial_review" || status === "team_review";
  // "From Airtable" only where it tells rows apart — on a list that's all imports it says nothing.
  const mixedSources = applications.some((a) => a.source === "airtable") && applications.some((a) => a.source !== "airtable");
  const showStatus = status === "all";

  const withQ = (path: string) => (q ? `${path}${path.includes("?") ? "&" : "?"}q=${encodeURIComponent(q)}` : path);
  const href = (x: Partial<ApplicationQueue>) => withQ(`/portal/admin/applications?${applicationQuery({ ...queue, ...x })}`);
  // Clicking the sorted column flips it; another column starts at its natural order.
  const sortBy = (s: ApplicationSort) => ({
    dir: sort === s ? dir : null,
    href: href({ sort: s, dir: sort === s ? (dir === "asc" ? "desc" : "asc") : naturalDir(s) }),
  });
  // "Waiting" counts the other way from the date it sorts by: newest first is LEAST waiting first.
  const flip = (d: SortDir | null): SortDir | null => (d === "asc" ? "desc" : d === "desc" ? "asc" : null);
  const submittedSort = open ? { ...sortBy("submitted"), dir: flip(sortBy("submitted").dir) } : sortBy("submitted");
  // The row link carries the view, so Previous / Next on the detail page walks these rows.
  const rowQuery = applicationQuery(queue);
  const now = new Date().getTime();

  return (
    <>
      <PageHeader
        title="Applications"
        description={`${total("initial_review")} in research · ${total("team_review")} ready for the team`}
        actions={
          can(me.role, "data.export") ? (
            <a
              href={`/api/admin/export/applications${status !== "all" ? `?status=${status}` : ""}`}
              className={buttonClass("outline", "sm", "border-border bg-bone-light")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              Export CSV
            </a>
          ) : undefined
        }
      />

      <AdminSection>
        <div className="flex flex-col-reverse gap-3 md:flex-row md:items-end md:justify-between">
          <Tabs
            label="Filter by stage"
            className="min-w-0 flex-1"
            items={[
              ...APPLICATION_STATUSES.map((s) => ({ href: href({ status: s }), label: APPLICATION_LABELS[s], count: count(s), active: status === s })),
              { href: href({ status: "all" }), label: "All", count: all.length, active: status === "all" },
            ]}
          />
          <TableSearch placeholder="Search name, email, company…" className="w-full md:mb-2 md:w-72" />
        </div>

        {applications.length === 0 ? (
          <p className="mt-6 border border-dashed border-border bg-bone-light px-6 py-16 text-center text-sm text-muted-foreground">
            {q
              ? `No ${status === "all" ? "" : `${APPLICATION_LABELS[status].toLowerCase()} `}applications match “${q}”.`
              : status === "initial_review"
                ? "Nothing in research. New applications from /apply land here."
                : status === "all"
                  ? "No applications yet. They arrive from /apply."
                  : `Nothing in ${APPLICATION_LABELS[status].toLowerCase()}.`}
          </p>
        ) : (
          <>
            {q && (
              <p className="mt-4 text-[13px] text-muted-foreground">
                {applications.length} {applications.length === 1 ? "match" : "matches"} for “{q}”
              </p>
            )}
            <Table className={q ? "mt-2" : "mt-6"}>
              <thead>
                <tr>
                  <Th sort={sortBy("name")}>Applicant</Th>
                  <Th className="hidden w-24 md:table-cell" sort={sortBy("plan")}>Plan</Th>
                  <Th className="hidden w-40 lg:table-cell" sort={sortBy("city")}>City</Th>
                  <Th className="hidden w-56 sm:table-cell">{PROGRESS_HEADER[status]}</Th>
                  {showStatus && <Th className="hidden w-36 md:table-cell">Status</Th>}
                  <Th className="w-28" align="right" sort={submittedSort}>
                    {open ? "Waiting" : "Applied"}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const days = Math.floor((now - Date.parse(app.createdAt)) / 86_400_000);
                  const waiting = app.status === "initial_review" || app.status === "team_review";
                  return (
                    <Tr key={app.id} className="h-14">
                      <Td>
                        <span className="flex min-w-0 items-baseline gap-2">
                          <RowLink href={`/portal/admin/applications/${app.id}?${rowQuery}`}>{app.name}</RowLink>
                          {/* Flags that change how you'd approach them — quiet text, no boxes. */}
                          {flags(app, mixedSources).length > 0 && (
                            <span className="shrink-0 text-[13px] text-muted-foreground">{flags(app, mixedSources).join(" · ")}</span>
                          )}
                        </span>
                        <span className="block truncate text-[13px] text-muted-foreground">{pitch(app)}</span>
                      </Td>
                      <Td className="hidden md:table-cell">{planOf(app.plan).name}</Td>
                      <Td className="hidden text-muted-foreground lg:table-cell">{app.city || "—"}</Td>
                      <Td className="hidden sm:table-cell">
                        <Progress app={app} now={now} />
                      </Td>
                      {showStatus && (
                        <Td className="hidden md:table-cell">
                          <ApplicationStatusLabel status={app.status} />
                        </Td>
                      )}
                      <Td align="right" className="tabular-nums">
                        {open && waiting ? (
                          days > PROMISE_DAYS && app.source === "apply" ? (
                            // Past /apply's promise to reply within two weeks — a real problem, so red.
                            // Only for /apply: Airtable imports were never made that promise, and
                            // during the migration every one of them would be red.
                            <span title={`Applied ${tableDate(app.createdAt)} — past the two-week reply promise`}>
                              <Status kind="danger">{plural(days, "day")}</Status>
                            </span>
                          ) : (
                            <span className="text-muted-foreground" title={`Applied ${tableDate(app.createdAt)}`}>
                              {days === 0 ? "Today" : plural(days, "day")}
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground">{tableDate(app.createdAt)}</span>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </AdminSection>
    </>
  );
}

/** /apply promises a reply within two weeks. */
const PROMISE_DAYS = 14;
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/** Who they are, in their own words: the one-sentence pitch, else what they're building, else the company. */
function pitch(app: Application): string {
  const line = (app.brag || app.building || "").replace(/\s+/g, " ").trim();
  return line || app.company || app.email;
}

/** What sets this applicant apart before you open them. Plan has its own column. */
function flags(app: Application, mixedSources: boolean): string[] {
  return [app.formerMember && "Current member", mixedSources && app.source === "airtable" && "From Airtable"].filter(Boolean) as string[];
}

/** The PROGRESS column's heading — it answers a different question on each tab. */
const PROGRESS_HEADER: Record<ApplicationStatus | "all", string> = {
  initial_review: "Write-up",
  team_review: "Recommendation",
  approved: "Payment",
  declined: "Declined at",
  banned: "Progress",
  all: "Progress",
};

const ago = (iso: string, now: number) => {
  const d = Math.floor((now - Date.parse(iso)) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

/*
  WHERE IT IS, in one cell, by stage — so a first-time admin sees what's
  waiting on whom without opening anything:
    Research      Not started · Earlier notes · Draft by Monica, 2 days ago ·
                  Ready — recommends Approve (written, not sent yet)
    Team review   Monica's recommendation — the meeting's agenda
    Approved      Member (Enterprise, or imported from Airtable) · Paid ·
                  Payment link sent · Waiting on payment
    Declined      At research · By the team
*/
function Progress({ app, now }: { app: Application; now: number }) {
  const muted = (t: string) => <span className="text-muted-foreground">{t}</span>;
  const r = app.research;
  switch (app.status) {
    case "initial_review":
      if (!r) return muted("Not started");
      if (r.fromNotes) return muted("Earlier notes");
      if (r.recommendation) return <span>Ready — recommends {RECOMMENDATION_LABELS[r.recommendation].split(" ")[0]}</span>;
      return (
        <span>
          Draft <span className="text-muted-foreground">· {r.by.split(" ")[0]}, {ago(r.updatedAt, now)}</span>
        </span>
      );
    case "team_review":
      return r?.recommendation ? <span>{RECOMMENDATION_LABELS[r.recommendation]}</span> : muted("No recommendation");
    case "approved":
      // Enterprise is a member at approval; Airtable's approved applicants were imported AS members.
      if (app.plan === "enterprise" || app.source === "airtable") return <span>Member</span>;
      if (app.paidAt) return <span>Paid</span>;
      return app.invitedAt ? muted("Payment link sent") : <span>Waiting on payment</span>;
    case "declined":
      return muted(app.decisions.some((d) => d.outcome === "declined at research") ? "At research" : "By the team");
    default:
      return muted("—");
  }
}

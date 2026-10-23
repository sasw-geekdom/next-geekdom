import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { listMembers } from "@/lib/admin/queries";
import { loginStates } from "@/lib/admin/member-logins";
import { listEvents } from "@/lib/content/events";
import { listPortfolio } from "@/lib/content/portfolio";
import { eventTimeLabel } from "@/lib/content/dates";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { Tile } from "@/components/portal/tile";
import { MemberBadge } from "@/components/ui/badge";
import { ARROW, FIGURE, LINK_ARROW, MONO } from "@/components/site/section";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Overview" };

/*
  THE ADMIN OVERVIEW — what Geekdom staff actually run.

  It used to lead with four application counts and an "applications, last
  14 days" chart, which stay at zero while applications live in Typeform →
  Airtable. Members now arrive through "Add a member" and the CSV import,
  and staff manage the site's events and portfolio here — so that's what
  the Overview shows, with one-click actions that open the right slide-out
  (?add=1).

    ┌ Current · Past due · Never signed in · Former ┐   counts, each a link
    ├───────────────────────────────┬────────────────┤
    │ Next on the homepage          │ Quick actions  │
    ├───────────────────────────────┼────────────────┤
    │ Recently joined               │ Applications   │
    └───────────────────────────────┴────────────────┘
*/
export default async function AdminOverview() {
  const [members, logins, events, companies] = await Promise.all([
    listMembers(),
    loginStates().catch(() => new Map()),
    listEvents().catch(() => []),
    listPortfolio().catch(() => []),
  ]);

  const CURRENT = ["active", "trialing", "past_due"];
  const current = members.filter((m) => CURRENT.includes(m.status));
  const former = members.length - current.length;
  const pastDue = current.filter((m) => m.status === "past_due").length;
  const neverSignedIn = current.filter((m) => {
    const l = logins.get(m.email);
    return !l || l.state !== "active";
  }).length;

  // Server time, once, for "upcoming".
  const now = new Date().getTime();
  const upcoming = events.filter((e) => Date.parse(e.endsAt) > now).slice(0, 4);
  const recent = current.slice(0, 5); // listMembers is newest-joined first

  return (
    <>
      <PageHeader eyebrow="Admin portal" title="Overview" description="Your members and the site, at a glance." />

      <AdminSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Current members" value={current.length} href="/portal/admin/members" />
          <Stat label="Past due" value={pastDue} href="/portal/admin/members" accent={pastDue > 0} note="Card declined — they keep access" />
          <Stat label="Never signed in" value={neverSignedIn} href="/portal/admin/members" note="Members who haven't used the portal" />
          <Stat label="Former members" value={former} href="/portal/admin/members" note="Paused or canceled" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Tile
            label="Next on the homepage"
            className="lg:col-span-2"
            action={
              <Link href="/portal/admin/events" className={cn("text-sm", LINK_ARROW)}>
                This month
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing upcoming — the homepage shows only the calendar link.{" "}
                <Link href="/portal/admin/events?add=1" className="text-graphite underline decoration-clay decoration-2 underline-offset-2">
                  Add an event
                </Link>
              </p>
            ) : (
              <ul className="border-b border-border">
                {upcoming.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-[9rem_1fr] gap-4 border-t border-border py-3 first:border-t-0">
                    <span className={cn(MONO.label, "pt-0.5 text-muted-foreground")}>
                      {ev.dateLabel} · {eventTimeLabel(ev.startsAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-graphite">{ev.title}</span>
                      {ev.host && <span className="block truncate text-sm text-muted-foreground">Hosted by {ev.host}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          <Tile label="Quick actions">
            <div className="flex flex-col gap-2">
              <Link href="/portal/admin/members?add=1" className={buttonClass("ink", "md", "justify-start")}>
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Add a member
              </Link>
              <Link href="/portal/admin/events?add=1" className={buttonClass("outline", "md", "justify-start")}>
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Add an event
              </Link>
              <Link href="/portal/admin/portfolio?add=1" className={buttonClass("outline", "md", "justify-start")}>
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                Add a company
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {companies.length} {companies.length === 1 ? "company" : "companies"} on the Built at Geekdom wall.
            </p>
          </Tile>

          <Tile
            label="Recently joined"
            className="lg:col-span-2"
            action={
              <Link href="/portal/admin/members" className={cn("text-sm", LINK_ARROW)}>
                All members
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No members yet. They arrive with Geekdom&rsquo;s member import, or{" "}
                <Link href="/portal/admin/members?add=1" className="text-graphite underline decoration-clay decoration-2 underline-offset-2">
                  add one
                </Link>
                .
              </p>
            ) : (
              <ul className="border-b border-border">
                {recent.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 border-t border-border py-3 first:border-t-0">
                    <span className="min-w-0">
                      <span className="block truncate text-graphite">{m.name}</span>
                      <span className="block truncate text-sm text-muted-foreground">{m.email}</span>
                    </span>
                    <MemberBadge status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          <Tile label="Applications">
            <p className="text-sm leading-relaxed text-graphite">
              Applications go from your Typeform to Airtable today. They can show up here too,
              next to your members.
            </p>
            <Link href="/portal/admin/applications" className={cn("mt-4 text-sm", LINK_ARROW)}>
              How to connect them
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
            <a href="/apply" target="_blank" rel="noreferrer noopener" className={cn("mt-2 text-sm", LINK_ARROW)}>
              The /apply page
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Tile>
        </div>
      </AdminSection>
    </>
  );
}

function Stat({
  label,
  value,
  href,
  note,
  accent = false,
}: {
  label: string;
  value: number;
  href: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block border border-border bg-bone-light p-5 transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
    >
      <p className={cn(MONO.label, "text-muted-foreground")}>{label}</p>
      {/* A Clay rule marks a number that needs attention; the figure stays
          Graphite (Clay can't carry the small text beside it). */}
      <p className={cn(FIGURE.md, "mt-2 border-l-2 pl-3 text-graphite", accent ? "border-clay" : "border-transparent")}>
        {value}
      </p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </Link>
  );
}

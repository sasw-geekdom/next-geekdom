import { exitReasonLabel } from "@/lib/membership-exit";
import { compRunning } from "@/lib/perks";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { dollars, getClubMoney } from "@/lib/stripe/money";
import { ArrowRight, Check, Plus } from "lucide-react";
import { listApplications, listMembers } from "@/lib/admin/queries";
import { loginStates } from "@/lib/admin/member-logins";
import { listEvents } from "@/lib/content/events";
import { listNotes } from "@/lib/field-notes/notes";
import { listActivity } from "@/lib/admin/activity";
import { listInquiries } from "@/lib/admin/inquiries";
import { ActivityList } from "@/components/admin/activity-list";
import { NewNoteButton } from "@/components/admin/field-notes/new-note-button";
import { eventTimeLabel } from "@/lib/content/dates";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { Tile } from "@/components/portal/tile";
import { ARROW, FIGURE, LINK_ARROW } from "@/components/site/section";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_LABEL, MemberStatusLabel, Status, tableDate, type StatusKind } from "@/components/admin/admin-ui";

export const metadata = { title: "Overview" };

/*
  THE ADMIN OVERVIEW — Linear's inbox and Vercel's project home, for
  Geekdom: what's waiting on staff first, then three numbers that move,
  then the site and the people.

    ┌ Overview                    [Add a member] [Add an event] [New Field Note] ┐
    ├─ Needs attention ─────────────────────────────────────────────────────────┤
    │ ■ 3 applicants waiting longer than two weeks              Review →         │
    │ ■ 13 in research · oldest 34 days                                          │
    │ ■ 2 approved, waiting on payment …   (only rows with something in them)    │
    ├──────────────┬──────────────────┬──────────────────────────────────────────┤
    │ Members      │ Applications 30d │ Signed in to the portal                  │
    ├──────────────┼──────────────────┼──────────────────────────────────────────┤
    │ Monthly rev. │ Collected 30d    │ Past due      (Management only, Stripe)  │
    ├──────────────┴─────────┬────────┴──────────────────────────────────────────┤
    │ Next on the homepage   │ Recent activity                                   │
    │ Recently joined        │ Field Notes                                       │
    └────────────────────────┴───────────────────────────────────────────────────┘

  NEEDS ATTENTION is the point of the page: every row is a count of work
  with a link to do it, and a row with nothing in it isn't shown. The
  two-week row holds Geekdom to /apply's own promise ("We respond within
  two weeks"). Red only for a real problem (that, and past due).

  THE NUMBERS are the ones that change week to week and say whether things
  are working — growth, demand, and whether members use the portal (the
  launch question). Former members and "never signed in" moved into those.

  THE MONEY ROW (MANAGEMENT ONLY — members.money; Jesse, November 2026) is
  Stripe's, not the members docs': Club revenue a month, what came in over
  30 days, and what's past due (lib/stripe/money.ts). It streams in under
  Suspense so a slow Stripe never holds the page, and says "sandbox" when
  the keys are test keys — staging and localhost are, until launch.
*/

const DAY = 86_400_000;
const PROMISE_DAYS = 14;

export default async function AdminOverview() {
  const user = await requireAdmin();
  const [members, logins, events, notes, activity, applications, inquiries] = await Promise.all([
    listMembers(),
    loginStates().catch(() => new Map()),
    listEvents().catch(() => []),
    listNotes().catch(() => []),
    listActivity(8).catch(() => []),
    listApplications({ limit: 2000 }).catch(() => []),
    listInquiries().catch(() => []),
  ]);

  // Server time, once.
  const now = new Date().getTime();
  const daysSince = (iso: string | null | undefined) => (iso ? Math.floor((now - Date.parse(iso)) / DAY) : 0);
  const within = (iso: string | null | undefined, from: number, to = 0) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return t > now - from * DAY && t <= now - to * DAY;
  };

  // ── Members ──
  const CURRENT = ["active", "trialing", "past_due"];
  const current = members.filter((m) => CURRENT.includes(m.status));
  const former = members.length - current.length;
  const pastDue = current.filter((m) => m.status === "past_due").length;
  // Complimentary periods (perk tags, lib/perks.ts) ending in the next 30 days — the member's been reminded; staff may want to follow up.
  const compEnding = current.filter((m) => m.comp?.until && compRunning(m.comp, now) && Date.parse(m.comp.until) - now < 30 * 86_400_000).length;
  const joined30 = current.filter((m) => within(m.joinedAt, 30)).length;
  const signedIn = current.filter((m) => logins.get(m.email.toLowerCase())?.state === "active").length;
  const invited = current.filter((m) => m.portalInvitedAt).length;
  const recent = current.slice(0, 5); // listMembers is newest-joined first

  // WHY MEMBERS LEAVE (lib/membership-exit.ts) — the exit survey and staff's
  // reasons, last 90 days: the answers were saved on each member, and
  // nowhere added them up (Jesse, November 2026).
  const since90 = new Date().getTime() - 90 * 86_400_000;
  const exits = members.filter((m) => m.cancellation && Date.parse(m.cancellation.at) >= since90);
  const leaving = exits.filter((m) => CURRENT.includes(m.status)).length;
  const left = exits.length - leaving;
  const reasonCounts = [...exits.reduce((acc, m) => {
    const k = exitReasonLabel(m.cancellation!.reason) ?? "No reason given";
    return acc.set(k, (acc.get(k) ?? 0) + 1);
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]);
  const exitNotes = exits
    .filter((m) => m.cancellation!.note)
    .sort((a, b) => b.cancellation!.at.localeCompare(a.cancellation!.at))
    .slice(0, 3);

  // ── Reviews ──
  const initial = applications.filter((a) => a.status === "initial_review");
  const team = applications.filter((a) => a.status === "team_review");
  const open = [...initial, ...team];
  // /apply's two-week promise — only to people who applied through /apply (Airtable imports never got it).
  const overdue = open.filter((a) => a.source === "apply" && daysSince(a.createdAt) > PROMISE_DAYS).length;
  const oldest = (list: typeof applications) => Math.max(0, ...list.map((a) => daysSince(a.createdAt)));
  const unpaid = applications.filter((a) => a.status === "approved" && a.plan !== "enterprise" && !a.paidAt && a.source === "apply").length;
  const apps30 = applications.filter((a) => a.source === "apply" && within(a.createdAt, 30)).length;
  const appsPrev30 = applications.filter((a) => a.source === "apply" && within(a.createdAt, 60, 30)).length;
  const newRequests = {
    event: inquiries.filter((i) => i.kind === "event" && i.status === "new").length,
    partner: inquiries.filter((i) => i.kind === "partner" && i.status === "new").length,
  };

  // ── Site ──
  const upcoming = events.filter((e) => Date.parse(e.endsAt) > now).slice(0, 5);
  const drafts = notes.filter((n) => n.status === "draft");
  const waitingNotes = notes.filter((n) => n.status === "published" && n.changed);
  const lastPublished = notes
    .filter((n) => n.status === "published" && n.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))[0];

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const attention: { kind: StatusKind; text: string; detail?: string; href: string; cta: string }[] = [
    overdue > 0 && {
      kind: "danger" as const,
      text: `${plural(overdue, "applicant")} waiting longer than two weeks`,
      detail: "/apply promises a reply within two weeks",
      href: "/portal/admin/applications?status=initial_review&sort=submitted&dir=asc",
      cta: "Oldest first",
    },
    initial.length > 0 && {
      kind: "todo" as const,
      text: `${initial.length} in research`,
      detail: `oldest ${plural(oldest(initial), "day")}`,
      href: "/portal/admin/applications?status=initial_review",
      cta: "Review",
    },
    team.length > 0 && {
      kind: "progress" as const,
      text: `${team.length} ready for the team`,
      detail: `oldest ${plural(oldest(team), "day")}`,
      href: "/portal/admin/applications?status=team_review",
      cta: "Review",
    },
    unpaid > 0 && {
      kind: "progress" as const,
      text: `${plural(unpaid, "approved applicant")} haven't paid yet`,
      detail: "they become members when they pay",
      href: "/portal/admin/applications?status=approved",
      cta: "See them",
    },
    newRequests.event > 0 && {
      kind: "todo" as const,
      text: plural(newRequests.event, "new event request"),
      href: "/portal/admin/requests?kind=event&status=new",
      cta: "Review",
    },
    newRequests.partner > 0 && {
      kind: "todo" as const,
      text: plural(newRequests.partner, "new Studio partner request"),
      href: "/portal/admin/requests?kind=partner&status=new",
      cta: "Review",
    },
    pastDue > 0 && {
      kind: "danger" as const,
      text: `${plural(pastDue, "member")} past due`,
      detail: "card declined — they keep access",
      href: "/portal/admin/members",
      cta: "Members",
    },
    compEnding > 0 && {
      kind: "todo" as const,
      text: `${plural(compEnding, "complimentary membership")} ${compEnding === 1 ? "ends" : "end"} in the next 30 days`,
      detail: "they've been emailed a reminder",
      href: "/portal/admin/members?view=comp",
      cta: "Members",
    },
    upcoming.length === 0 && {
      kind: "todo" as const,
      text: "Nothing upcoming on the homepage",
      detail: "“This month in the Club” shows only the calendar link",
      href: "/portal/admin/events?add=1",
      cta: "Add an event",
    },
    waitingNotes.length > 0 && {
      kind: "progress" as const,
      text: `${plural(waitingNotes.length, "Field Note")} with unpublished changes`,
      href: "/portal/admin/field-notes",
      cta: "Field Notes",
    },
  ].filter((r): r is Exclude<typeof r, false> => Boolean(r));

  const pct = current.length ? Math.round((signedIn / current.length) * 100) : 0;
  const trend = apps30 - appsPrev30;

  return (
    <>
      <PageHeader
        title="Overview"
        description="What's waiting on you, and how the Club is doing."
        actions={
          <>
            <Link href="/portal/admin/members?add=1" className={buttonClass("ink", "sm")}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
              Add a member
            </Link>
            <Link href="/portal/admin/events?add=1" className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
              Add an event
            </Link>
            <NewNoteButton variant="outline" size="sm" className="border-border bg-bone-light" />
          </>
        }
      />

      <AdminSection>
        {/* ── Needs attention ── */}
        <section aria-labelledby="attention" className="border border-border bg-bone-light">
          <h2 id="attention" className={cn(ADMIN_LABEL, "border-b border-border px-5 py-3 text-muted-foreground")}>
            Needs attention
          </h2>
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 px-5 py-4 text-sm text-graphite">
              <Check aria-hidden="true" className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
              Nothing waiting on you.
            </p>
          ) : (
            <ul>
              {attention.map((r) => (
                <li key={r.text} className="relative flex min-h-11 items-center gap-4 border-t border-border px-5 py-2 first:border-t-0 hover:bg-bone">
                  <span className="min-w-0 flex-1 sm:flex sm:items-baseline sm:gap-3">
                    <Link
                      href={r.href}
                      className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-clay"
                    >
                      <Status kind={r.kind} className="font-medium">
                        {r.text}
                      </Status>
                    </Link>
                    {r.detail && <span className="block truncate pl-4 text-[13px] text-muted-foreground sm:pl-0">{r.detail}</span>}
                  </span>
                  {/* LINK_ARROW FIRST: after it, its inline-flex beat "hidden" in cn() and the
                      link showed on phones, on top of the row's text. The whole row is the link there. */}
                  <span className={cn(LINK_ARROW, "hidden shrink-0 text-sm sm:inline-flex")}>
                    {r.cta}
                    <ArrowRight aria-hidden="true" className={ARROW.internal} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── The numbers ── */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Current members"
            value={current.length}
            href="/portal/admin/members"
            note={[joined30 > 0 ? `+${joined30} in the last 30 days` : "None joined in the last 30 days", former > 0 && `${former} former`].filter(Boolean).join(" · ")}
          />
          <Stat
            label="Applications, last 30 days"
            value={apps30}
            href="/portal/admin/applications?status=all"
            note={appsPrev30 || apps30 ? `${trend === 0 ? "Same as" : `${trend > 0 ? "+" : "−"}${Math.abs(trend)} on`} the 30 days before` : "Through /apply — imported ones aren't counted"}
          />
          <Stat
            label="Signed in to the portal"
            value={`${signedIn} of ${current.length}`}
            href="/portal/admin/members"
            note={`${pct}% of current members${invited ? ` · ${invited} invited` : " · invitations not sent yet"}`}
            meter={pct}
          />
        </div>

        {/* ── The money (Management only) ── */}
        {can(user.role, "members.money") && (
          <Suspense fallback={<MoneyNote text="Reading Stripe…" />}>
            <MoneyRow />
          </Suspense>
        )}

        {/* ── The site and the people ── */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Tile
            plainLabel
            label="Next on the homepage"
            action={
              <Link href="/portal/admin/events" className={cn("text-sm", LINK_ARROW)}>
                Events
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing upcoming — the homepage shows only the calendar link.</p>
            ) : (
              <ul>
                {upcoming.map((ev) => (
                  <li key={ev.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0">
                    <span className="pt-px text-[13px] tabular-nums text-muted-foreground">
                      {ev.dateLabel} · {eventTimeLabel(ev.startsAt)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-graphite">{ev.title}</span>
                      {ev.host && <span className="block truncate text-[13px] text-muted-foreground">Hosted by {ev.host}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          {/* Who changed what, most recent first — the full history is a click away. */}
          <Tile
            plainLabel
            label="Recent activity"
            action={
              <Link href="/portal/admin/activity" className={cn("text-sm", LINK_ARROW)}>
                All activity
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            <ActivityList entries={activity} compact />
          </Tile>

          <Tile
            plainLabel
            label="Recently joined"
            action={
              <Link href="/portal/admin/members" className={cn("text-sm", LINK_ARROW)}>
                All members
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul>
                {recent.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-4 border-t border-border py-2.5 first:border-t-0 first:pt-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-graphite">{m.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        Joined {tableDate(m.joinedAt)}
                        {logins.get(m.email.toLowerCase())?.state === "active" ? " · signed in" : ""}
                      </span>
                    </span>
                    <MemberStatusLabel status={m.status} />
                  </li>
                ))}
              </ul>
            )}
          </Tile>

          <Tile
            plainLabel
            label="Field Notes"
            action={
              <Link href="/portal/admin/field-notes" className={cn("text-sm", LINK_ARROW)}>
                All
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Field Notes yet.</p>
            ) : (
              <>
                <ul>
                  {[...waitingNotes, ...drafts].slice(0, 4).map((n) => (
                    <li key={n.id} className="border-t border-border first:border-t-0">
                      <Link href={`/portal/admin/field-notes/${n.id}`} className="group flex items-center justify-between gap-4 py-2.5">
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-graphite group-hover:underline">{n.title || "Untitled Field Note"}</span>
                          <span className="block text-[13px] text-muted-foreground">Edited {tableDate(n.updatedAt)}</span>
                        </span>
                        <Status kind={n.status === "draft" ? "closed" : "progress"}>{n.status === "draft" ? "Draft" : "Unpublished changes"}</Status>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13px] text-muted-foreground">
                  {lastPublished ? `Last published ${tableDate(lastPublished.publishedAt)}: ${lastPublished.title}` : "Nothing published yet."}
                </p>
              </>
            )}
          </Tile>

          {/* ── Why members leave — the exit survey, added up ── */}
          <Tile
            plainLabel
            label="Why members leave · last 90 days"
            className="lg:col-span-2"
            action={
              <Link href="/portal/admin/members" className={cn("text-sm", LINK_ARROW)}>
                Members
                <ArrowRight aria-hidden="true" className={ARROW.internal} />
              </Link>
            }
          >
            {exits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has left or cancelled. When they do, their reasons show here — from the exit survey, or from whoever ended it.</p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm text-graphite">
                    {left > 0 && `${left} left`}
                    {left > 0 && leaving > 0 && " · "}
                    {leaving > 0 && `${leaving} leaving at the end of their paid month`}
                  </p>
                  <ul className="mt-3">
                    {reasonCounts.map(([reason, n]) => (
                      <li key={reason} className="flex items-center gap-3 border-t border-border py-2 text-sm first:border-t-0">
                        <span className="min-w-0 flex-1 truncate text-graphite">{reason}</span>
                        {/* A plain bar in Graphite — the share, at a glance; the number says it exactly. */}
                        <span aria-hidden="true" className="h-1.5 w-24 shrink-0 bg-border">
                          <span className="block h-full bg-graphite" style={{ width: `${Math.round((n / exits.length) * 100)}%` }} />
                        </span>
                        <span className="w-6 shrink-0 text-right tabular-nums text-graphite">{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className={cn(ADMIN_LABEL, "text-muted-foreground")}>In their words</p>
                  {exitNotes.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No notes left yet.</p>
                  ) : (
                    <ul className="mt-2">
                      {exitNotes.map((m) => (
                        <li key={m.id} className="border-t border-border py-2.5 text-sm first:border-t-0">
                          <p className="line-clamp-3 text-graphite">&ldquo;{m.cancellation!.note}&rdquo;</p>
                          <p className="mt-1 text-[13px] text-muted-foreground">
                            {m.name} · {tableDate(m.cancellation!.at)}
                            {m.cancellation!.by !== "member" ? ` · noted by ${m.cancellation!.by}` : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Tile>
        </div>
      </AdminSection>
    </>
  );
}

async function MoneyRow() {
  const money = await getClubMoney().catch(() => undefined);
  if (money === undefined) return <MoneyNote text="Couldn't reach Stripe for the money figures just now." />;
  if (money === null) return <MoneyNote text="Stripe isn't connected on this copy of the site." />;
  const m = money;
  const recurringNote = [
    `${m.paying} paying`,
    m.canceling > 0 && `${m.canceling} set to cancel`,
    m.paused > 0 && `${m.paused} complimentary`,
    m.startingLater > 0 && `${m.startingLater} starting later`,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Monthly recurring revenue" value={dollars(m.recurringCents)} href="/portal/admin/members" note={recurringNote} />
        <Stat
          label="Collected, last 30 days"
          value={dollars(m.collectedCents)}
          href="/portal/admin/members"
          note={m.payments === 0 ? "No Club payments" : `${m.payments} ${m.payments === 1 ? "payment" : "payments"}`}
        />
        <Stat
          label="Past due"
          value={m.pastDue}
          href="/portal/admin/members?view=past_due"
          alert={m.pastDue > 0}
          note={[m.owedCents > 0 ? `${dollars(m.owedCents)} owed` : "Nothing owed", `${m.failed30} failed ${m.failed30 === 1 ? "charge" : "charges"} in 30 days`].join(" · ")}
        />
      </div>
      <p className="mt-2 text-[13px] text-muted-foreground">
        Club billing only, from Stripe{m.sandbox ? " — the SANDBOX: test payments, not Geekdom's revenue" : ""}. Updated every 5 minutes.
      </p>
    </>
  );
}

function MoneyNote({ text }: { text: string }) {
  return <p className="mt-4 border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{text}</p>;
}

function Stat({
  label,
  value,
  href,
  note,
  meter,
  alert,
}: {
  label: string;
  value: number | string;
  href: string;
  note?: string;
  /** 0–100: a thin bar under the figure (portal sign-ins). */
  meter?: number;
  /** A real problem (past due): a red square by the label — the admin's Status marker. */
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block border border-border bg-bone-light p-5 transition-colors hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
    >
      <p className={cn(ADMIN_LABEL, "flex items-center gap-2 text-muted-foreground")}>
        {alert && <span aria-hidden="true" className="h-2 w-2 shrink-0 bg-geekdom-red" />}
        {label}
      </p>
      <p className={cn(FIGURE.md, "mt-2 text-graphite")}>{value}</p>
      {meter !== undefined && (
        <div aria-hidden="true" className="mt-3 h-1 bg-border">
          <div className="h-full bg-graphite" style={{ width: `${Math.min(100, Math.max(0, meter))}%` }} />
        </div>
      )}
      {note && <p className="mt-2 text-[13px] text-muted-foreground">{note}</p>}
    </Link>
  );
}

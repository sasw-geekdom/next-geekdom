"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ChevronDown, ExternalLink, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { ADMIN_CHIP, ADMIN_LABEL, MemberStatusLabel, RowButton, Table, Td, Th, Tr, tableDate, type SortDir } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { centralParts } from "@/lib/content/dates";
import { addTeammateForOwner, createMemberLogin, removeTeammateForOwner, saveMember } from "@/lib/admin/member-actions";
import { hasTeam, PLANS, planOf, type PlanId } from "@/lib/membership";
import { TeamCard } from "@/components/portal/team-card";
import type { Member } from "@/lib/admin/types";
import { compActive, compDate, compLine, compRunning, compUntil, isPerk, perkSummary, type PerkTag } from "@/lib/perks";
import { cancelClubBilling, keepClubBilling, linkStripe, memberBilling, startClubBilling, stripeSnapshot, type StripeSnapshot } from "@/lib/admin/stripe-actions";
import type { BillingView } from "@/lib/stripe/billing";
import { InvoiceRow, dayOf, invoiceMark, invoiceWhen, monthOf, shortDate } from "@/components/portal/invoice-row";
import { ExitSurvey, type ExitAnswer } from "@/components/portal/exit-survey";
import { exitReasonLabel } from "@/lib/membership-exit";
import type { MemberStatus } from "@/lib/firebase/collections";

/*
  THE MEMBER ROSTER, and the drawer that adds and edits a member.

  Borrowed from next-angels' membership CRM, adapted to one person per
  membership:
    · a toolbar — search by name or email, filters for status, sign-in and
      tag (the tag filter appears only once a tag is in use);
    · a slide-out per member whose sections fold with a one-line summary;
    · staff-only tags and notes beside the membership;
    · the portal login's state per person — no login, never signed in, or
      last signed in — so "has this person got in?" needs no trip to Firebase.

  The list is searched in the browser: ~400 rows is one Firestore read and
  instant filtering, not a server round trip per keystroke.
*/

export type LoginState =
  | { state: "none" }
  | { state: "invited" }
  | { state: "active"; lastSignIn: string };

export type MemberRow = Member & { login: LoginState };

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  inactive: "Paused",
};

/** What staff can set by hand. Past due and trialing come only from Stripe. */
const EDITABLE_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Paused — stepping away, expected back" },
  { value: "canceled", label: "Canceled — left the Club" },
];

/**
 * CURRENT vs FORMER. A current member can sign in; a former one (paused or
 * canceled) can't, and lives in the folded "Former members" list below —
 * the same shape as past events on the This month page. Past due stays
 * current on purpose: their card failed, they haven't left.
 */
const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];
const isCurrent = (m: Member) => CURRENT.includes(m.status);

/*
  ONE "VIEW" FILTER, replacing separate Status and Sign-in dropdowns. Both
  were about getting in — membership vs. whether the login had ever been
  used — and read as contradicting each other ("Canceled" + "Has signed
  in"). Each view is a question staff ask about CURRENT members.
*/
const VIEWS = [
  { value: "all", label: "All current members" },
  { value: "past_due", label: "Past due" },
  { value: "never", label: "Never signed in" },
  { value: "nologin", label: "No login yet" },
  { value: "comp", label: "Complimentary" },
] as const;
type View = (typeof VIEWS)[number]["value"];

function inView(m: MemberRow, view: View): boolean {
  if (view === "past_due") return m.status === "past_due";
  if (view === "never") return m.login.state === "invited";
  if (view === "nologin") return m.login.state === "none";
  if (view === "comp") return compRunning(m.comp);
  return true;
}

/*
  SORTING — in the browser, like the search. Newest first by default; a
  header click flips its column. "Portal" sorts by last sign-in, with
  never-signed-in and no-login after everyone who has.
*/
type Sort = "name" | "plan" | "joined" | "portal";
const NATURAL: Record<Sort, SortDir> = { name: "asc", plan: "asc", joined: "desc", portal: "desc" };

function sortKey(m: MemberRow, by: Sort): string {
  if (by === "name") return m.name.toLowerCase();
  if (by === "plan") return planOf(m.plan).name;
  if (by === "joined") return m.joinedAt ?? "";
  return m.login.state === "active" ? `2${m.login.lastSignIn}` : m.login.state === "invited" ? "1" : "0";
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((label, i) => ({ value: String(i + 1).padStart(2, "0"), label }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: String(i + 1),
}));

function longDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function loginLabel(l: LoginState): string {
  if (l.state === "none") return "No login";
  if (l.state === "invited") return "Never signed in";
  return `Signed in ${tableDate(l.lastSignIn)}`;
}

interface Draft {
  id?: string;
  name: string;
  email: string;
  status: string;
  year: string;
  month: string;
  day: string;
  tags: string[];
  notes: string;
  plan: PlanId;
  company: string;
  /** Asked only when staff change the status: why, and whether to email them. */
  exit: ExitAnswer;
  notify: boolean;
}

const NO_EXIT: ExitAnswer = { reason: null, note: "" };

const PLAN_OPTIONS = PLANS.map((p) => ({ value: p.id, label: p.name }));

function blank(): Draft {
  const t = centralParts(new Date().toISOString());
  return { name: "", email: "", status: "active", year: t.year, month: t.month, day: t.day, tags: [], notes: "", plan: "solo", company: "", exit: NO_EXIT, notify: true };
}

function fromRow(m: MemberRow): Draft {
  const j = centralParts(m.joinedAt);
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    // A Stripe-only status shows as itself; staff can't pick it.
    status: m.status,
    year: j.year,
    month: j.month,
    day: j.day,
    tags: m.tags,
    notes: m.notes,
    plan: m.plan,
    company: m.company,
    exit: NO_EXIT,
    notify: true,
  };
}

export function MembersManager({
  members,
  perks = [],
  startAdding = false,
  startView,
  startMemberId,
  canManageMoney = false,
}: {
  members: MemberRow[];
  /**
   * Management (lib/auth/roles.ts `members.money`): status, plan,
   * complimentary tags and the Stripe panel's actions. Staff edit the
   * record and see those read-only; the server refuses them regardless.
   */
  canManageMoney?: boolean;
  /** Tag definitions (Settings → Tags & perks) — for the slide-out's "what saving will do". */
  perks?: PerkTag[];
  /** Open "Add a member" straight away — the Overview's quick action (?add=1). */
  startAdding?: boolean;
  /** Open on a view — the Overview's links (?view=comp). */
  startView?: string;
  /** `?m=<id>` — open that member's slide-out (admin search results land here). */
  startMemberId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>(() => (VIEWS.some((v) => v.value === startView) ? (startView as View) : "all"));
  const [tag, setTag] = React.useState("all");
  const [formerOpen, setFormerOpen] = React.useState(false);
  const [sort, setSort] = React.useState<{ by: Sort; dir: SortDir }>({ by: "joined", dir: "desc" });
  const sortBy = (by: Sort) => ({
    dir: sort.by === by ? sort.dir : null,
    onClick: () => setSort((s) => (s.by === by ? { by, dir: s.dir === "asc" ? "desc" : "asc" } : { by, dir: NATURAL[by] })),
  });
  const ordered = (list: MemberRow[]) =>
    [...list].sort((a, b) => {
      const c = sortKey(a, sort.by).localeCompare(sortKey(b, sort.by));
      return sort.dir === "asc" ? c : -c;
    });

  const startMember = startMemberId ? members.find((m) => m.id === startMemberId) : undefined;
  const [draft, setDraft] = React.useState<Draft | null>(() => (startAdding ? blank() : startMember ? fromRow(startMember) : null));
  const [drawerOpen, setDrawerOpen] = React.useState(startAdding || Boolean(startMember));
  const close = React.useCallback(() => setDrawerOpen(false), []);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [drawerError, setDrawerError] = React.useState<string | null>(null);

  const editing = draft?.id ? members.find((m) => m.id === draft.id) ?? null : null;

  // Only tags actually in use — an empty list hides the filter entirely.
  const tags = React.useMemo(
    () => [...new Set(members.flatMap((m) => m.tags))].sort(),
    [members],
  );

  const current = React.useMemo(() => members.filter(isCurrent), [members]);
  const former = React.useMemo(() => members.filter((m) => !isCurrent(m)), [members]);

  // Search and tag apply to both lists; the view applies to current members.
  const matches = React.useCallback(
    (m: MemberRow) => {
      const q = query.trim().toLowerCase();
      return (
        (!q || m.name.toLowerCase().includes(q) || m.email.includes(q)) &&
        (tag === "all" || m.tags.includes(tag))
      );
    },
    [query, tag],
  );
  const shownCurrent = current.filter((m) => matches(m) && inView(m, view));
  const shownFormer = former.filter(matches);

  const filtering = Boolean(query) || view !== "all" || tag !== "all";
  // A search that finds a former member opens their list — otherwise the
  // only match would be hidden behind a closed fold.
  const formerShown = formerOpen || (Boolean(query.trim()) && shownFormer.length > 0);

  function open(d: Draft) {
    setDraft(d);
    setErrors({});
    setDrawerError(null);
    setNotice(null);
    setDrawerOpen(true);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setDrawerError(null);
    startTransition(async () => {
      const res = await saveMember({
        id: draft.id,
        name: draft.name,
        email: draft.email,
        status: draft.status as "active" | "inactive" | "canceled",
        year: draft.year,
        month: draft.month,
        day: draft.day,
        tags: draft.tags,
        notes: draft.notes,
        plan: draft.plan,
        company: draft.company,
        exitReason: draft.exit.reason,
        exitNote: draft.exit.note,
        notify: draft.notify,
      });
      if (res.ok) {
        setNotice({
          tone: "ok",
          text: draft.id
            ? `Saved.${res.note ? ` ${res.note}` : ""}`
            : `${draft.name} is a member. They can sign in at /sign-in with ${draft.email}.${res.note ? ` ${res.note}` : ""}`,
        });
        setDrawerOpen(false);
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        if (res.error) setDrawerError(res.error);
        router.refresh();
      }
    });
  }

  function onCreateLogin() {
    if (!editing) return;
    setDrawerError(null);
    startTransition(async () => {
      const res = await createMemberLogin(editing.id);
      if (res.ok) router.refresh();
      else setDrawerError(res.error ?? "Couldn't create the login.");
    });
  }

  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const thisYear = new Date().getFullYear();
  const YEARS = Array.from({ length: thisYear - 2011 + 1 }, (_, i) => {
    const y = String(thisYear - i);
    return { value: y, label: y };
  });

  const stripeManaged = Boolean(editing?.stripeSubscriptionId);
  // Save is for a change: an untouched record shows Close, not Save.
  const dirty = Boolean(draft && editing && JSON.stringify(draft) !== JSON.stringify(fromRow(editing)));
  const statusOptions =
    editing && !EDITABLE_STATUSES.some((s) => s.value === editing.status)
      ? [{ value: editing.status, label: STATUS_LABEL[editing.status] }, ...EDITABLE_STATUSES]
      : EDITABLE_STATUSES;

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ink" onClick={() => open(blank())} disabled={pending}>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          Add a member
        </Button>
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn("text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}
          >
            {notice.text}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.7}
          />
          <label htmlFor="member-search" className="sr-only">
            Search members
          </label>
          <Input
            id="member-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-graphite"
            >
              <X className="h-4 w-4" strokeWidth={1.7} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Combobox
            name="view"
            label="Which members to show"
            className="sm:w-56"
            options={VIEWS}
            value={view}
            onChange={(v) => setView(v as View)}
          />
          {tags.length > 0 && (
            <Combobox
              name="tag-filter"
              label="Filter by tag"
              className="sm:w-44"
              options={[{ value: "all", label: "All tags" }, ...tags.map((t) => ({ value: t, label: t }))]}
              value={tag}
              onChange={setTag}
            />
          )}
        </div>
      </div>

      <p className={cn(ADMIN_LABEL, "-mb-3 text-muted-foreground")}>
        {filtering
          ? `${shownCurrent.length} of ${current.length} current members`
          : `${current.length} current members`}
      </p>

      {members.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-12 text-sm text-muted-foreground">
          No members yet. Add one here, or they arrive with Geekdom&rsquo;s member
          import and from Stripe checkout.
        </p>
      ) : shownCurrent.length === 0 && shownFormer.length > 0 && filtering ? (
        <p className="text-sm text-muted-foreground">
          No current members match — {shownFormer.length === 1 ? "1 former member" : `${shownFormer.length} former members`} below.
        </p>
      ) : shownCurrent.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-12 text-sm text-muted-foreground">
          {current.length === 0
            ? "No current members."
            : "No current members match. Clear the search or change the view."}
        </p>
      ) : (
        <MemberList members={ordered(shownCurrent)} sortBy={sortBy} onOpen={(m) => open(fromRow(m))} perks={perks} />
      )}

      {/*
        FORMER MEMBERS — paused and canceled — folded, like past events. Kept
        rather than deleted: their history, notes and tags stay, and setting
        one back to Active restores their access.
      */}
      {former.length > 0 && (
        <details
          open={formerShown}
          onToggle={(e) => setFormerOpen(e.currentTarget.open)}
          className="group/former border-t border-border"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone [&::-webkit-details-marker]:hidden">
            <span className={cn(ADMIN_LABEL, "text-muted-foreground")}>
              Former members · {filtering && (query || tag !== "all") ? `${shownFormer.length} of ${former.length}` : former.length}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open/former:rotate-180"
              strokeWidth={1.7}
            />
          </summary>
          <p className="pb-3 text-sm text-muted-foreground">
            Paused and canceled members. They can&rsquo;t sign in; set one back to
            Active to restore their access.
          </p>
          {shownFormer.length === 0 ? (
            <p className="pb-6 text-sm text-muted-foreground">No former members match.</p>
          ) : (
            <MemberList members={ordered(shownFormer)} sortBy={sortBy} onOpen={(m) => open(fromRow(m))} perks={perks} muted />
          )}
        </details>
      )}

      <Drawer
        open={drawerOpen}
        onClose={close}
        title={draft?.id ? editing?.name ?? "Member" : "Add a member"}
        description={
          editing ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>{editing.email}</span>
              <MemberStatusLabel status={editing.status} />
            </span>
          ) : (
            "They can sign in as soon as you add them. No email is sent."
          )
        }
        footer={
          <>
            <Button type="submit" form="member-form" variant="ink" disabled={pending || (Boolean(draft?.id) && !dirty)}>
              {pending ? "Saving…" : draft?.id ? "Save changes" : "Add member"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              {draft?.id && !dirty ? "Close" : "Cancel"}
            </Button>
            {draft?.id && dirty && <span className="text-[13px] text-muted-foreground">Unsaved changes</span>}
          </>
        }
      >
        {draft && (
          <form id="member-form" onSubmit={onSave} noValidate className="flex flex-col gap-8">
            {/*
              AT A GLANCE — the facts staff open a member to check, before any
              control. A record first, a form second (Linear's side panel).
            */}
            {editing && (
              <dl className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
                {(
                  [
                    ["Plan", `${planOf(editing.plan).name}${editing.teamOwnerId ? " · teammate" : ""}`],
                    ["Joined", tableDate(editing.joinedAt)],
                    ["Portal", editing.login.state === "active" ? `Signed in ${tableDate(editing.login.lastSignIn)}` : editing.login.state === "invited" ? "Never signed in" : "No login"],
                    [
                      "Getting started",
                      !editing.onboarding.firstSeenAt ? "Not opened" : editing.onboarding.done.length >= 4 ? "Done" : `${editing.onboarding.done.length} of 4 steps`,
                    ],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="bg-bone-light px-3 py-2.5">
                    <dt className="text-[13px] text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 truncate text-sm text-graphite">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            <RecordSection title="Member">
              <Row label="Name" htmlFor="m-name" error={errors.name} required>
                <Input
                  id="m-name"
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  {...(draft.id ? {} : { "data-autofocus": true })}
                />
              </Row>
              <Row label="Email" htmlFor="m-email" error={errors.email} required hint="They sign in with it. One membership per email.">
                <Input
                  id="m-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={draft.email}
                  onChange={(e) => set("email")(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </Row>
            </RecordSection>

            <RecordSection title="Membership">
              {editing?.teamOwnerId ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  On{" "}
                  <span className="text-graphite">{members.find((m) => m.id === editing.teamOwnerId)?.name ?? "another member"}</span>
                  &rsquo;s {planOf(editing.plan).name} membership. Their plan and access follow the team&rsquo;s.
                </p>
              ) : (
                <>
                  <Row label="Plan" htmlFor="m-plan" error={errors.plan}>
                    <Combobox id="m-plan" name="plan" options={PLAN_OPTIONS} value={draft.plan} onChange={(v) => set("plan")(v as PlanId)} searchable={false} disabled={Boolean(editing) && !canManageMoney} />
                  </Row>
                  {(draft.plan !== "solo" || draft.company) && (
                    <Row label="Company" htmlFor="m-company" error={errors.company}>
                      <Input id="m-company" value={draft.company} onChange={(e) => set("company")(e.target.value)} autoComplete="off" />
                    </Row>
                  )}
                </>
              )}
              <Row
                label="Status"
                htmlFor="m-status"
                error={errors.status}
                hint={
                  stripeManaged
                    ? "Billed through Stripe — follows their subscription."
                    : editing && !canManageMoney
                      ? "Management pauses, cancels and reactivates memberships."
                      : "Paused or canceled members can't sign in; Active restores access."
                }
              >
                <Combobox id="m-status" name="status" options={statusOptions} value={draft.status} onChange={set("status")} disabled={stripeManaged || (Boolean(editing) && !canManageMoney)} />
              </Row>
              {/*
                A STATUS CHANGE says what it will do: ending asks why (the
                exit survey's reasons) and both directions offer the email —
                on by default, so nobody is locked out without a word.
              */}
              {editing && !stripeManaged && draft.status !== editing.status && (
                <div className="flex flex-col gap-4 border-l-2 border-clay bg-bone-light px-4 py-3 sm:ml-[calc(8.5rem+1rem)]">
                  {(draft.status === "inactive" || draft.status === "canceled") && (
                    <ExitSurvey value={draft.exit} onChange={set("exit")} audience="staff" />
                  )}
                  <Switch
                    checked={draft.notify}
                    onChange={set("notify")}
                    label={`Email ${draft.name.split(" ")[0] || "them"}${!editing.teamOwnerId && hasTeam(draft.plan) && members.some((x) => x.teamOwnerId === editing.id) ? " and their team" : ""} ${
                      draft.status === "canceled" ? "that the membership has ended" : draft.status === "inactive" ? "that the membership is paused" : "that it's active again"
                    }`}
                  />
                </div>
              )}
              <Row label="Member since" htmlFor="m-month" error={errors.day ?? errors.month ?? errors.year} required>
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                  <Combobox id="m-month" name="month" label="Member since — month" options={MONTHS} value={draft.month} onChange={set("month")} searchable={false} />
                  <Combobox name="day" label="Member since — day" options={DAYS} value={draft.day} onChange={set("day")} searchable={false} invalid={Boolean(errors.day)} />
                  <Combobox name="year" label="Member since — year" options={YEARS} value={draft.year} onChange={set("year")} />
                </div>
              </Row>
            </RecordSection>

            {editing && (
              <RecordSection title="Portal and billing">
                <dl className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-muted-foreground">Sign-in</dt>
                  <dd className="text-graphite">
                    {editing.login.state === "none"
                      ? "No sign-in account yet"
                      : editing.login.state === "invited"
                        ? "Account ready — they haven't signed in"
                        : `Last signed in ${longDate(editing.login.lastSignIn)}`}
                    {editing.login.state === "none" && (
                      <Button type="button" variant="outline" size="sm" className="mt-2 flex" onClick={onCreateLogin} disabled={pending}>
                        Create login
                      </Button>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Invitation</dt>
                  <dd className="text-graphite">
                    {editing.portalInvitedAt ? `Sent ${longDate(editing.portalInvitedAt)}` : "Not sent"}
                    {/* What the invitation is, for someone seeing this row for the first time. */}
                    <span className="block text-[13px] text-muted-foreground">
                      {editing.portalInvitedAt ? "The email inviting them to the member portal." : "The member portal invitation goes out in waves at launch."}
                    </span>
                  </dd>
                  {editing.currentPeriodEnd && (
                    <>
                      <dt className="text-muted-foreground">{editing.cancelAtPeriodEnd ? "Ends" : "Renews"}</dt>
                      <dd className="text-graphite">{longDate(editing.currentPeriodEnd)}</dd>
                    </>
                  )}
                  {editing.comp && (
                    <>
                      <dt className="text-muted-foreground">Complimentary</dt>
                      <dd className="text-graphite">
                        {compRunning(editing.comp) ? compLine(editing.comp).replace(/^Complimentary /, "") : `Ended ${compDate(editing.comp.until ?? editing.comp.since)} · ${editing.comp.label}`}
                        {compRunning(editing.comp) && editing.comp.paused && <span className="block text-muted-foreground">Stripe billing paused until then</span>}
                      </dd>
                    </>
                  )}
                  {editing.cancellation && (
                    <>
                      {/* Why they left (or are leaving) — the exit survey, or staff's reason. */}
                      <dt className="text-muted-foreground">{isCurrent(editing) ? "Leaving" : "Left"}</dt>
                      <dd className="text-graphite">
                        {exitReasonLabel(editing.cancellation.reason) ?? "No reason given"}
                        <span className="block text-muted-foreground">
                          {editing.cancellation.by === "member" ? "Cancelled it themselves" : `By ${editing.cancellation.by}`}
                          {" · "}
                          {compDate(editing.cancellation.at)}
                          {editing.cancellation.how === "end_of_period" ? " · at the end of the paid period" : editing.cancellation.how === "now" ? " · effective that day" : ""}
                        </span>
                        {editing.cancellation.note && <span className="mt-1 block whitespace-pre-line">&ldquo;{editing.cancellation.note}&rdquo;</span>}
                      </dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Billing</dt>
                  <dd className="text-graphite">
                    <StripePanel key={editing.id} memberId={editing.id} canAct={canManageMoney} onChanged={() => router.refresh()} />
                  </dd>
                  <dt className="text-muted-foreground">Added by</dt>
                  <dd className="text-graphite">
                    {{ admin: "Staff", import: "Member import", application: "Approved application", team: "Their team", stripe: "Stripe checkout" }[editing.source]}
                  </dd>
                </dl>
              </RecordSection>
            )}

            {/* Billing history: what the member sees in Manage billing, read only. Only once there's a Stripe customer. */}
            {editing?.stripeCustomerId && <BillingHistory key={`bh-${editing.id}`} memberId={editing.id} />}

            <RecordSection title="Staff only" note="Never shown to the member.">
              {/* Label left, control right — the same Row as every other section. */}
              <Row
                label="Tags"
                htmlFor="m-tags"
                error={errors.tags}
                hint={
                  canManageMoney
                    ? "Tags are created in Tags & perks, where each one's discount or complimentary time is set."
                    : "Tags are created in Tags & perks. Complimentary tags are applied by Geekdom management."
                }
              >
                <TagPicker
                  value={draft.tags}
                  onChange={set("tags")}
                  defs={perks}
                  canCreate={canManageMoney}
                  locked={canManageMoney ? [] : perks.filter(isPerk).map((p) => p.name)}
                />
                <PerkPreview tags={draft.tags} before={editing?.tags ?? []} comp={editing?.comp ?? null} perks={perks} paying={Boolean(editing?.stripeSubscriptionId)} />
              </Row>
              <Row label="Notes" htmlFor="m-notes" error={errors.notes}>
                <Textarea id="m-notes" value={draft.notes} onChange={(e) => set("notes")(e.target.value)} className="min-h-24" />
              </Row>
            </RecordSection>

            {drawerError && (
              <p role="alert" className="text-sm text-geekdom-red">
                {drawerError}
              </p>
            )}
          </form>
        )}
        {/*
          THE TEAM, for an owner — outside the form above, because it carries
          its own add form (forms can't nest). Built from the list already on
          the page: teammates are the members pointing at this one.
        */}
        {draft && editing && !editing.teamOwnerId && hasTeam(editing.plan) && (
          <div className="mt-8">
            <RecordSection title="Team">
              <TeamCard
                tone="plain"
                team={{
                  ownerName: editing.name,
                  company: editing.company,
                  seats: planOf(editing.plan).seats,
                  teammates: members
                    .filter((m) => m.teamOwnerId === editing.id)
                    .map((m) => ({ id: m.id, name: m.name, email: m.email, status: m.status })),
                }}
                add={(input) => addTeammateForOwner(editing.id, input)}
                remove={(id) => removeTeammateForOwner(editing.id, id)}
              />
            </RecordSection>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function MemberList({
  members,
  onOpen,
  sortBy,
  muted = false,
  perks = [],
}: {
  members: MemberRow[];
  perks?: PerkTag[];
  onOpen: (m: MemberRow) => void;
  sortBy: (by: Sort) => { dir: SortDir | null; onClick: () => void };
  muted?: boolean;
}) {
  return (
    <Table className={cn(muted && "opacity-75")}>
      <thead>
        <tr>
          <Th sort={sortBy("name")}>Name</Th>
          <Th className="hidden w-[24%] md:table-cell">Email</Th>
          <Th className="hidden w-28 lg:table-cell" sort={sortBy("plan")}>Plan</Th>
          <Th className="hidden w-32 md:table-cell" sort={sortBy("joined")}>Joined</Th>
          <Th className="hidden w-40 lg:table-cell" sort={sortBy("portal")}>Portal</Th>
          <Th className="w-28">Status</Th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <Tr key={m.id}>
            <Td>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">
                  <RowButton onClick={() => onOpen(m)}>{m.name}</RowButton>
                </span>
                {/* Tags inline, so a tagged row is no taller than any other. */}
                {m.tags.map((t) => (
                  <span key={t} className={cn(ADMIN_CHIP, "hidden sm:inline-flex")}>
                    {perks.find((p) => p.name === t)?.label ?? t}
                  </span>
                ))}
              </span>
            </Td>
            <Td className="hidden text-muted-foreground md:table-cell">{m.email}</Td>
            <Td className="hidden lg:table-cell">
              {planOf(m.plan).name}
              {m.teamOwnerId && <span className="text-muted-foreground"> · teammate</span>}
              {compRunning(m.comp) && <span className="text-muted-foreground"> · complimentary</span>}
            </Td>
            <Td className="hidden tabular-nums text-muted-foreground md:table-cell">{tableDate(m.joinedAt)}</Td>
            <Td className="hidden text-muted-foreground lg:table-cell">{loginLabel(m.login)}</Td>
            <Td>
              <MemberStatusLabel status={m.status} />
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  );
}

/*
  THE MEMBER RECORD'S PARTS. A section is a sentence-case heading over a
  hairline (the admin's labels, not the shared FieldGroup's mono legend);
  a row puts its label on the left and its control on the right, so the
  record reads like Linear's properties panel rather than a stacked form.
  Below sm the label sits above.
*/
function RecordSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h3 className={cn(ADMIN_LABEL, "shrink-0 whitespace-nowrap text-graphite")}>{title}</h3>
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Row({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = `${htmlFor}-msg`;
  return (
    <div className="grid gap-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground sm:pt-3">
        {label}
        {required && <span className="text-geekdom-red"> *</span>}
      </label>
      <div className="min-w-0">
        {children}
        {(error || hint) && (
          <p id={id} className={cn("mt-1.5 text-[13px]", error ? "text-geekdom-red" : "text-muted-foreground")}>
            {error ?? hint}
          </p>
        )}
      </div>
    </div>
  );
}

/*
  TAGS ARE PICKED, NEVER TYPED (Jesse, November 2026). A tag exists to turn
  on a discount or a complimentary membership, so every tag is created in
  Settings → Tags & perks, and here staff choose from that list. A tag the
  member already carries that isn't defined there (from before this rule)
  stays as a chip until someone removes it. Picking from a Combobox — the
  custom dropdown, never a native <select>.
*/
function TagPicker({
  value,
  onChange,
  defs,
  locked = [],
  canCreate = false,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  /** The tags defined in Tags & perks — the only ones that can be added. */
  defs: PerkTag[];
  /** Tags this person can't add or remove — complimentary tags, for Staff. */
  locked?: string[];
  /** Management: a link to create one. Staff can't, so they don't see it. */
  canCreate?: boolean;
}) {
  const router = useRouter();
  // Back from the Tags & perks tab: re-read, so the new tag is in the list.
  // router.refresh() keeps this half-filled form as it is.
  const [away, setAway] = React.useState(false);
  React.useEffect(() => {
    if (!away) return;
    const back = () => {
      setAway(false);
      router.refresh();
    };
    window.addEventListener("focus", back, { once: true });
    return () => window.removeEventListener("focus", back);
  }, [away, router]);
  const labelOf = (t: string) => defs.find((d) => d.name === t)?.label ?? t;
  const options = defs
    .filter((d) => !value.includes(d.name) && !locked.includes(d.name))
    .map((d) => ({ value: d.name, label: d.effect !== "none" ? `${d.label} — ${perkSummary(d).toLowerCase()}` : d.label }));

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {value.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 border border-border bg-bone px-2 py-0.5 text-sm text-graphite">
              {labelOf(t)}
              {!locked.includes(t) && (
                <button
                  type="button"
                  onClick={() => onChange(value.filter((x) => x !== t))}
                  aria-label={`Remove tag ${labelOf(t)}`}
                  className="text-muted-foreground hover:text-graphite"
                >
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {defs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tags yet. They&rsquo;re created in{" "}
          <Link href="/portal/admin/tags" className="text-graphite underline decoration-clay decoration-1 underline-offset-2">
            Tags &amp; perks
          </Link>
          .
        </p>
      ) : options.length > 0 ? (
        <Combobox
          id="m-tags"
          name="tag-picker"
          options={options}
          value=""
          onChange={(t) => t && onChange([...value, t])}
          placeholder="Add a tag…"
          searchable={options.length > 7}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Every tag you can add is on this member.</p>
      )}
      {canCreate && defs.length > 0 && (
        <a
          href="/portal/admin/tags?new=1"
          target="_blank"
          rel="noopener"
          onClick={() => setAway(true)}
          className="inline-flex items-center gap-1 self-start text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
        >
          New tag in Tags &amp; perks
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
        </a>
      )}
    </div>
  );
}

/*
  WHAT SAVING WILL DO, for perk tags (lib/perks.ts) — said before the save,
  in plain words, so a tag that gives a year away is never a surprise.
*/
function PerkPreview({
  tags,
  before,
  comp,
  perks,
  paying,
}: {
  tags: string[];
  before: string[];
  comp: Member["comp"];
  perks: PerkTag[];
  paying: boolean;
}) {
  const running = compActive(comp);
  if (running && comp && !tags.includes(comp.tag)) {
    return (
      <p className="mt-2 border-l-2 border-clay bg-bone-light px-3 py-2 text-[13px] text-graphite">
        Saving ends their complimentary membership today{comp.paused ? " and resumes their Stripe billing" : ""}.
      </p>
    );
  }
  if (running) return null;
  const added = tags.filter((t) => !before.includes(t)).map((t) => perks.find((p) => p.name === t)).filter(isPerk);
  if (!added.length) return null;
  const p = added[0];
  const until = compUntil(p, new Date());
  return (
    <p className="mt-2 border-l-2 border-clay bg-bone-light px-3 py-2 text-[13px] text-graphite">
      Saving makes their membership complimentary {until ? `until ${compDate(until.toISOString())}` : "with no end date"} ({p.label})
      {paying ? `, and pauses their Stripe billing ${until ? "until then" : ""}` : ""}.
    </p>
  );
}

/*
  STRIPE, FOR STAFF (lib/admin/stripe-actions.ts) — read when the slide-out
  opens: the linked customer, the card on file, the Club subscription, and
  any OTHER active plan (Coworks' Community Membership). Two actions:
  LINK (by email or cus_… — for members whose Stripe email differs) and
  START CLUB BILLING on the card on file, today or on a date (Stripe holds
  the first charge until then). Staff time it to the day their Coworks plan
  ends, then end that plan in Coworks — so nobody is billed twice.
*/
const SOON_YEARS = [0, 1, 2].map((n) => {
  const y = String(new Date().getFullYear() + n);
  return { value: y, label: y };
});

/*
  BILLING HISTORY — the member's own Manage billing list, for staff (Jesse,
  November 2026: Management had to open Stripe to see whether someone had
  paid). The same read (getBilling) and the same rows (InvoiceRow), so staff
  and member describe a bill identically. READ ONLY: no Pay now, nothing that
  moves money — PDF and receipt links only. Shown once the member has a
  Stripe customer; the Billing row above holds the controls.
*/
const HISTORY_RECENT = 6;

function BillingHistory({ memberId }: { memberId: string }) {
  const [b, setB] = React.useState<BillingView | null | undefined>(undefined);
  const [failed, setFailed] = React.useState(false);
  const [all, setAll] = React.useState(false);
  React.useEffect(() => {
    memberBilling(memberId)
      .then(setB)
      .catch(() => setFailed(true));
  }, [memberId]);

  const lastPaid = b?.invoices.find((i) => i.status === "paid");
  const shown = b ? (all ? b.invoices : b.invoices.filter((inv, i) => i < HISTORY_RECENT || inv.status === "open")) : [];
  const folded = b ? b.invoices.length - shown.length : 0;
  const note = b
    ? b.state === "past_due"
      ? null
      : lastPaid
        ? `Last paid ${lastPaid.amount} on ${shortDate(lastPaid.date)}`
        : "No payments yet"
    : undefined;

  return (
    <RecordSection title="Billing history" note={note ?? undefined}>
      {failed ? (
        <p className="text-sm text-muted-foreground">Couldn&rsquo;t reach Stripe just now.</p>
      ) : b === undefined ? (
        <p className="text-sm text-muted-foreground">Reading Stripe…</p>
      ) : b === null ? (
        <p className="text-sm text-muted-foreground">Stripe isn&rsquo;t connected on this copy of the site.</p>
      ) : (
        <>
          {b.state === "past_due" && (
            // The one red line: a failed charge is the thing staff open this for.
            <p className="border border-dashed border-geekdom-red px-3 py-2 text-sm text-graphite">
              <span className="text-geekdom-red">Past due</span>
              {b.open ? ` · ${b.open.amount} owed` : ""} — Stripe retries the card, and they&rsquo;ve been emailed to update it. They keep access meanwhile.
            </p>
          )}
          {!b.upcoming && b.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <ul className="-mt-2 border-b border-border text-sm">
              {b.upcoming && (
                <InvoiceRow
                  title={b.upcoming.kind === "resumes" ? `Complimentary until ${shortDate(b.upcoming.date)}` : monthOf(b.upcoming.periodStart)}
                  mark="upcoming"
                  detail={
                    b.upcoming.kind === "resumes"
                      ? "Billing resumes"
                      : `Club membership${b.upcoming.periodEnd ? ` · ${dayOf(b.upcoming.periodStart)} – ${dayOf(b.upcoming.periodEnd)}` : ""}`
                  }
                  amount={b.upcoming.amount}
                  when={`Charged ${shortDate(b.upcoming.date)}${b.card ? ` to •••• ${b.card.last4}` : ""}`}
                />
              )}
              {shown.map((inv) => {
                const mark = invoiceMark(inv.status);
                return (
                  <InvoiceRow key={inv.id} title={monthOf(inv.periodStart)} mark={mark} detail={inv.number || "Club membership"} amount={inv.amount} when={invoiceWhen(inv, mark)}>
                    {inv.pdf && (
                      <a href={inv.pdf} target="_blank" rel="noreferrer noopener" className="inline-flex h-7 items-center gap-1 border border-border px-2 text-xs text-graphite hover:border-graphite">
                        PDF
                        <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} aria-hidden="true" />
                      </a>
                    )}
                    {inv.hosted && inv.status === "paid" && (
                      <a href={inv.hosted} target="_blank" rel="noreferrer noopener" className="inline-flex h-7 items-center gap-1 border border-border px-2 text-xs text-graphite hover:border-graphite">
                        Receipt
                        <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} aria-hidden="true" />
                      </a>
                    )}
                  </InvoiceRow>
                );
              })}
            </ul>
          )}
          {folded > 0 ? (
            <button type="button" onClick={() => setAll(true)} className="self-start text-sm text-graphite underline decoration-clay decoration-1 underline-offset-4">
              Show {folded} earlier {folded === 1 ? "invoice" : "invoices"}
            </button>
          ) : (
            b.olderInvoices && all && <p className="text-[13px] text-muted-foreground">Older invoices are in Stripe (Open in Stripe, above).</p>
          )}
        </>
      )}
    </RecordSection>
  );
}

function StripePanel({ memberId, canAct, onChanged }: { memberId: string; canAct: boolean; onChanged: () => void }) {
  const [snap, setSnap] = React.useState<StripeSnapshot | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [starting, setStarting] = React.useState(false);
  const [when, setWhen] = React.useState<"now" | "date">("now");
  const today = new Date();
  const [date, setDate] = React.useState({ month: String(today.getMonth() + 1).padStart(2, "0"), day: String(today.getDate()).padStart(2, "0"), year: String(today.getFullYear()) });
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  // Cancelling from here (Management): when, and why — the exit survey's list.
  const [cancelling, setCancelling] = React.useState(false);
  const [endWhen, setEndWhen] = React.useState<"end_of_period" | "now">("end_of_period");
  const [exit, setExit] = React.useState<ExitAnswer>({ reason: null, note: "" });

  function runCancel(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setCancelling(false);
        load();
        onChanged();
      }
    });
  }

  const load = React.useCallback(() => {
    stripeSnapshot(memberId)
      .then((s) => setSnap(s))
      .catch(() => setFailed(true));
  }, [memberId]);
  React.useEffect(() => {
    load();
  }, [load]);

  function link() {
    startTransition(async () => {
      const res = await linkStripe(memberId, query);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setQuery("");
        load();
        onChanged();
      }
    });
  }

  function start() {
    const iso = when === "now" ? "now" : `${date.year}-${date.month}-${date.day}T18:00:00.000Z`;
    startTransition(async () => {
      const res = await startClubBilling(memberId, iso);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setStarting(false);
        load();
        onChanged();
      }
    });
  }

  if (failed) return <span className="text-muted-foreground">Couldn&rsquo;t reach Stripe just now.</span>;
  if (!snap) return <span className="text-muted-foreground">Checking Stripe…</span>;
  if (!snap.configured) return <span className="text-muted-foreground">Stripe isn&rsquo;t connected on this copy of the site.</span>;

  return (
    <div className="flex flex-col gap-2">
      {snap.customerId ? (
        <>
          <span>
            {snap.club ? (
              <>
                Club · {snap.club.price} · {snap.club.canceling ? "ends" : snap.club.status === "trialing" ? "starts" : "next payment"} {snap.club.next ? compDate(snap.club.next) : "—"}
              </>
            ) : (
              <span className="text-muted-foreground">No Club billing yet</span>
            )}
          </span>
          <span className="text-muted-foreground">{snap.card ?? "No card on file"}</span>
          {snap.other.length > 0 && <span className="text-muted-foreground">Also paying: {snap.other.join(", ")} (Coworks)</span>}
          <a
            href={`https://dashboard.stripe.com/customers/${snap.customerId}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 self-start underline decoration-clay decoration-1 underline-offset-2"
          >
            Open in Stripe
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
          </a>
          {canAct && snap.club && snap.club.canceling && (
            <Button type="button" variant="outline" size="sm" className="mt-1 self-start" disabled={pending} onClick={() => runCancel(() => keepClubBilling(memberId))}>
              {pending ? "Saving…" : "Keep their membership"}
            </Button>
          )}
          {canAct && snap.club && !snap.club.canceling && !cancelling && (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setEndWhen("end_of_period");
                setExit({ reason: null, note: "" });
                setCancelling(true);
              }}
              className="mt-1 self-start text-sm text-muted-foreground underline decoration-border underline-offset-2 hover:text-graphite hover:decoration-graphite"
            >
              Cancel membership…
            </button>
          )}
          {cancelling && snap.club && (
            <div className="mt-1 flex flex-col gap-3 border border-border bg-bone p-3">
              <div role="radiogroup" aria-label="When it ends" className="inline-flex self-start border border-border bg-bone-light">
                {(["end_of_period", "now"] as const).map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={endWhen === v}
                    onClick={() => setEndWhen(v)}
                    className={cn("h-8 px-3 text-[13px] font-medium", i > 0 && "border-l border-border", endWhen === v ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite")}
                  >
                    {v === "now" ? "Today" : "End of paid period"}
                  </button>
                ))}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {endWhen === "now"
                  ? "Access ends now. No refund for the rest of the month. They're emailed that it has ended."
                  : `They keep access until ${snap.club.next ? compDate(snap.club.next) : "the period ends"} and aren't charged again. They're emailed, and can undo it until then.`}
              </p>
              <ExitSurvey value={exit} onChange={setExit} audience="staff" />
              <div className="flex items-center gap-3">
                <Button type="button" variant="ink" size="sm" disabled={pending} onClick={() => runCancel(() => cancelClubBilling(memberId, endWhen, exit))}>
                  {pending ? "Cancelling…" : endWhen === "now" ? "End membership today" : "Cancel at period end"}
                </Button>
                <button type="button" onClick={() => setCancelling(false)} className="text-sm text-muted-foreground underline underline-offset-2">
                  Keep it
                </button>
              </div>
            </div>
          )}
          {canAct && !snap.club && snap.card && !starting && (
            <Button type="button" variant="outline" size="sm" className="mt-1 self-start" onClick={() => setStarting(true)} disabled={pending}>
              Start Club billing
            </Button>
          )}
          {starting && (
            <div className="mt-1 flex flex-col gap-2 border border-border bg-bone p-3">
              <p className="text-[13px] text-muted-foreground">On {snap.card}. Nothing is charged before the start date.</p>
              <div role="radiogroup" aria-label="When billing starts" className="inline-flex self-start border border-border bg-bone-light">
                {(["now", "date"] as const).map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={when === v}
                    onClick={() => setWhen(v)}
                    className={cn("h-8 px-3 text-[13px] font-medium", i > 0 && "border-l border-border", when === v ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite")}
                  >
                    {v === "now" ? "Today" : "On a date"}
                  </button>
                ))}
              </div>
              {when === "date" && (
                <div className="grid grid-cols-[1fr_5rem_6rem] gap-2">
                  <Combobox name="start-month" label="Billing starts — month" options={MONTHS} value={date.month} onChange={(v) => setDate((d) => ({ ...d, month: v }))} searchable={false} />
                  <Combobox name="start-day" label="Billing starts — day" options={DAYS} value={date.day} onChange={(v) => setDate((d) => ({ ...d, day: v }))} searchable={false} />
                  <Combobox name="start-year" label="Billing starts — year" options={SOON_YEARS} value={date.year} onChange={(v) => setDate((d) => ({ ...d, year: v }))} searchable={false} />
                </div>
              )}
              <div className="flex items-center gap-3">
                <Button type="button" variant="ink" size="sm" onClick={start} disabled={pending}>
                  {pending ? "Starting…" : "Start billing"}
                </Button>
                <button type="button" onClick={() => setStarting(false)} className="text-sm text-muted-foreground underline underline-offset-2">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/*
            NOT LINKED, said in words (Jesse: "Not linked to Stripe" told a
            first-time admin nothing). What it means, when it's normal, and
            what linking does — then the control, for Management.
          */}
          <span className="text-graphite">No billing on file</span>
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            They aren&rsquo;t paying through Stripe yet — normal for Enterprise, complimentary and imported members. Members who join through
            the website are linked automatically when they pay.
          </span>
          {canAct ? (
            <>
              <span className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Already paying Geekdom on Stripe (for example, from Coworks)? Find them by their Stripe email or customer ID. Their card and
                payments will show here, and you can start Club billing.
              </span>
              <div className="flex gap-2">
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Stripe email, or cus_…" aria-label="Their Stripe email or customer ID" className="h-9" />
                <Button type="button" variant="outline" size="sm" onClick={link} disabled={pending || !query.trim()}>
                  {pending ? "Finding…" : "Find in Stripe"}
                </Button>
              </div>
            </>
          ) : (
            <span className="text-[13px] text-muted-foreground">Geekdom management connects billing.</span>
          )}
        </>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("text-[13px]", msg.ok ? "text-graphite" : "text-geekdom-red")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

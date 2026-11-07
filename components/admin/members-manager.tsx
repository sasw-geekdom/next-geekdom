"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { ADMIN_CHIP, ADMIN_LABEL, MemberStatusLabel, RowButton, Table, Td, Th, Tr, tableDate, type SortDir } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { centralParts } from "@/lib/content/dates";
import { addTeammateForOwner, createMemberLogin, removeTeammateForOwner, saveMember } from "@/lib/admin/member-actions";
import { hasTeam, PLANS, planOf, type PlanId } from "@/lib/membership";
import { TeamCard } from "@/components/portal/team-card";
import type { Member } from "@/lib/admin/types";
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
] as const;
type View = (typeof VIEWS)[number]["value"];

function inView(m: MemberRow, view: View): boolean {
  if (view === "past_due") return m.status === "past_due";
  if (view === "never") return m.login.state === "invited";
  if (view === "nologin") return m.login.state === "none";
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
}

const PLAN_OPTIONS = PLANS.map((p) => ({ value: p.id, label: p.name }));

function blank(): Draft {
  const t = centralParts(new Date().toISOString());
  return { name: "", email: "", status: "active", year: t.year, month: t.month, day: t.day, tags: [], notes: "", plan: "solo", company: "" };
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
  };
}

export function MembersManager({
  members,
  startAdding = false,
}: {
  members: MemberRow[];
  /** Open "Add a member" straight away — the Overview's quick action (?add=1). */
  startAdding?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("all");
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

  const [draft, setDraft] = React.useState<Draft | null>(() => (startAdding ? blank() : null));
  const [drawerOpen, setDrawerOpen] = React.useState(startAdding);
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
      });
      if (res.ok) {
        setNotice({
          tone: "ok",
          text: draft.id
            ? "Saved."
            : `${draft.name} is a member. They can sign in at /sign-in with ${draft.email}.`,
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
            className="sm:w-56"
            options={VIEWS}
            value={view}
            onChange={(v) => setView(v as View)}
          />
          {tags.length > 0 && (
            <Combobox
              name="tag-filter"
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
        <MemberList members={ordered(shownCurrent)} sortBy={sortBy} onOpen={(m) => open(fromRow(m))} />
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
            <MemberList members={ordered(shownFormer)} sortBy={sortBy} onOpen={(m) => open(fromRow(m))} muted />
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
                    <Combobox id="m-plan" name="plan" options={PLAN_OPTIONS} value={draft.plan} onChange={(v) => set("plan")(v as PlanId)} searchable={false} />
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
                    : "Paused or canceled members can't sign in; Active restores access."
                }
              >
                <Combobox id="m-status" name="status" options={statusOptions} value={draft.status} onChange={set("status")} disabled={stripeManaged} />
              </Row>
              <Row label="Member since" htmlFor="m-month" error={errors.day ?? errors.month ?? errors.year} required>
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                  <Combobox id="m-month" name="month" options={MONTHS} value={draft.month} onChange={set("month")} searchable={false} />
                  <Combobox name="day" options={DAYS} value={draft.day} onChange={set("day")} searchable={false} invalid={Boolean(errors.day)} />
                  <Combobox name="year" options={YEARS} value={draft.year} onChange={set("year")} />
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
                  <dd className="text-graphite">{editing.portalInvitedAt ? `Sent ${longDate(editing.portalInvitedAt)}` : "Not sent"}</dd>
                  {editing.currentPeriodEnd && (
                    <>
                      <dt className="text-muted-foreground">{editing.cancelAtPeriodEnd ? "Ends" : "Renews"}</dt>
                      <dd className="text-graphite">{longDate(editing.currentPeriodEnd)}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Billing</dt>
                  <dd className="text-graphite">
                    {editing.stripeCustomerId ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${editing.stripeCustomerId}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 underline decoration-clay decoration-1 underline-offset-2"
                      >
                        Open in Stripe
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                      </a>
                    ) : (
                      "Not on Stripe yet"
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Added by</dt>
                  <dd className="text-graphite">
                    {{ admin: "Staff", import: "Member import", application: "Approved application", team: "Their team", stripe: "Stripe checkout" }[editing.source]}
                  </dd>
                </dl>
              </RecordSection>
            )}

            <RecordSection title="Staff only" note="Never shown to the member.">
              <TagInput value={draft.tags} onChange={set("tags")} known={tags} />
              <Field label="Notes" htmlFor="m-notes" error={errors.notes}>
                <Textarea id="m-notes" value={draft.notes} onChange={(e) => set("notes")(e.target.value)} className="min-h-24" />
              </Field>
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
}: {
  members: MemberRow[];
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
                    {t}
                  </span>
                ))}
              </span>
            </Td>
            <Td className="hidden text-muted-foreground md:table-cell">{m.email}</Td>
            <Td className="hidden lg:table-cell">
              {planOf(m.plan).name}
              {m.teamOwnerId && <span className="text-muted-foreground"> · teammate</span>}
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
        <h3 className={cn(ADMIN_LABEL, "text-graphite")}>{title}</h3>
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
  Tags as chips: type and press Enter (or comma) to add, × to remove, and
  the tags already in use offered as one-click suggestions — so the next
  admin reuses "founding member" instead of coining "founder member".
  Not a native <datalist>, which is a native combobox by another name.
*/
function TagInput({
  value,
  onChange,
  known,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  known: string[];
}) {
  const [text, setText] = React.useState("");
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setText("");
  };
  const suggestions = known.filter((t) => !value.includes(t) && t.includes(text.trim().toLowerCase())).slice(0, 8);

  return (
    <div>
      <label htmlFor="m-tags" className="mb-2 block text-sm font-medium text-graphite">
        Tags
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 border border-border bg-bone-light px-2 py-1.5 focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-1">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 border border-border bg-bone px-2 py-0.5 text-sm text-graphite">
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove tag ${t}`}
              className="text-muted-foreground hover:text-graphite"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          id="m-tags"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => text.trim() && add(text)}
          placeholder={value.length ? "" : "Add a tag and press Enter"}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-base text-graphite outline-none placeholder:text-muted-foreground"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">In use:</span>
          {suggestions.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => add(t)}
              className="border border-dashed border-border px-2 py-0.5 text-xs text-graphite hover:border-graphite"
            >
              + {t}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">For grouping members on this list. Never shown to them.</p>
    </div>
  );
}

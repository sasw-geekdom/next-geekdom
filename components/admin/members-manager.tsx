"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { MemberBadge } from "@/components/ui/badge";
import { FieldGroup, FoldingGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { centralParts } from "@/lib/content/dates";
import { createMemberLogin, saveMember } from "@/lib/admin/member-actions";
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
  return `Signed in ${longDate(l.lastSignIn)}`;
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
}

function blank(): Draft {
  const t = centralParts(new Date().toISOString());
  return { name: "", email: "", status: "active", year: t.year, month: t.month, day: t.day, tags: [], notes: "" };
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
  };
}

export function MembersManager({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState("");
  const [view, setView] = React.useState<View>("all");
  const [tag, setTag] = React.useState("all");
  const [formerOpen, setFormerOpen] = React.useState(false);

  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
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

      <p className={cn(MONO.label, "text-muted-foreground")}>
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
        <MemberList members={shownCurrent} onOpen={(m) => open(fromRow(m))} />
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
            <span className={cn(MONO.label, "text-muted-foreground")}>
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
            <MemberList members={shownFormer} onOpen={(m) => open(fromRow(m))} muted />
          )}
        </details>
      )}

      <Drawer
        open={drawerOpen}
        onClose={close}
        eyebrow={draft?.id ? "Member" : "New member"}
        title={draft?.id ? editing?.name ?? "Member" : "Add a member"}
        footer={
          <>
            <Button type="submit" form="member-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : draft?.id ? "Save changes" : "Add member"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        {draft && (
          <form id="member-form" onSubmit={onSave} noValidate className="flex flex-col gap-8">
            <FieldGroup title="Member">
              <Field label="Name" htmlFor="m-name" error={errors.name} required>
                <Input
                  id="m-name"
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  data-autofocus
                />
              </Field>
              <Field
                label="Email"
                htmlFor="m-email"
                error={errors.email}
                required
                hint="The address they sign in with. One membership per email."
              >
                <Input
                  id="m-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  value={draft.email}
                  onChange={(e) => set("email")(e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
              </Field>
            </FieldGroup>

            <div className="border-t border-border">
              <FoldingGroup
                title="Membership"
                summary={`${STATUS_LABEL[draft.status as MemberStatus] ?? draft.status} · since ${
                  MONTHS[Number(draft.month) - 1]?.label.slice(0, 3)
                } ${Number(draft.day)}, ${draft.year}`}
                defaultOpen={!draft.id}
              >
                <Field
                  label="Status"
                  htmlFor="m-status"
                  error={errors.status}
                  hint={
                    stripeManaged
                      ? "Billed through Stripe — status follows their subscription and can't be changed here."
                      : "Active members can sign in. Paused or canceled members can't — they move to Former members, and setting them back to Active restores access."
                  }
                >
                  <Combobox
                    id="m-status"
                    name="status"
                    options={statusOptions}
                    value={draft.status}
                    onChange={set("status")}
                    disabled={stripeManaged}
                  />
                </Field>
                <Field label="Member since" htmlFor="m-month" error={errors.day ?? errors.month ?? errors.year} required>
                  <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2">
                    <Combobox id="m-month" name="month" options={MONTHS} value={draft.month} onChange={set("month")} searchable={false} />
                    <Combobox name="day" options={DAYS} value={draft.day} onChange={set("day")} searchable={false} invalid={Boolean(errors.day)} />
                    <Combobox name="year" options={YEARS} value={draft.year} onChange={set("year")} />
                  </div>
                </Field>
                {editing && (
                  <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
                    <dt className="text-muted-foreground">{editing.cancelAtPeriodEnd ? "Ends" : "Renews"}</dt>
                    <dd className="text-graphite">{longDate(editing.currentPeriodEnd)}</dd>
                    <dt className="text-muted-foreground">Billing</dt>
                    <dd className="text-graphite">
                      {editing.stripeCustomerId ? (
                        <a
                          href={`https://dashboard.stripe.com/customers/${editing.stripeCustomerId}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1.5 underline decoration-clay decoration-2 underline-offset-2"
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
                      {editing.source === "admin" ? "Staff" : editing.source === "import" ? "Member import" : "Stripe checkout"}
                    </dd>
                  </dl>
                )}
              </FoldingGroup>

              <FoldingGroup
                title="Portal login"
                summary={editing ? loginLabel(editing.login) : "Created when you add them"}
              >
                {editing ? (
                  <>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {editing.login.state === "none"
                        ? "No sign-in account for this email yet. Create one so they can sign in at /sign-in."
                        : editing.login.state === "invited"
                          ? `Their account exists; they haven't signed in yet. They sign in at /sign-in with ${editing.email}.`
                          : `Last signed in ${longDate(editing.login.lastSignIn)}.`}
                    </p>
                    {editing.login.state === "none" && (
                      <Button type="button" variant="outline" size="sm" className="self-start" onClick={onCreateLogin} disabled={pending}>
                        Create login
                      </Button>
                    )}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Emailing them a sign-in link from here arrives with Geekdom&rsquo;s
                      email sending (send.geekdom.com).
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Adding them creates their sign-in account — no email is sent.
                    They sign in at /sign-in with this email and get a link.
                  </p>
                )}
              </FoldingGroup>

              <FoldingGroup
                title="Staff only"
                summary={
                  [draft.tags.length ? `${draft.tags.length} tag${draft.tags.length > 1 ? "s" : ""}` : "", draft.notes.trim() ? "notes" : ""]
                    .filter(Boolean)
                    .join(" · ") || "No tags or notes"
                }
              >
                <TagInput value={draft.tags} onChange={set("tags")} known={tags} />
                <Field label="Notes" htmlFor="m-notes" error={errors.notes} hint="Never shown to the member.">
                  <Textarea id="m-notes" value={draft.notes} onChange={(e) => set("notes")(e.target.value)} className="min-h-28" />
                </Field>
              </FoldingGroup>
            </div>

            {drawerError && (
              <p role="alert" className="text-sm text-geekdom-red">
                {drawerError}
              </p>
            )}
          </form>
        )}
      </Drawer>
    </div>
  );
}

function MemberList({
  members,
  onOpen,
  muted = false,
}: {
  members: MemberRow[];
  onOpen: (m: MemberRow) => void;
  muted?: boolean;
}) {
  return (
    <ul className="border-b border-border">
      {members.map((m) => (
        <li key={m.id} className={cn("border-t border-border", muted && "opacity-70")}>
          <button
            type="button"
            onClick={() => onOpen(m)}
            className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-1 py-4 text-left transition-colors hover:bg-bone-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-inset md:grid-cols-[minmax(0,1fr)_10rem_11rem_8rem]"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-graphite">{m.name}</span>
              <span className="block truncate text-sm text-muted-foreground">{m.email}</span>
              {m.tags.length > 0 && (
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {m.tags.map((t) => (
                    <span key={t} className={cn(MONO.micro, "border border-border px-1.5 py-0.5 text-graphite")}>
                      {t}
                    </span>
                  ))}
                </span>
              )}
            </span>
            <span className="hidden text-sm tabular-nums text-muted-foreground md:block">
              Since {longDate(m.joinedAt)}
            </span>
            <span className="hidden text-sm text-muted-foreground md:block">{loginLabel(m.login)}</span>
            <span className="row-start-1 justify-self-end md:col-start-4">
              <MemberBadge status={m.status} />
            </span>
          </button>
        </li>
      ))}
    </ul>
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

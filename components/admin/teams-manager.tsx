"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Drawer } from "@/components/ui/drawer";
import { ADMIN_LABEL, MemberStatusLabel, RowButton, Table, Td, Th, Tr } from "@/components/admin/admin-ui";
import { TeamCard } from "@/components/portal/team-card";
import { ARROW, LINK_ARROW } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { formatPrice, planOf } from "@/lib/membership";
import { createTeamAction, updateTeamAction } from "@/lib/admin/teams-actions";
import { enterpriseBillingAction } from "@/lib/admin/stripe-actions";
import { addTeammateForOwner, removeTeammateForOwner } from "@/lib/admin/member-actions";
import type { TeamSummary } from "@/lib/teams";

/*
  MEMBERS → TEAMS (lib/teams.ts): every Team and Enterprise account — the
  company, its plan, who pays, the seats used — and a slide-out per team
  with its people (the same card as an owner's Profile → Your team).
  "Create a team" picks the member who pays; everyone else joins from here
  or from the Team dropdown in their own slide-out.

  Management creates teams and changes plan and seats (it changes what's
  billed); every admin adds and takes off people.
*/

export interface OwnerOption {
  id: string;
  name: string;
  email: string;
}

const PLAN_OPTIONS = [
  { value: "team", label: "Team" },
  { value: "enterprise", label: "Enterprise" },
];

interface Draft {
  id?: string;
  name: string;
  plan: "team" | "enterprise";
  ownerId: string;
  /** Enterprise only; "" = no cap. */
  seats: string;
}

const monthly = (t: Pick<TeamSummary, "plan" | "monthlyCents">) =>
  t.plan === "team" ? `${formatPrice(planOf("team").priceCents ?? 0)}/mo` : t.monthlyCents ? `${formatPrice(t.monthlyCents)}/mo` : "Not set";

export function TeamsManager({ teams, owners, canManage }: { teams: TeamSummary[]; owners: OwnerOption[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const editing = draft?.id ? teams.find((t) => t.id === draft.id) ?? null : null;

  function start(d: Draft) {
    setDraft(d);
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    const seats = draft.plan === "enterprise" && draft.seats.trim() ? Number(draft.seats) : null;
    if (draft.plan === "enterprise" && draft.seats.trim() && !Number.isInteger(seats)) return setError("Seats is a whole number, or blank for no cap.");
    startTransition(async () => {
      const res = draft.id
        ? await updateTeamAction(draft.id, { name: draft.name, plan: draft.plan, seats })
        : await createTeamAction({ name: draft.name, plan: draft.plan, seats, ownerId: draft.ownerId });
      if (!res.ok) return setError(res.error);
      setNotice(res.message);
      if (!draft.id && "teamId" in res && typeof res.teamId === "string") setDraft({ ...draft, id: res.teamId });
      router.refresh();
    });
  }

  const dirty =
    !editing ||
    (draft !== null &&
      (draft.name !== editing.name || draft.plan !== editing.plan || (draft.plan === "enterprise" && draft.seats !== (editing.seats === null ? "" : String(editing.seats)))));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={cn(ADMIN_LABEL, "text-muted-foreground")}>
          {teams.length} {teams.length === 1 ? "team" : "teams"} · {teams.filter((t) => t.plan === "enterprise").length} Enterprise
        </p>
        {canManage && (
          <Button type="button" variant="ink" size="sm" onClick={() => start({ name: "", plan: "team", ownerId: "", seats: "" })}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Create a team
          </Button>
        )}
      </div>

      {teams.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-12 text-sm text-muted-foreground">
          No teams yet. A team is created when someone joins on the Team plan or an Enterprise application is approved
          {canManage ? " — or create one here, around the member who pays." : "."}
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Team</Th>
              <Th className="w-28">Plan</Th>
              <Th className="hidden w-[22%] md:table-cell">Pays</Th>
              <Th className="w-28">Seats</Th>
              <Th className="hidden w-28 lg:table-cell">Monthly</Th>
              <Th className="hidden w-28 sm:table-cell">Status</Th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <Tr key={t.id}>
                <Td>
                  <RowButton onClick={() => start({ id: t.id, name: t.name, plan: t.plan, ownerId: t.ownerId, seats: t.seats === null ? "" : String(t.seats) })}>
                    {t.name}
                  </RowButton>
                </Td>
                <Td>{planOf(t.plan).name}</Td>
                <Td className="hidden text-muted-foreground md:table-cell">{t.ownerName}</Td>
                <Td className="tabular-nums">{t.seats === null ? `${t.used} people` : `${t.used} of ${t.seats}`}</Td>
                <Td className={cn("hidden tabular-nums lg:table-cell", t.plan === "enterprise" && !t.monthlyCents && "text-muted-foreground")}>{monthly(t)}</Td>
                <Td className="hidden sm:table-cell">
                  <MemberStatusLabel status={t.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? editing.name : "Create a team"}
        description={
          editing ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {planOf(editing.plan).name} · {monthly(editing)}
              </span>
              <MemberStatusLabel status={editing.status} />
            </span>
          ) : (
            "Around the member who pays. Their plan and company follow the team."
          )
        }
        footer={
          canManage ? (
            <>
              <Button type="submit" form="team-form" variant="ink" disabled={pending || !dirty}>
                {pending ? "Saving…" : editing ? "Save changes" : "Create team"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </>
          ) : undefined
        }
      >
        {draft && (
          <form id="team-form" onSubmit={save} noValidate className="flex flex-col gap-5">
            {notice && <p className="border-l-2 border-clay bg-bone-light px-4 py-2.5 text-sm text-graphite">{notice}</p>}
            <Field label="Team name" htmlFor="t-name" hint="Usually the company — it's what the people on it see.">
              <Input id="t-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} disabled={!canManage} data-autofocus />
            </Field>
            <Field label="Plan" htmlFor="t-plan">
              <Combobox
                id="t-plan"
                name="plan"
                label="Plan"
                options={PLAN_OPTIONS}
                value={draft.plan}
                onChange={(v) => setDraft({ ...draft, plan: v as Draft["plan"] })}
                searchable={false}
                disabled={!canManage}
              />
            </Field>
            {draft.plan === "enterprise" ? (
              <Field label="Seats" htmlFor="t-seats" hint="People on the account, the billing contact included. Blank for no cap.">
                <Input id="t-seats" inputMode="numeric" value={draft.seats} onChange={(e) => setDraft({ ...draft, seats: e.target.value.replace(/\D/g, "") })} disabled={!canManage} placeholder="No cap" className="w-32" />
              </Field>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Team: up to {planOf("team").seats} people, the billing contact included · {formatPrice(planOf("team").priceCents ?? 0)}/month.
              </p>
            )}
            {editing ? (
              <Field label="Pays for the team" htmlFor="t-owner">
                <Link id="t-owner" href={`/portal/admin/members?m=${editing.ownerId}`} className={cn(LINK_ARROW, "text-sm")}>
                  {editing.ownerName}
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
              </Field>
            ) : (
              <Field label="Pays for the team" htmlFor="t-owner" hint="A current member who isn't on another team. Their billing becomes the team's.">
                <Combobox
                  id="t-owner"
                  name="owner"
                  label="The member who pays for the team"
                  placeholder="Pick a member…"
                  options={owners.map((o) => ({ value: o.id, label: `${o.name} · ${o.email}` }))}
                  value={draft.ownerId}
                  onChange={(v) => setDraft({ ...draft, ownerId: v })}
                />
              </Field>
            )}
            {error && (
              <p role="alert" className="text-sm text-geekdom-red">
                {error}
              </p>
            )}
          </form>
        )}
        {/* THE PEOPLE — outside the form above: the card carries its own add form. */}
        {editing && (
          <div className="mt-8">
            <TeamCard
              tone="plain"
              team={{
                ownerName: editing.ownerName,
                company: editing.name,
                plan: editing.plan,
                seats: editing.seats,
                teammates: editing.people.filter((p) => !p.owner).map((p) => ({ id: p.id, name: p.name, email: p.email, status: p.status })),
              }}
              add={(input) => addTeammateForOwner(editing.ownerId, input)}
              remove={(id) => removeTeammateForOwner(editing.ownerId, id)}
            />
          </div>
        )}
        {/* ENTERPRISE BILLING (lib/stripe/extras.ts): the agreed monthly amount, card autopay. Management only. */}
        {editing && editing.plan === "enterprise" && canManage && (
          <EnterpriseBilling key={editing.id} team={editing} onDone={() => router.refresh()} />
        )}
      </Drawer>
    </div>
  );
}

function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-4">
      <label htmlFor={htmlFor} className="text-sm text-muted-foreground sm:pt-3">
        {label}
      </label>
      <div className="min-w-0">
        {children}
        {hint && <p className="mt-1.5 text-[13px] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((label, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label,
}));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1).padStart(2, "0"), label: String(i + 1) }));

/*
  An Enterprise account's MONTHLY AMOUNT, on card autopay (Geekdom's call):
  set it and start billing today or on a date — nothing is charged before
  then — or change it once billing runs (from the next bill). The card is
  the billing contact's, saved in their portal.
*/
function EnterpriseBilling({ team, onDone }: { team: TeamSummary; onDone: () => void }) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const [amount, setAmount] = React.useState(team.monthlyCents ? String(team.monthlyCents / 100) : "");
  const [when, setWhen] = React.useState<"now" | "date">("now");
  const [date, setDate] = React.useState({ month: String(today.getMonth() + 1).padStart(2, "0"), day: String(today.getDate()).padStart(2, "0"), year: String(thisYear) });
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const cents = Math.round(Number(amount.replace(/[$,\s]/g, "")) * 100);

  function go() {
    setMsg(null);
    if (!(cents >= 100)) return setMsg({ ok: false, text: "Enter the monthly amount in dollars." });
    const startOn = team.billingActive || when === "now" ? "now" : `${date.year}-${date.month}-${date.day}T18:00:00.000Z`;
    startTransition(async () => {
      const res = await enterpriseBillingAction(team.id, cents, startOn);
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) onDone();
    });
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h3 className={cn(ADMIN_LABEL, "text-graphite")}>Billing</h3>
        <p className="text-[13px] text-muted-foreground">Card autopay · {team.ownerName}&rsquo;s card</p>
      </div>
      <div className="flex flex-col gap-4">
        <Field label="Monthly amount" htmlFor="e-amount" hint={team.billingActive ? "A change applies from the next bill." : "What the company agreed to pay each month."}>
          <Input id="e-amount" inputMode="decimal" placeholder="$0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,$]/g, ""))} className="w-40 tabular-nums" />
        </Field>
        {!team.billingActive && (
          <Field label="Starts" htmlFor="e-when">
            <div className="flex flex-col gap-2">
              <div id="e-when" role="radiogroup" aria-label="When billing starts" className="inline-flex self-start border border-border bg-bone-light">
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
                  <Combobox name="e-month" label="Billing starts — month" options={MONTHS} value={date.month} onChange={(v) => setDate((d) => ({ ...d, month: v }))} searchable={false} />
                  <Combobox name="e-day" label="Billing starts — day" options={DAYS} value={date.day} onChange={(v) => setDate((d) => ({ ...d, day: v }))} searchable={false} />
                  <Combobox
                    name="e-year"
                    label="Billing starts — year"
                    options={[thisYear, thisYear + 1].map((y) => ({ value: String(y), label: String(y) }))}
                    value={date.year}
                    onChange={(v) => setDate((d) => ({ ...d, year: v }))}
                    searchable={false}
                  />
                </div>
              )}
            </div>
          </Field>
        )}
        <div className="flex flex-wrap items-center gap-3 sm:ml-[calc(8.5rem+1rem)]">
          <Button type="button" variant="ink" size="sm" disabled={pending} onClick={go}>
            {pending ? "Working…" : team.billingActive ? "Change the amount" : when === "now" ? "Start billing today" : "Start billing on that date"}
          </Button>
        </div>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={cn("text-[13px] sm:ml-[calc(8.5rem+1rem)]", msg.ok ? "text-graphite" : "text-geekdom-red")}>
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}

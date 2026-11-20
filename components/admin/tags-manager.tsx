"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { ADMIN_LABEL, RowButton, Table, Td, Th, Tr } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { deletePerkTag, savePerkTag } from "@/lib/perks-actions";
import { PERK_EFFECT_LABELS, perkSummary, type PerkEffect, type PerkTag } from "@/lib/perks";

/*
  THE TAGS & PERKS LIST — a table (the admin's list convention), a
  slide-out to create or edit (Management only; Staff see it read-only).

  EVERY TAG IS CREATED HERE (Jesse, November 2026): a tag exists to turn
  on a discount or a complimentary membership, so a member's slide-out
  only PICKS from this list. Below the defined tags, any tag members still
  carry from before that rule ("Not set up"), with a count; Management can
  click one to define it under the same key, so everyone carrying it is
  covered.
*/

interface Draft {
  original: string;
  label: string;
  effect: PerkEffect;
  months: string;
  note: string;
}

const blank: Draft = { original: "", label: "", effect: "free_months", months: "12", note: "" };

export function TagsManager({
  tags,
  counts,
  otherTags,
  canManage,
  startNew = false,
}: {
  /** ?new=1 — the member slide-out's "New tag" link opens the form straight away. */
  startNew?: boolean;
  tags: PerkTag[];
  counts: Record<string, { tagged: number; complimentary: number }>;
  otherTags: { name: string; count: number }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<Draft | null>(startNew && canManage ? blank : null);
  const [open, setOpen] = React.useState(startNew && canManage);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function edit(d: Draft) {
    setDraft(d);
    setErrors({});
    setError(null);
    setNotice(null);
    setOpen(true);
  }
  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await savePerkTag({ original: draft.original, label: draft.label, effect: draft.effect, months: Number(draft.months), note: draft.note });
      if (res.ok) {
        setOpen(false);
        setNotice(res.message);
      } else {
        setErrors(res.fieldErrors ?? {});
        setError(res.message);
      }
      router.refresh();
    });
  }

  function remove() {
    if (!draft?.original) return;
    if (!window.confirm(`Delete "${draft.label}"? Members who have it keep the tag as a label, and any complimentary time already given.`)) return;
    startTransition(async () => {
      const res = await deletePerkTag(draft.original);
      if (res.ok) {
        setOpen(false);
        setNotice(res.message);
      } else setError(res.message);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Apply tags in a member&rsquo;s slide-out on Members. A <span className="text-graphite">perk</span> tag starts their complimentary period
          the day it&rsquo;s applied and pauses any Stripe billing until it ends; taking the tag off ends it and resumes billing.
          {" "}Every tag is created here; a member&rsquo;s slide-out picks from this list.
          {!canManage && " Only Geekdom management can create or change tags."}
        </p>
        {canManage && (
          <Button variant="ink" size="sm" onClick={() => edit(blank)} disabled={pending}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            New tag
          </Button>
        )}
      </div>

      {notice && (
        <p role="status" className="border border-dashed border-border px-4 py-3 text-sm text-graphite">
          {notice}
        </p>
      )}

      {tags.length === 0 && otherTags.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-14 text-center text-sm text-muted-foreground">
          No tags defined yet.{canManage ? " Create one — for example “DEVSA community”, complimentary for 12 months." : ""}
        </p>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Tag</Th>
              <Th className="w-64">What it does</Th>
              <Th className="hidden w-60 md:table-cell" align="right">
                Members
              </Th>
              <Th className="hidden w-[30%] lg:table-cell">Note</Th>
            </tr>
          </thead>
          <tbody>
            {tags.map((t) => {
              const c = counts[t.name] ?? { tagged: 0, complimentary: 0 };
              const row = { original: t.name, label: t.label, effect: t.effect, months: String(t.months), note: t.note };
              return (
                <Tr key={t.name}>
                  <Td>{canManage ? <RowButton onClick={() => edit(row)}>{t.label}</RowButton> : <span className="font-medium text-graphite">{t.label}</span>}</Td>
                  <Td className={cn(t.effect === "none" && "text-muted-foreground")}>{perkSummary(t)}</Td>
                  <Td align="right" className="hidden tabular-nums md:table-cell">
                    {c.tagged}
                    {t.effect !== "none" && <span className="text-muted-foreground"> · {c.complimentary} complimentary now</span>}
                  </Td>
                  <Td className="hidden text-muted-foreground lg:table-cell">{t.note || "—"}</Td>
                </Tr>
              );
            })}
            {otherTags.map((t) => (
              <Tr key={`label:${t.name}`}>
                <Td>
                  {canManage ? (
                    <RowButton onClick={() => edit({ ...blank, label: t.name, effect: "none" })}>{t.name}</RowButton>
                  ) : (
                    <span className="font-medium text-graphite">{t.name}</span>
                  )}
                </Td>
                <Td className="text-muted-foreground">Not set up · from before tags lived here</Td>
                <Td align="right" className="hidden tabular-nums md:table-cell">
                  {t.count}
                </Td>
                <Td className="hidden text-muted-foreground lg:table-cell">{canManage ? "Click to set it up" : "—"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={draft?.original ? `Edit ${draft.label}` : "New tag"}
        description="Members tagged after a change get the new terms; everyone already tagged keeps theirs."
        footer={
          <>
            <Button type="submit" form="tag-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            {draft?.original && (
              <button type="button" onClick={remove} disabled={pending} className="ml-auto text-sm text-muted-foreground underline underline-offset-2 hover:text-graphite">
                Delete tag
              </button>
            )}
          </>
        }
      >
        {draft && (
          <form id="tag-form" onSubmit={save} noValidate className="flex flex-col gap-5">
            <Field label="Name" htmlFor="tg-label" error={errors.label} required hint="How it reads on a member: “DEVSA community”.">
              <Input id="tg-label" value={draft.label} onChange={(e) => set({ label: e.target.value })} data-autofocus />
            </Field>
            <Field label="What it does" htmlFor="tg-effect">
              <Combobox
                id="tg-effect"
                name="effect"
                options={(Object.keys(PERK_EFFECT_LABELS) as PerkEffect[]).map((k) => ({ value: k, label: PERK_EFFECT_LABELS[k] }))}
                value={draft.effect}
                onChange={(v) => set({ effect: v as PerkEffect })}
                searchable={false}
              />
            </Field>
            {draft.effect === "free_months" && (
              <Field label="For how many months" htmlFor="tg-months" error={errors.months} hint="Counted from the day the tag is applied to a member.">
                <Input id="tg-months" type="number" inputMode="numeric" min={1} max={60} value={draft.months} onChange={(e) => set({ months: e.target.value })} className="w-32" />
              </Field>
            )}
            {draft.effect !== "none" && (
              <p className="border-l-2 border-clay bg-bone-light px-4 py-3 text-sm leading-relaxed text-graphite">
                When staff add this tag to a member, their membership is complimentary{" "}
                {draft.effect === "free_months" ? `for ${draft.months || "…"} months from that day` : "with no end date"}. If they pay through Stripe, their billing pauses
                {draft.effect === "free_months" ? " and resumes on its own when it ends" : ""}. Taking the tag off ends it.
              </p>
            )}
            <Field label="Note for staff (optional)" htmlFor="tg-note" hint="Where it came from — “Agreed with DEVSA, Nov 2026”.">
              <Textarea id="tg-note" rows={3} value={draft.note} onChange={(e) => set({ note: e.target.value })} />
            </Field>
            {error && (
              <p role="alert" className={cn(ADMIN_LABEL, "text-geekdom-red")}>
                {error}
              </p>
            )}
          </form>
        )}
      </Drawer>
    </div>
  );
}

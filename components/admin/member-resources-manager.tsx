"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { FieldGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import {
  deleteFaq,
  deleteLink,
  moveResource,
  saveBasics,
  saveFaq,
  saveLink,
  type FaqInput,
} from "@/lib/content/member-resource-actions";
import type { FaqEntry, MemberResources, ResourceLinkItem } from "@/lib/content/member-resources";
import type { ActionResult } from "@/lib/content/types";

/*
  THE MEMBER PORTAL'S BASICS, EDITED — what members would otherwise email
  club@ for: the Slack invite, the Wi-Fi, the hours, the resource links and
  the FAQ. Three lists, one slide-out (the admin's pattern: never an inline
  form above the list). Saving updates /portal/resources and the dashboard's
  Slack tile on the next request.

  Before the first save the portal shows the text it shipped with; the list
  here is that text, and the first save writes it all down.
*/

type Editing =
  | { kind: "basics"; draft: Basics }
  | { kind: "link"; draft: LinkDraft }
  | { kind: "faq"; draft: FaqDraft };

type Basics = Pick<MemberResources, "slackInviteUrl" | "wifiNetwork" | "wifiPassword" | "hours">;
type LinkDraft = Omit<ResourceLinkItem, "id"> & { id?: string };
type FaqDraft = Omit<FaqEntry, "id"> & { id?: string };

export function MemberResourcesManager({ resources, groups }: { resources: MemberResources; groups: readonly string[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const close = React.useCallback(() => setDrawerOpen(false), []);

  function open(e: Editing) {
    setEditing(e);
    setErrors({});
    setNotice(null);
    setDrawerOpen(true);
  }

  function report(res: ActionResult, okText: string) {
    if (res.ok) {
      setNotice({ tone: "ok", text: okText });
      setDrawerOpen(false);
      setErrors({});
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      if (res.error) setNotice({ tone: "error", text: res.error });
    }
  }

  function onSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editing) return;
    startTransition(async () => {
      if (editing.kind === "basics") report(await saveBasics(editing.draft), "Saved. Members see it now.");
      if (editing.kind === "link") report(await saveLink(editing.draft), editing.draft.id ? "Link saved." : "Link added.");
      if (editing.kind === "faq") report(await saveFaq(editing.draft as FaqInput), editing.draft.id ? "Answer saved." : "Question added.");
    });
  }

  const run = (fn: () => Promise<ActionResult>, okText: string) => startTransition(async () => report(await fn(), okText));

  // Edit the open draft, whichever kind it is.
  function set<K extends string>(k: K, v: string | boolean) {
    setEditing((e) => (e ? ({ ...e, draft: { ...e.draft, [k]: v } } as Editing) : e));
  }

  const b = resources;
  const byGroup = groups.map((g) => ({ group: g, items: b.faq.filter((f) => f.group === g) }));

  return (
    <div className="flex flex-col gap-12">
      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={cn("text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}>
          {notice.text}
        </p>
      )}

      {/* ── The basics ─────────────────────────────────────────────────── */}
      <section>
        <SectionHead title="The basics">
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => open({ kind: "basics", draft: { slackInviteUrl: b.slackInviteUrl, wifiNetwork: b.wifiNetwork, wifiPassword: b.wifiPassword, hours: b.hours } })}
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
            Edit
          </Button>
        </SectionHead>
        <dl className="mt-3 grid border-y border-border sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Member Slack" value={b.slackInviteUrl || null} empty="Not open yet" />
          <Fact label="Wi-Fi network" value={b.wifiNetwork || null} empty="To confirm" />
          <Fact label="Wi-Fi password" value={b.wifiPassword || null} empty="To confirm" mono />
          <Fact label="Hours" value={b.hours} />
        </dl>
        <p className="mt-2 text-sm text-muted-foreground">
          The Slack link opens the dashboard&rsquo;s Slack tile. Wi-Fi shows only to signed-in members, on FAQ &amp; resources.
        </p>
      </section>

      {/* ── Resource links ─────────────────────────────────────────────── */}
      <section>
        <SectionHead title="Resource links">
          <Button variant="ink" size="sm" disabled={pending} onClick={() => open({ kind: "link", draft: { title: "", description: "", href: "" } })}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Add a link
          </Button>
        </SectionHead>
        <ul className="mt-3 border-b border-border">
          {b.links.map((l, i) => (
            <Row
              key={l.id}
              title={l.title}
              sub={l.href || l.description}
              badge={l.href ? null : "Coming soon"}
              first={i === 0}
              last={i === b.links.length - 1}
              disabled={pending}
              onUp={() => run(() => moveResource("link", l.id, -1), "Moved.")}
              onDown={() => run(() => moveResource("link", l.id, 1), "Moved.")}
              onEdit={() => open({ kind: "link", draft: { ...l } })}
              onDelete={() => window.confirm(`Remove “${l.title}”?`) && run(() => deleteLink(l.id), "Removed.")}
            />
          ))}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">A link with no address shows under &ldquo;Coming soon&rdquo;. Email links show in the &ldquo;Still have a question?&rdquo; tile instead.</p>
      </section>

      {/* ── The FAQ ────────────────────────────────────────────────────── */}
      <section>
        <SectionHead title="Questions members ask">
          <Button
            variant="ink"
            size="sm"
            disabled={pending}
            onClick={() => open({ kind: "faq", draft: { group: groups[0], q: "", a: "", confirm: false } })}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Add a question
          </Button>
        </SectionHead>
        <div className="mt-3 flex flex-col gap-6">
          {byGroup.map(({ group, items }) => (
            <div key={group}>
              <h3 className={cn(MONO.micro, "text-muted-foreground")}>{group}</h3>
              {items.length === 0 ? (
                <p className="mt-2 border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">No questions in this section.</p>
              ) : (
                <ul className="mt-2 border-b border-border">
                  {items.map((f, i) => (
                    <Row
                      key={f.id}
                      title={f.q}
                      sub={f.a}
                      badge={f.confirm ? "To confirm" : null}
                      first={i === 0}
                      last={i === items.length - 1}
                      disabled={pending}
                      onUp={() => run(() => moveResource("faq", f.id, -1), "Moved.")}
                      onDown={() => run(() => moveResource("faq", f.id, 1), "Moved.")}
                      onEdit={() => open({ kind: "faq", draft: { ...f } })}
                      onDelete={() => window.confirm(`Remove “${f.q}”?`) && run(() => deleteFaq(f.id), "Removed.")}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={close}
        eyebrow="Member resources"
        title={
          editing?.kind === "basics"
            ? "Slack, Wi-Fi and hours"
            : editing?.kind === "link"
              ? editing.draft.id ? "Edit this link" : "Add a link"
              : editing?.draft.id ? "Edit this question" : "Add a question"
        }
        footer={
          <>
            <Button type="submit" form="resources-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        {editing && (
          <form id="resources-form" onSubmit={onSave} noValidate className="flex flex-col gap-10">
            {editing.kind === "basics" && (
              <>
                <FieldGroup title="Member Slack">
                  <Field label="Invite link" htmlFor="mr-slack" error={errors.slackInviteUrl} hint="Leave blank until Slack opens — the dashboard says “Opening soon”.">
                    <Input id="mr-slack" type="url" inputMode="url" value={editing.draft.slackInviteUrl} onChange={(e) => set("slackInviteUrl", e.target.value)} placeholder="https://join.slack.com/t/…" data-autofocus />
                  </Field>
                </FieldGroup>
                <FieldGroup title="Wi-Fi">
                  <Field label="Network" htmlFor="mr-wifi" error={errors.wifiNetwork}>
                    <Input id="mr-wifi" value={editing.draft.wifiNetwork} onChange={(e) => set("wifiNetwork", e.target.value)} placeholder="Geekdom-Members" />
                  </Field>
                  <Field label="Password" htmlFor="mr-wifi-pw" error={errors.wifiPassword} hint="Shown only to signed-in members.">
                    <Input id="mr-wifi-pw" value={editing.draft.wifiPassword} onChange={(e) => set("wifiPassword", e.target.value)} autoComplete="off" spellCheck={false} />
                  </Field>
                </FieldGroup>
                <FieldGroup title="Hours">
                  <Field label="When members can come in" htmlFor="mr-hours" error={errors.hours} required>
                    <Input id="mr-hours" value={editing.draft.hours} onChange={(e) => set("hours", e.target.value)} />
                  </Field>
                </FieldGroup>
              </>
            )}

            {editing.kind === "link" && (
              <FieldGroup title="Link">
                <Field label="Title" htmlFor="mr-title" error={errors.title} required>
                  <Input id="mr-title" value={editing.draft.title} onChange={(e) => set("title", e.target.value)} placeholder="House guidelines" data-autofocus />
                </Field>
                <Field label="One line about it" htmlFor="mr-desc" error={errors.description}>
                  <Input id="mr-desc" value={editing.draft.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <Field label="Address" htmlFor="mr-href" error={errors.href} hint="An https:// link, a mailto: address, or a page here starting with /. Blank = coming soon.">
                  <Input id="mr-href" value={editing.draft.href} onChange={(e) => set("href", e.target.value)} placeholder="https://…" />
                </Field>
              </FieldGroup>
            )}

            {editing.kind === "faq" && (
              <FieldGroup title="Question">
                <Field label="Section" htmlFor="mr-group" error={errors.group} required>
                  <Combobox
                    id="mr-group"
                    name="group"
                    options={groups.map((g) => ({ value: g, label: g }))}
                    value={editing.draft.group}
                    onChange={(v) => set("group", v)}
                    searchable={false}
                  />
                </Field>
                <Field label="Question" htmlFor="mr-q" error={errors.q} required>
                  <Input id="mr-q" value={editing.draft.q} onChange={(e) => set("q", e.target.value)} data-autofocus />
                </Field>
                <Field label="Answer" htmlFor="mr-a" error={errors.a} required>
                  <Textarea id="mr-a" rows={6} value={editing.draft.a} onChange={(e) => set("a", e.target.value)} />
                </Field>
                <Switch
                  checked={editing.draft.confirm}
                  onChange={(v) => set("confirm", v)}
                  label="Still to confirm — members see a “To confirm” tag"
                />
              </FieldGroup>
            )}
          </form>
        )}
      </Drawer>
    </div>
  );
}

function SectionHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className={cn(MONO.label, "text-muted-foreground")}>{title}</h2>
      {children}
    </div>
  );
}

function Fact({ label, value, empty, mono = false }: { label: string; value: string | null; empty?: string; mono?: boolean }) {
  return (
    <div className="min-w-0 border-t border-border py-4 first:border-t-0 sm:border-t-0 sm:pr-6">
      <dt className={cn(MONO.micro, "text-muted-foreground")}>{label}</dt>
      <dd className={cn("mt-1 truncate text-graphite", mono && "font-mono text-sm")}>
        {value ?? <span className={cn(MONO.micro, "border border-dashed border-border px-1.5 py-0.5")}>{empty}</span>}
      </dd>
    </div>
  );
}

function Row({
  title,
  sub,
  badge,
  first,
  last,
  disabled,
  onUp,
  onDown,
  onEdit,
  onDelete,
}: {
  title: string;
  sub: string;
  badge: string | null;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 border-t border-border py-3.5">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-graphite">
          <span className="truncate">{title}</span>
          {badge && <Badge tone="neutral">{badge}</Badge>}
        </p>
        <p className="truncate text-sm text-muted-foreground">{sub}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onUp} disabled={disabled || first} aria-label={`Move “${title}” up`}>
          <ArrowUp className="h-4 w-4" strokeWidth={1.7} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDown} disabled={disabled || last} aria-label={`Move “${title}” down`}>
          <ArrowDown className="h-4 w-4" strokeWidth={1.7} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onEdit} disabled={disabled} aria-label={`Edit “${title}”`}>
          <Pencil className="h-4 w-4" strokeWidth={1.7} />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete} disabled={disabled} aria-label={`Remove “${title}”`}>
          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
        </Button>
      </div>
    </li>
  );
}

"use client";

import { ADMIN_LABEL, Status, type StatusKind } from "@/components/admin/admin-ui";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
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
  the FAQ. Laid out like the rest of the admin: the two lists as cards of
  44px rows (click a row to edit it; move and remove appear on hover), the
  basics as a properties card in a side column, one slide-out for every
  edit. Saving updates /portal/resources and the dashboard's Slack tile on
  the next request (other copies of the site within a minute).

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

export function MemberResourcesManager({
  resources,
  groups,
  autoAnswers = {},
}: {
  resources: MemberResources;
  groups: readonly string[];
  /** FAQ id → the answer members actually read, where it's built from other fields (the Wi-Fi). */
  autoAnswers?: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
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
  const editBasics = () =>
    open({ kind: "basics", draft: { slackInviteUrl: b.slackInviteUrl, wifiNetwork: b.wifiNetwork, wifiPassword: b.wifiPassword, hours: b.hours } });
  const editingAuto = editing?.kind === "faq" && editing.draft.id ? autoAnswers[editing.draft.id] : undefined;

  return (
    <div className="flex flex-col gap-6">
      {notice && (
        <p role={notice.tone === "error" ? "alert" : "status"} className={cn("text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}>
          {notice.text}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* ── Resource links ── */}
          <Card
            title="Resource links"
            count={b.links.length}
            action={
              <Button variant="ink" size="sm" disabled={pending} onClick={() => open({ kind: "link", draft: { title: "", description: "", href: "" } })}>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                Add a link
              </Button>
            }
            note="A link with no address shows under “Coming soon”. Email links show in the “Still have a question?” tile instead."
          >
            {b.links.length === 0 ? (
              <Empty>No links yet.</Empty>
            ) : (
              <ul>
                {b.links.map((l, i) => (
                  <Row
                    key={l.id}
                    title={l.title}
                    // "Book a room" is built into the portal (/portal/rooms) and
                    // always live there, whatever this saved row says.
                    sub={/book a room/i.test(l.title) ? "Built into the portal — always links to Book a room. You can remove this row." : l.href || l.description}
                    status={/book a room/i.test(l.title) ? { kind: "info", text: "Built in" } : l.href ? null : { kind: "closed", text: "Coming soon" }}
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
            )}
          </Card>

          {/* ── The FAQ ── */}
          <Card
            title="Questions members ask"
            count={b.faq.length}
            action={
              <Button variant="ink" size="sm" disabled={pending} onClick={() => open({ kind: "faq", draft: { group: groups[0], q: "", a: "", confirm: false } })}>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
                Add a question
              </Button>
            }
          >
            {byGroup.map(({ group, items }) => (
              <div key={group}>
                <h3 className="border-b border-border bg-bone px-4 py-2 text-[13px] font-medium text-muted-foreground">
                  {group} <span className="tabular-nums">· {items.length}</span>
                </h3>
                {items.length === 0 ? (
                  <Empty>No questions in this section.</Empty>
                ) : (
                  <ul>
                    {items.map((f, i) => {
                      const auto = autoAnswers[f.id];
                      return (
                        <Row
                          key={f.id}
                          title={f.q}
                          // The password stays behind "The basics"' Show button, not in a preview line.
                          sub={auto && b.wifiPassword ? auto.replace(b.wifiPassword, "•".repeat(8)) : (auto ?? f.a)}
                          status={auto ? { kind: "info", text: "From the Wi-Fi fields" } : f.confirm ? { kind: "todo", text: "To confirm" } : null}
                          first={i === 0}
                          last={i === items.length - 1}
                          disabled={pending}
                          onUp={() => run(() => moveResource("faq", f.id, -1), "Moved.")}
                          onDown={() => run(() => moveResource("faq", f.id, 1), "Moved.")}
                          onEdit={() => open({ kind: "faq", draft: { ...f } })}
                          onDelete={() => window.confirm(`Remove “${f.q}”?`) && run(() => deleteFaq(f.id), "Removed.")}
                        />
                      );
                    })}
                  </ul>
                )}
              </div>
            ))}
          </Card>
        </div>

        {/* ── The basics — a properties card beside the lists ── */}
        <aside className="lg:sticky lg:top-6">
          <Card
            title="The basics"
            action={
              <Button variant="outline" size="sm" disabled={pending} onClick={editBasics}>
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.8} />
                Edit
              </Button>
            }
            note="The Slack link powers the dashboard’s Slack tile. Wi-Fi shows only to signed-in members, on FAQ & resources — and answers the FAQ’s Wi-Fi question."
          >
            <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 text-sm">
              <dt className="text-muted-foreground">Member Slack</dt>
              <dd className="min-w-0">{b.slackInviteUrl ? <span className="block truncate text-graphite">{b.slackInviteUrl.replace(/^https?:\/\//, "")}</span> : <Status kind="closed">Not open yet</Status>}</dd>
              <dt className="text-muted-foreground">Wi-Fi network</dt>
              <dd className="min-w-0 truncate text-graphite">{b.wifiNetwork || <Status kind="todo">To confirm</Status>}</dd>
              <dt className="text-muted-foreground">Wi-Fi password</dt>
              <dd className="flex min-w-0 items-center gap-2">
                {b.wifiPassword ? (
                  <>
                    <span className="truncate font-mono text-[13px] text-graphite">{showPassword ? b.wifiPassword : "•".repeat(Math.min(12, b.wifiPassword.length))}</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide the Wi-Fi password" : "Show the Wi-Fi password"}
                      className="shrink-0 text-muted-foreground hover:text-graphite"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.7} /> : <Eye className="h-4 w-4" strokeWidth={1.7} />}
                    </button>
                  </>
                ) : (
                  <Status kind="todo">To confirm</Status>
                )}
              </dd>
              <dt className="text-muted-foreground">Hours</dt>
              <dd className="min-w-0 text-graphite">{b.hours}</dd>
            </dl>
          </Card>
        </aside>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={close}
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
          <form id="resources-form" onSubmit={onSave} noValidate className="flex flex-col gap-8">
            {editing.kind === "basics" && (
              <>
                <DrawerSection title="Member Slack">
                  <Field label="Invite link" htmlFor="mr-slack" error={errors.slackInviteUrl} hint="Leave blank until Slack opens — the dashboard says “Opening soon”.">
                    <Input id="mr-slack" type="url" inputMode="url" value={editing.draft.slackInviteUrl} onChange={(e) => set("slackInviteUrl", e.target.value)} placeholder="https://join.slack.com/t/…" data-autofocus />
                  </Field>
                </DrawerSection>
                <DrawerSection title="Wi-Fi" note="Also answers the FAQ’s Wi-Fi question.">
                  <Field label="Network" htmlFor="mr-wifi" error={errors.wifiNetwork}>
                    <Input id="mr-wifi" value={editing.draft.wifiNetwork} onChange={(e) => set("wifiNetwork", e.target.value)} placeholder="Geekdom-Members" />
                  </Field>
                  <Field label="Password" htmlFor="mr-wifi-pw" error={errors.wifiPassword} hint="Shown only to signed-in members.">
                    <Input id="mr-wifi-pw" value={editing.draft.wifiPassword} onChange={(e) => set("wifiPassword", e.target.value)} autoComplete="off" spellCheck={false} />
                  </Field>
                </DrawerSection>
                <DrawerSection title="Hours">
                  <Field label="When members can come in" htmlFor="mr-hours" error={errors.hours} required>
                    <Input id="mr-hours" value={editing.draft.hours} onChange={(e) => set("hours", e.target.value)} />
                  </Field>
                </DrawerSection>
              </>
            )}

            {editing.kind === "link" && (
              <DrawerSection title="Link">
                <Field label="Title" htmlFor="mr-title" error={errors.title} required>
                  <Input id="mr-title" value={editing.draft.title} onChange={(e) => set("title", e.target.value)} placeholder="House guidelines" data-autofocus />
                </Field>
                <Field label="One line about it" htmlFor="mr-desc" error={errors.description}>
                  <Input id="mr-desc" value={editing.draft.description} onChange={(e) => set("description", e.target.value)} />
                </Field>
                <Field label="Address" htmlFor="mr-href" error={errors.href} hint="An https:// link, a mailto: address, or a page here starting with /. Blank = coming soon.">
                  <Input id="mr-href" value={editing.draft.href} onChange={(e) => set("href", e.target.value)} placeholder="https://…" />
                </Field>
              </DrawerSection>
            )}

            {editing.kind === "faq" && (
              <DrawerSection title="Question">
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
                {editingAuto && (
                  <div className="border border-dashed border-border px-4 py-3 text-sm">
                    <p className="font-medium text-graphite">Members read this answer, built from the Wi-Fi fields:</p>
                    <p className="mt-1 text-muted-foreground">{editingAuto}</p>
                    <p className="mt-2 text-[13px] text-muted-foreground">Change the Wi-Fi under The basics. The answer below is used only if those fields are empty.</p>
                  </div>
                )}
                <Field label={editingAuto ? "Answer if the Wi-Fi fields are empty" : "Answer"} htmlFor="mr-a" error={errors.a} required>
                  <Textarea id="mr-a" rows={6} value={editing.draft.a} onChange={(e) => set("a", e.target.value)} />
                </Field>
                {!editingAuto && (
                  <Switch checked={editing.draft.confirm} onChange={(v) => set("confirm", v)} label="Still to confirm — members see a “To confirm” tag" />
                )}
              </DrawerSection>
            )}
          </form>
        )}
      </Drawer>
    </div>
  );
}

/** A titled card: header bar (title, count, action), the content, an optional footnote. */
function Card({
  title,
  count,
  action,
  note,
  children,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border bg-bone-light">
      <div className="flex min-h-13 items-center justify-between gap-4 border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-medium text-graphite">
          {title}
          {count !== undefined && <span className="ml-2 tabular-nums text-muted-foreground">{count}</span>}
        </h2>
        {action}
      </div>
      {children}
      {note && <p className="border-t border-border px-4 py-2.5 text-[13px] text-muted-foreground">{note}</p>}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-muted-foreground">{children}</p>;
}

/** A drawer section — the admin's sentence-case label, not the shared mono legend. */
function DrawerSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h3 className={cn(ADMIN_LABEL, "text-graphite")}>{title}</h3>
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

/*
  One link or question. The row is the edit button (Linear: click to
  open); move and remove sit on the right, shown on hover or focus on a
  desktop and always on touch screens, so a list of ten isn't forty icons.
*/
function Row({
  title,
  sub,
  status,
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
  status: { kind: StatusKind; text: string } | null;
  first: boolean;
  last: boolean;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const icon = "inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:bg-bone-light hover:text-graphite disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay";
  return (
    <li className="group relative flex min-h-12 items-center gap-3 border-t border-border px-4 py-2 first:border-t-0 hover:bg-bone">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="truncate text-left text-sm font-medium text-graphite after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-clay"
          >
            {title}
          </button>
          {status && <Status kind={status.kind} className="shrink-0 text-[13px] text-muted-foreground">{status.text}</Status>}
        </p>
        {sub && <p className="truncate text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="relative z-10 flex shrink-0 items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
        <button type="button" className={icon} onClick={onUp} disabled={disabled || first} aria-label={`Move “${title}” up`}>
          <ArrowUp className="h-4 w-4" strokeWidth={1.7} />
        </button>
        <button type="button" className={icon} onClick={onDown} disabled={disabled || last} aria-label={`Move “${title}” down`}>
          <ArrowDown className="h-4 w-4" strokeWidth={1.7} />
        </button>
        <button type="button" className={icon} onClick={onDelete} disabled={disabled} aria-label={`Remove “${title}”`}>
          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
        </button>
      </div>
    </li>
  );
}

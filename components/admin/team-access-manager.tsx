"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Field, Input } from "@/components/ui/field";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Combobox } from "@/components/ui/combobox";
import { Table, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";
import { addAdmin, removeAdmin, setAdminName, setAdminRole } from "@/lib/admin/team-actions";
import type { AdminPerson } from "@/lib/admin/team";
import { ROLE_LABELS } from "@/lib/auth/roles";

/*
  THE ADMIN ACCESS SCREEN. A table of everyone who can sign in to the
  admin — their ROLE (Developer · Management · Staff, lib/auth/roles.ts),
  where the access comes from, and when they last signed in — then, folded
  below, the @geekdom.com people whose access was removed. Management and
  the Developer add (a slide-out: email, name, role), change a role and
  remove (each a confirm), and give access back; Staff read.
*/

const SOURCE: Record<AdminPerson["source"], string> = {
  settings: "hosting settings",
  domain: "@geekdom.com",
  added: "added here",
};

/** What each role is for — said once, above the list, so nobody has to ask. */
const ROLE_NOTES: [string, string][] = [
  ["Staff", "The daily work: research on applications, event and Studio requests, members' records, rooms, member resources, events and Field Notes."],
  ["Management", "Everything Staff do, plus the team's decision on applications, members' billing and complimentary time, invitations, exports, room rules, site copy, the portfolio, the photo archive, tags, and who has access."],
  ["Developer", "Same access as Management. Set in the hosting settings, so it can't be removed here."],
];

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "management", label: "Management" },
] as const;

export function TeamAccessManager({ people, canManage, me }: { people: AdminPerson[]; canManage: boolean; me: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState<{ email: string; name: string; role: "staff" | "management" }>({ email: "", name: "", role: "staff" });
  const [error, setError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<AdminPerson | null>(null);
  const [changing, setChanging] = React.useState<AdminPerson | null>(null);
  const [naming, setNaming] = React.useState<AdminPerson | null>(null);
  const [nameDraft, setNameDraft] = React.useState("");
  const nextRole = changing?.role === "management" ? "staff" : "management";

  const live = people.filter((p) => !p.removed);
  const removed = people.filter((p) => p.removed);

  function run(fn: () => Promise<{ ok: boolean; message: string }>, done: () => void) {
    // The message always belongs to the latest action.
    setNotice(null);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        done();
        setNotice(res.message);
        router.refresh();
      } else setError(res.message);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Anyone with a verified @geekdom.com address has Staff access automatically. Add someone outside Geekdom here, make someone Management, or
          switch off one @geekdom.com address without deleting it.
        </p>
        {canManage && (
          <Button
            variant="ink"
            size="sm"
            onClick={() => {
              setDraft({ email: "", name: "", role: "staff" });
              setError(null);
              setNotice(null);
              setAdding(true);
            }}
            disabled={pending}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
            Add someone
          </Button>
        )}
      </div>

      {notice && (
        <p role="status" className="border border-dashed border-border px-4 py-3 text-sm text-graphite">
          {notice}
        </p>
      )}
      {!canManage && <p className="text-[13px] text-muted-foreground">Only Management can change who has access.</p>}

      <dl className="grid gap-x-8 gap-y-3 border-y border-border py-4 text-sm md:grid-cols-3">
        {ROLE_NOTES.map(([role, note]) => (
          <div key={role}>
            <dt className="font-medium text-graphite">{role}</dt>
            <dd className="mt-0.5 text-muted-foreground">{note}</dd>
          </div>
        ))}
      </dl>

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th className="hidden w-[22%] md:table-cell">Email</Th>
            <Th className="w-64">Role</Th>
            <Th className="hidden w-36 lg:table-cell">Last signed in</Th>
            {canManage && (
              <Th className="w-56" align="right">
                <span className="sr-only">Actions</span>
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {live.map((p) => (
            <Tr key={p.email}>
              <Td className="font-medium">
                {canManage ? (
                  // The name IS the edit control — no extra button squeezing the column.
                  <button
                    type="button"
                    title="Edit name"
                    onClick={() => {
                      setError(null);
                      setNotice(null);
                      setNameDraft(p.name);
                      setNaming(p);
                    }}
                    className={cn(
                      "max-w-full truncate text-left underline decoration-transparent decoration-1 underline-offset-2 hover:decoration-clay focus-visible:decoration-clay focus-visible:outline-none",
                      !p.name && "font-normal text-muted-foreground",
                    )}
                  >
                    {p.name || p.email}
                  </button>
                ) : (
                  p.name || <span className="font-normal text-muted-foreground">{p.email}</span>
                )}
                {p.email === me && <span className="ml-2 font-normal text-muted-foreground">(you)</span>}
              </Td>
              <Td className="hidden text-muted-foreground md:table-cell">{p.email}</Td>
              <Td>
                <span className="text-graphite">{ROLE_LABELS[p.role]}</span>
                <span className="text-muted-foreground"> · {SOURCE[p.source]}</span>
              </Td>
              <Td className="hidden tabular-nums text-muted-foreground lg:table-cell">{p.lastSignIn ? tableDate(p.lastSignIn) : p.hasLogin ? "Never" : "Not yet"}</Td>
              {canManage && (
                <Td align="right">
                  <span className="inline-flex gap-4">
                    {p.role !== "developer" && p.email !== me && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setNotice(null);
                            setChanging(p);
                          }}
                          className="text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
                        >
                          {p.role === "management" ? "Make Staff" : "Make Management"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setNotice(null);
                            setRemoving(p);
                          }}
                          className="text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </span>
                </Td>
              )}
            </Tr>
          ))}
        </tbody>
      </Table>

      {removed.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-graphite">
            Access removed <span className="ml-1 tabular-nums font-normal text-muted-foreground">{removed.length}</span>
          </h2>
          <Table>
            <tbody>
              {removed.map((p) => (
                <Tr key={p.email} className="text-muted-foreground">
                  <Td>{p.email}</Td>
                  <Td className="hidden w-[40%] md:table-cell">{p.by ? `Removed by ${p.by}${p.at ? ` · ${tableDate(p.at)}` : ""}` : "Removed"}</Td>
                  {canManage && (
                    <Td className="w-40" align="right">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => addAdmin({ email: p.email, name: p.name }), () => undefined)}
                        className="text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
                      >
                        Give access back
                      </button>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        </section>
      )}

      <Drawer
        open={adding}
        onClose={() => setAdding(false)}
        title="Add someone"
        description="We email them how to sign in."
        footer={
          <>
            <Button type="submit" form="team-form" variant="ink" disabled={pending}>
              {pending ? "Adding…" : "Give access"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        <form
          id="team-form"
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => addAdmin(draft), () => setAdding(false));
          }}
        >
          <Field label="Email" htmlFor="tm-email" error={error ?? undefined} required>
            <Input id="tm-email" type="email" inputMode="email" autoComplete="off" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} data-autofocus />
          </Field>
          <Field label="Name" htmlFor="tm-name" hint="Optional — it's how they appear here until they sign in.">
            <Input id="tm-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </Field>
          <Field
            label="Role"
            htmlFor="tm-role"
            hint={draft.role === "management" ? ROLE_NOTES[1][1] : ROLE_NOTES[0][1]}
          >
            <Combobox
              id="tm-role"
              name="role"
              options={ROLE_OPTIONS}
              value={draft.role}
              onChange={(v) => setDraft((d) => ({ ...d, role: v === "management" ? "management" : "staff" }))}
              searchable={false}
            />
          </Field>
        </form>
      </Drawer>

      <Drawer
        open={Boolean(naming)}
        onClose={() => setNaming(null)}
        title={naming?.name ? "Edit name" : "Add a name"}
        description="How they appear in the admin — this list, application history and the activity log. Leave it blank to use the name on their login."
        footer={
          <>
            <Button type="submit" form="name-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : "Save name"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setNaming(null)} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        <form
          id="name-form"
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (naming) run(() => setAdminName(naming.email, nameDraft), () => setNaming(null));
          }}
        >
          <Field label="Name" htmlFor="tm-rename" hint={naming?.email} error={error ?? undefined}>
            <Input id="tm-rename" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} autoComplete="off" data-autofocus />
          </Field>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title={removing ? `Remove ${removing.name || removing.email}'s access?` : "Remove access?"}
        details={removing ? [["Email", removing.email], ["Role", ROLE_LABELS[removing.role]]] : undefined}
        confirmLabel="Remove access"
        pendingLabel="Removing…"
        keepLabel="Keep access"
        pending={pending && Boolean(removing)}
        error={error}
        onConfirm={() => removing && run(() => removeAdmin(removing.email), () => setRemoving(null))}
        onClose={() => setRemoving(null)}
      >
        They can&rsquo;t sign in to the admin after this. Nothing else of theirs changes, and you can give access back from this page.
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(changing)}
        title={changing ? `Make ${changing.name || changing.email} ${ROLE_LABELS[nextRole]}?` : "Change role?"}
        details={changing ? [["Email", changing.email], ["Now", ROLE_LABELS[changing.role]], ["After", ROLE_LABELS[nextRole]]] : undefined}
        confirmLabel={`Make ${ROLE_LABELS[nextRole]}`}
        pendingLabel="Saving…"
        keepLabel="Keep as is"
        pending={pending && Boolean(changing)}
        error={error}
        onConfirm={() => changing && run(() => setAdminRole(changing.email, nextRole), () => setChanging(null))}
        onClose={() => setChanging(null)}
      >
        {nextRole === "management" ? ROLE_NOTES[1][1] : "They keep Staff access and lose what only Management can do."} It applies on their next page load.
      </ConfirmDialog>
    </div>
  );
}

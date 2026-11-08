"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Status, Table, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";
import { addAdmin, removeAdmin } from "@/lib/admin/team-actions";
import type { AdminPerson } from "@/lib/admin/team";

/*
  THE ADMIN ACCESS SCREEN. A table of everyone who can sign in to the
  admin — where their access comes from, and when they last signed in —
  then, folded below, the @geekdom.com people whose access was removed.
  Owners (the code's "superadmin") add (a slide-out: email and name), remove (a confirm) and
  give access back; everyone else reads.
*/

const SOURCE: Record<AdminPerson["source"], string> = {
  super: "Owner",
  domain: "Staff · @geekdom.com",
  added: "Staff · added",
};

export function TeamAccessManager({ people, canManage, me }: { people: AdminPerson[]; canManage: boolean; me: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [notice, setNotice] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState({ email: "", name: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [removing, setRemoving] = React.useState<AdminPerson | null>(null);

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
          Anyone with a verified @geekdom.com address has access automatically. Add someone outside Geekdom here, or switch off one @geekdom.com address
          without deleting it. Owners are set in the hosting settings.
        </p>
        {canManage && (
          <Button
            variant="ink"
            size="sm"
            onClick={() => {
              setDraft({ email: "", name: "" });
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
      {!canManage && <p className="text-[13px] text-muted-foreground">Only owners can change who has access.</p>}

      <Table>
        <thead>
          <tr>
            <Th>Name</Th>
            <Th className="hidden w-[28%] md:table-cell">Email</Th>
            <Th className="w-52">Access</Th>
            <Th className="hidden w-36 lg:table-cell">Last signed in</Th>
            {canManage && (
              <Th className="w-24" align="right">
                <span className="sr-only">Actions</span>
              </Th>
            )}
          </tr>
        </thead>
        <tbody>
          {live.map((p) => (
            <Tr key={p.email}>
              <Td className="font-medium">
                {p.name || p.email}
                {p.email === me && <span className="ml-2 font-normal text-muted-foreground">(you)</span>}
              </Td>
              <Td className="hidden text-muted-foreground md:table-cell">{p.email}</Td>
              <Td>
                <Status kind={p.source === "super" ? "blocked" : p.source === "added" ? "info" : "done"}>{SOURCE[p.source]}</Status>
              </Td>
              <Td className="hidden tabular-nums text-muted-foreground lg:table-cell">{p.lastSignIn ? tableDate(p.lastSignIn) : p.hasLogin ? "Never" : "Not yet"}</Td>
              {canManage && (
                <Td align="right">
                  {p.source !== "super" && p.email !== me && (
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
                  )}
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
        description="They'll have the same access as Geekdom staff. We email them how to sign in."
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
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title={removing ? `Remove ${removing.name || removing.email}'s access?` : "Remove access?"}
        details={removing ? [["Email", removing.email], ["Access", SOURCE[removing.source]]] : undefined}
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
    </div>
  );
}

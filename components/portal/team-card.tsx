"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input } from "@/components/ui/field";
import { FieldGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import type { TeamActionResult } from "@/lib/portal/team-actions";

/*
  YOUR TEAM — a Team (10 seats, you included) or Enterprise membership's
  people. The card shows who's on it and the seats left; "Manage team" opens
  the slide-out to add someone (name + email → their own login and an
  invitation) or take someone off. Used on the member's Profile and, with
  staff actions passed in, on the admin's member slide-out.
*/

export interface TeamView {
  ownerName: string;
  company: string;
  /** Owner included. Null = no fixed cap. */
  seats: number | null;
  teammates: { id: string; name: string; email: string; status: string }[];
}

const CURRENT = ["active", "trialing", "past_due"];

export function TeamCard({
  team,
  add,
  remove,
  tone = "light",
}: {
  team: TeamView;
  add: (input: { name: string; email: string }) => Promise<TeamActionResult>;
  remove: (teammateId: string) => Promise<TeamActionResult>;
  /** "light" on the Profile; "plain" inside the admin's slide-out. */
  tone?: "light" | "plain";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);

  const active = team.teammates.filter((t) => CURRENT.includes(t.status));
  const used = active.length + 1; // the owner holds a seat
  const full = team.seats !== null && used >= team.seats;
  const seatsLine = team.seats === null ? `${used} ${used === 1 ? "person" : "people"}` : `${used} of ${team.seats} seats`;

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setNotice(null);
    startTransition(async () => {
      const res = await add({ name, email });
      if (res.ok) {
        setName("");
        setEmail("");
        setNotice({ ok: true, text: res.message });
        router.refresh();
      } else {
        if (res.field) setErrors({ [res.field]: res.error });
        else setNotice({ ok: false, text: res.error });
      }
    });
  }

  // The branded confirm (ConfirmDialog) — not the browser's confirm box.
  const [removing, setRemoving] = React.useState<TeamView["teammates"][number] | null>(null);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  function onRemove(t: TeamView["teammates"][number]) {
    setRemoveError(null);
    setRemoving(t);
  }
  function confirmRemove() {
    if (!removing) return;
    setNotice(null);
    startTransition(async () => {
      const res = await remove(removing.id);
      if (res.ok) {
        setRemoving(null);
        setNotice({ ok: true, text: res.message });
      } else setRemoveError(res.error ?? "Couldn't take them off the team.");
      router.refresh();
    });
  }

  const list = (
    <ul className="border-b border-border">
      <li className="flex items-center justify-between gap-4 border-t border-border py-3">
        <span className="min-w-0">
          <span className="block truncate text-graphite">{team.ownerName}</span>
          <span className="block text-sm text-muted-foreground">Holds the membership</span>
        </span>
      </li>
      {active.map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-4 border-t border-border py-3">
          <span className="min-w-0">
            <span className="block truncate text-graphite">{t.name}</span>
            <span className="block truncate text-sm text-muted-foreground">{t.email}</span>
          </span>
          {open && (
            <Button variant="ghost" size="icon" onClick={() => onRemove(t)} disabled={pending} aria-label={`Take ${t.name} off the team`}>
              <Trash2 className="h-4 w-4" strokeWidth={1.7} />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <section className={cn(tone === "light" && "border border-border bg-bone-light p-6 sm:p-7")}>
      <div className="flex items-center justify-between gap-4">
        <h2 className={cn(MONO.label, "text-muted-foreground")}>{team.company ? `${team.company} · Team` : "Your team"}</h2>
        <span className={cn(MONO.label, "tabular-nums text-graphite")}>{seatsLine}</span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {active.length
          ? "Everyone on the team has their own login and directory profile."
          : "Add the people on your team — each gets their own login and directory profile."}
      </p>
      <div className="mt-4">{!open && list}</div>
      <Button variant="ink" size="sm" className="mt-5" onClick={() => setOpen(true)}>
        Manage team
      </Button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        eyebrow={team.company || "Your team"}
        title="Manage your team"
      >
        <div className="flex flex-col gap-10">
          <div>
            <p className={cn(MONO.label, "text-muted-foreground tabular-nums")}>{seatsLine}</p>
            <div className="mt-3">{list}</div>
          </div>

          {full ? (
            <p className="border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
              All {team.seats} seats are taken. Take someone off to add someone new.
            </p>
          ) : (
            <form onSubmit={onAdd} noValidate className="flex flex-col gap-5">
              <FieldGroup title="Add a teammate">
                <Field label="Name" htmlFor="tm-name" error={errors.name} required>
                  <Input id="tm-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} data-autofocus />
                </Field>
                <Field label="Email" htmlFor="tm-email" error={errors.email} required hint="The address they'll sign in with. We'll email them how.">
                  <Input
                    id="tm-email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" variant="ink" disabled={pending} className="self-start">
                <Plus className="h-4 w-4" strokeWidth={1.8} />
                {pending ? "Adding…" : "Add to the team"}
              </Button>
            </form>
          )}

          {notice && (
            <p role={notice.ok ? "status" : "alert"} className={cn("text-sm", notice.ok ? "text-graphite" : "text-geekdom-red")}>
              {notice.text}
            </p>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title={removing ? `Take ${removing.name} off the team?` : "Take them off the team?"}
        details={removing ? [["Name", removing.name], ["Email", removing.email]] : undefined}
        confirmLabel="Take off the team"
        pendingLabel="Removing…"
        keepLabel="Keep them"
        pending={pending && Boolean(removing)}
        error={removeError}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      >
        Their access ends right away, and we&rsquo;ll email them to let them know. Their seat opens up for someone else.
      </ConfirmDialog>
    </section>
  );
}

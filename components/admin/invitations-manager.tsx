"use client";

import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import * as React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { portalInviteEmail } from "@/lib/email/member-templates";
import { INVITES_LIVE, WAVE_LIMIT } from "@/lib/invitations";
import { sendInvitations } from "@/lib/admin/invite-actions";

/*
  PICK A WAVE, SEE THE EMAIL (lib/invitations.ts).

  Left: who the wave goes to — a starting filter, then tick or untick
  people. Right: the email exactly as it renders, written to the first
  person ticked — every admin reviews it here, so there's no preview send.
  "Send to N" is locked until launch, here and (more importantly) on the
  server.
*/

export interface InviteRow {
  id: string;
  name: string;
  email: string;
  tags: string[];
  invitedAt: string | null;
  signedIn: boolean;
}

type Filter = "not-invited" | "not-signed-in" | "everyone" | `tag:${string}`;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });

export function InvitationsManager({ rows }: { rows: InviteRow[] }) {
  const tags = React.useMemo(() => [...new Set(rows.flatMap((r) => r.tags))].sort(), [rows]);
  const [filter, setFilter] = React.useState<Filter>("not-invited");
  const matching = React.useCallback(
    (f: Filter) =>
      rows.filter((r) =>
        f === "not-invited"
          ? !r.invitedAt && !r.signedIn
          : f === "not-signed-in"
            ? !r.signedIn
            : f === "everyone"
              ? true
              : r.tags.includes(f.slice(4)),
      ),
    [rows],
  );
  const shown = React.useMemo(() => matching(filter), [matching, filter]);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(matching("not-invited").map((r) => r.id)));
  // A new filter starts with everyone it matches ticked.
  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPicked(new Set(matching(f).map((r) => r.id)));
  };
  const [pending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  const chosen = shown.filter((r) => picked.has(r.id));
  const sample = chosen[0] ?? shown[0];
  const mail = React.useMemo(() => portalInviteEmail({ name: sample?.name ?? "Dana Reyes" }), [sample]);

  const toggle = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const options = [
    { value: "not-invited", label: "Not invited yet" },
    { value: "not-signed-in", label: "Haven't signed in" },
    { value: "everyone", label: "Everyone current" },
    ...tags.map((t) => ({ value: `tag:${t}`, label: `Tag: ${t}` })),
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ── Who ─────────────────────────────────────────────────────── */}
      <section className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-64">
            <Combobox id="wave" name="wave" options={options} value={filter} onChange={(v) => changeFilter(v as Filter)} searchable={false} />
          </div>
          <p className={cn(ADMIN_LABEL, "text-muted-foreground tabular-nums")}>
            {chosen.length} of {shown.length} picked
          </p>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <button type="button" className="underline underline-offset-4" onClick={() => setPicked(new Set(shown.map((r) => r.id)))}>
            Pick all
          </button>
          <button type="button" className="underline underline-offset-4" onClick={() => setPicked(new Set())}>
            Clear
          </button>
        </div>
        {shown.length === 0 ? (
          <p className="mt-4 border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">No one matches this filter.</p>
        ) : (
          <ul className="mt-4 max-h-[60svh] overflow-y-auto border-y border-border" data-lenis-prevent="">
            {shown.map((r) => (
              <li key={r.id} className="border-t border-border first:border-t-0">
                <label className="flex cursor-pointer items-center gap-3 px-1 py-3">
                  <input
                    type="checkbox"
                    checked={picked.has(r.id)}
                    onChange={() => toggle(r.id)}
                    className="h-4 w-4 shrink-0 rounded-none border-border accent-graphite focus-visible:ring-2 focus-visible:ring-clay"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-graphite">{r.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{r.email}</span>
                  </span>
                  <span className={cn(ADMIN_LABEL, "shrink-0 text-muted-foreground")}>
                    {r.signedIn ? "Signed in" : r.invitedAt ? `Invited ${fmt(r.invitedAt)}` : ""}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── The email, and sending ──────────────────────────────────── */}
      <section className="min-w-0">
        <div className="border border-border bg-bone-light">
          <div className="border-b border-border px-5 py-3">
            <p className={cn(ADMIN_LABEL, "text-muted-foreground")}>Subject</p>
            <p className="text-graphite">{mail.subject}</p>
          </div>
          {/* The real HTML, sandboxed — exactly what lands in the inbox. */}
          <iframe title="Invitation email preview" srcDoc={mail.html} sandbox="" className="h-[560px] w-full bg-bone" />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Button
            variant="outline"
            disabled={!INVITES_LIVE || pending || chosen.length === 0}
            className="self-start"
            onClick={() =>
              window.confirm(`Send the invitation to ${Math.min(chosen.length, WAVE_LIMIT)} members now?`) &&
              startTransition(async () => setResult(await sendInvitations(chosen.map((r) => r.id))))
            }
          >
            {!INVITES_LIVE && <Lock className="h-4 w-4" strokeWidth={1.8} />}
            Send to {Math.min(chosen.length, WAVE_LIMIT)} {Math.min(chosen.length, WAVE_LIMIT) === 1 ? "member" : "members"}
          </Button>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {INVITES_LIVE
              ? `Waves go out ${WAVE_LIMIT} at a time. Anyone already invited or signed in is skipped.`
              : "Locked until launch: nothing can be sent yet, and nobody on the list hears anything. The email above is exactly what they'll get."}
          </p>
          {result && (
            <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
              {result.message}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

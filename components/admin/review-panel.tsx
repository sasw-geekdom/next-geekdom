"use client";

import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import * as React from "react";
import { useRouter } from "next/navigation";
import { moveApplication, saveNotes, sendPaymentLink } from "@/lib/admin/actions";
import type { Application } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/*
  THE DECISION PANEL — only the moves that make sense for where the
  application is (lib/admin/actions.ts holds the same table and enforces it):

    Initial review   Send to team review · Decline
    Team review      Approve · Decline
    Approved         Send payment link (Solo/Team, until they pay)
    Declined/Banned  Reopen for review
    any but Banned   Ban (no email)

  Anything that EMAILS THE APPLICANT takes one confirming click, and says
  what it sends. The decision note rides with the decision into the history;
  staff notes below it are the running scratchpad.
*/

type Move = Parameters<typeof moveApplication>[1];

interface Choice {
  move: Move;
  label: string;
  hint: string;
  primary?: boolean;
  /** Emails the applicant: confirm first. */
  emails?: boolean;
}

function choicesFor(a: Application): Choice[] {
  switch (a.status) {
    case "initial_review":
      return [
        { move: "advance", label: "Yes — send to team review", hint: "Emails the team. The applicant hears nothing yet.", primary: true },
        { move: "decline", label: "No — decline", hint: "Emails the applicant a kind no.", emails: true },
      ];
    case "team_review":
      return [
        {
          move: "approve",
          label: "Yes — approve",
          hint:
            a.plan === "enterprise"
              ? "Adds them as an Enterprise member and emails a congratulations with a sign-in link."
              : "Emails a congratulations with their payment link. They become a member when they pay.",
          primary: true,
          emails: true,
        },
        { move: "decline", label: "No — decline", hint: "Emails the applicant a kind no.", emails: true },
      ];
    case "declined":
    case "banned":
      return [{ move: "reopen", label: "Reopen for initial review", hint: "Moves it back to the start. No email." }];
    default:
      return [];
  }
}

/** Decisions that end this application's turn in the queue — they move on to the next one. */
const MOVES_ON: Move[] = ["advance", "approve", "decline", "ban"];

export function ReviewPanel({
  application,
  afterHref,
}: {
  application: Application;
  /** Where a decision lands: the next application in the queue, or the list when it's the last. */
  afterHref: string;
}) {
  const router = useRouter();
  const [notes, setNotes] = React.useState(application.notes ?? "");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [confirming, setConfirming] = React.useState<Move | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    setPending(key);
    setResult(null);
    const res = await fn();
    if (res.ok && MOVES_ON.includes(key as Move)) {
      // On to the next one, saying what this decision did.
      const sep = afterHref.includes("?") ? "&" : "?";
      router.push(`${afterHref}${sep}done=${encodeURIComponent(`${application.name}: ${res.message}`)}`);
      return;
    }
    setResult(res);
    setPending(null);
    setConfirming(null);
    if (res.ok) setNote("");
    router.refresh();
  }

  const choices = choicesFor(application);
  const canBan = application.status !== "banned";
  const paymentPending = application.status === "approved" && application.plan !== "enterprise" && !application.paidAt;
  const card = "border border-border bg-bone-light p-5";

  return (
    <>
      {choices.length > 0 && (
        <section className={card}>
          <h2 className={cn(ADMIN_LABEL, "text-muted-foreground")}>
            {application.status === "initial_review" ? "Initial review" : application.status === "team_review" ? "Team review" : "Decision"}
          </h2>
          <div className="mt-3 flex flex-col gap-3">
            {choices.map((c) => {
              const confirm = c.emails && confirming !== c.move;
              return (
                <div key={c.move}>
                  <Button
                    variant={c.primary ? "ink" : "outline"}
                    size="sm"
                    disabled={pending !== null}
                    onClick={() => (confirm ? setConfirming(c.move) : run(c.move, () => moveApplication(application.id, c.move, note)))}
                    className="w-full justify-start"
                  >
                    {pending === c.move ? "Working…" : confirming === c.move ? "Confirm — this sends an email" : c.label}
                  </Button>
                  <p className="mt-1 px-1 text-xs text-muted-foreground">{c.hint}</p>
                </div>
              );
            })}
          </div>
          {confirming && (
            <button type="button" onClick={() => setConfirming(null)} className="mt-2 text-xs text-muted-foreground underline">
              Cancel
            </button>
          )}
          <Field label="Note with this decision (optional)" htmlFor="decision-note" className="mt-4">
            <Textarea
              id="decision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why — for whoever reads the history."
              className="min-h-16"
            />
          </Field>
        </section>
      )}

      {paymentPending && (
        <section className={card}>
          <h2 className={cn(ADMIN_LABEL, "text-muted-foreground")}>Payment</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {application.invitedAt
              ? "Their payment link has gone out. They become a member when they pay."
              : "No payment link has gone out yet."}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={pending !== null}
            onClick={() => run("pay", () => sendPaymentLink(application.id))}
            className="mt-3"
          >
            {pending === "pay" ? "Sending…" : application.invitedAt ? "Send a fresh payment link" : "Send payment link"}
          </Button>
        </section>
      )}

      <section className={card}>
        <Field label="Staff notes" htmlFor="staff-notes">
          <Textarea
            id="staff-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Research, context, links — for whoever picks this up next."
            className="min-h-24"
          />
        </Field>
        <Button onClick={() => run("notes", () => saveNotes(application.id, notes))} variant="outline" size="sm" disabled={pending !== null || notes === (application.notes ?? "")} className="mt-3">
          {pending === "notes" ? "Saving…" : "Save notes"}
        </Button>
      </section>

      {result && (
        <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
          {result.message}
        </p>
      )}

      {/* Rare and silent, so it's a quiet link at the foot — not a button beside Yes and No. */}
      {canBan && (
        <p className="px-1 text-xs text-muted-foreground">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() =>
              window.confirm(`Ban ${application.name}? No email is sent, and any future application from ${application.email} is marked banned automatically.`) &&
              run("ban", () => moveApplication(application.id, "ban", note))
            }
            className="text-graphite underline decoration-border underline-offset-2 hover:decoration-graphite"
          >
            {pending === "ban" ? "Banning…" : "Ban this applicant"}
          </button>{" "}
          — no email; future applications from this address are marked banned.
        </p>
      )}
    </>
  );
}

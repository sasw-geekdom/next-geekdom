"use client";

import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import * as React from "react";
import { useRouter } from "next/navigation";
import { moveApplication, sendPaymentLink } from "@/lib/admin/actions";
import type { Application } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { hasWriting, MIN_DECLINE_REASON } from "@/lib/application-research";
import { useResearch } from "@/components/admin/research-note";
import { Steps } from "@/components/admin/review-layout";

const APPLICATION_STEPS = ["Research", "Team decision", "Decided"];

/*
  THE DECISION PANEL — only the moves that make sense for where the
  application is (lib/admin/actions.ts holds the same table and enforces it):

    Research         NEXT STEP: a three-step progress line, a readiness
                     checklist (write-up, recommendation), "Send to the
                     team" (enabled once both are done; saves first), and
                     a quiet "Decline as an obvious no…" that opens a
                     REQUIRED reason before it can send
    Team review      TEAM DECISION: Approve · Decline, with a meeting note

  ONE JOB PER COLUMN (Vercel's deployment page): the centre holds the
  thing being worked on (the Write-up), this column holds what happens
  next, and the stage itself is the header's status marker — so no two
  places on the page carry the same label.
    Approved         Send payment link (Solo/Team, until they pay)
    Declined/Banned  Reopen for review
    any but Banned   Ban (no email)

  Anything that EMAILS THE APPLICANT takes one confirming click, and says
  what it sends. The decision note rides with the decision into the history.
  There's no separate staff-notes box: the old notes ARE the write-up
  (components/admin/research-note.tsx).
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
      return [{ move: "reopen", label: "Reopen for research", hint: "Moves it back to the start. No email." }];
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
  const research = useResearch();
  const inResearch = application.status === "initial_review";
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  // Each message shows BESIDE the control that caused it, not at the foot of the column.
  const [result, setResultState] = React.useState<{ ok: boolean; message: string; key: string } | null>(null);
  const setResult = (r: { ok: boolean; message: string } | null, key = "panel") => setResultState(r && { ...r, key });
  const messageFor = (...keys: string[]) =>
    result && keys.includes(result.key) ? (
      <p role={result.ok ? "status" : "alert"} className={cn("mt-3 text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
        {result.message}
      </p>
    ) : null;
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
    setResult(res, key);
    setPending(null);
    setConfirming(null);
    if (res.ok) setNote("");
    router.refresh();
  }

  // Research: what "Send to the team" needs, shown as a checklist rather than an error after the click.
  const ready = {
    writeUp: Boolean(research && hasWriting(research.doc)),
    recommendation: Boolean(research?.recommendation),
  };
  const [declining, setDeclining] = React.useState(false);

  function sendToTeam() {
    if (!ready.writeUp || !ready.recommendation) return;
    run("advance", async () => {
      if (research?.dirty) {
        const saved = await research.save();
        if (!saved.ok) return saved;
      }
      return moveApplication(application.id, "advance", note);
    });
  }

  function declineFromResearch() {
    if (note.trim().length < MIN_DECLINE_REASON) {
      setResult({ ok: false, message: "Write a reason first — a sentence the team can check later." }, "decline");
      document.getElementById("decision-note")?.focus();
      return;
    }
    run("decline", () => moveApplication(application.id, "decline", note));
  }

  function choose(c: Choice) {
    if (c.emails && confirming !== c.move) {
      setResult(null);
      setConfirming(c.move);
      return;
    }
    run(c.move, () => moveApplication(application.id, c.move, note));
  }

  const choices = choicesFor(application);
  const paymentPending = application.status === "approved" && application.plan !== "enterprise" && !application.paidAt;
  const card = "border border-border bg-bone-light p-5";
  const inTeam = application.status === "team_review";

  return (
    <>
      {inResearch && (
        <section className={card} aria-labelledby="next-step">
          <h2 id="next-step" className={cn(ADMIN_LABEL, "text-graphite")}>Next step</h2>
          <Steps steps={APPLICATION_STEPS} current={0} />
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Finish the write-up, then send it on. The team makes the decision.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm">
            <Check done={ready.writeUp}>Write-up</Check>
            <Check done={ready.recommendation}>Recommendation</Check>
          </ul>
          <Button
            variant="ink"
            size="sm"
            disabled={pending !== null || !ready.writeUp || !ready.recommendation}
            onClick={sendToTeam}
            className="mt-4 w-full justify-center"
          >
            {pending === "advance" ? "Sending…" : "Send to the team"}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">Saves the write-up first. The team gets a link; the applicant hears nothing.</p>

          <div className="mt-4 border-t border-border pt-3">
            {!declining ? (
              <button
                type="button"
                onClick={() => {
                  setDeclining(true);
                  setResult(null);
                  requestAnimationFrame(() => document.getElementById("decision-note")?.focus());
                }}
                className="text-sm text-muted-foreground underline decoration-border underline-offset-2 hover:text-graphite hover:decoration-graphite"
              >
                Decline as an obvious no…
              </button>
            ) : (
              <>
                <Field label="Why it's an obvious no" htmlFor="decision-note">
                  <Textarea
                    id="decision-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Required. Kept in the history for the team."
                    className="min-h-16"
                  />
                </Field>
                <div className="mt-3 flex items-center gap-3">
                  <Button variant="outline" size="sm" disabled={pending !== null} onClick={declineFromResearch}>
                    {pending === "decline" ? "Declining…" : "Decline and email them"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeclining(false);
                      setResult(null);
                    }}
                    className="text-sm text-muted-foreground underline underline-offset-2"
                  >
                    Cancel
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">Sends the applicant a kind no.</p>
              </>
            )}
            {messageFor("decline")}
          </div>
          {messageFor("advance")}
        </section>
      )}

      {!inResearch && choices.length > 0 && (
        <section className={card} aria-labelledby="next-step">
          <h2 id="next-step" className={cn(ADMIN_LABEL, "text-graphite")}>{inTeam ? "Team decision" : "Next step"}</h2>
          {inTeam && (
            <>
              <Steps steps={APPLICATION_STEPS} current={1} />
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Decided in the team meeting. Either answer emails the applicant.</p>
            </>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {choices.map((c) => (
              <div key={c.move}>
                <Button
                  variant={c.primary ? "ink" : "outline"}
                  size="sm"
                  disabled={pending !== null}
                  onClick={() => choose(c)}
                  className="w-full justify-start"
                >
                  {pending === c.move ? "Working…" : confirming === c.move ? "Confirm — this sends an email" : c.label}
                </Button>
                <p className="mt-1 px-1 text-xs text-muted-foreground">{c.hint}</p>
              </div>
            ))}
          </div>
          {confirming && (
            <button type="button" onClick={() => setConfirming(null)} className="mt-2 text-xs text-muted-foreground underline">
              Cancel
            </button>
          )}
          {messageFor("approve", "decline", "reopen")}
          <Field label={inTeam ? "Meeting note (optional)" : "Note (optional)"} htmlFor="decision-note" className="mt-4">
            <Textarea
              id="decision-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={inTeam ? "What the team decided and why." : "Why — for whoever reads the history."}
              className="min-h-16"
            />
          </Field>
        </section>
      )}

      {paymentPending && (
        <section className={card}>
          <h2 className={cn(ADMIN_LABEL, "text-graphite")}>Payment</h2>
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
          {messageFor("pay")}
        </section>
      )}

      {messageFor("panel")}
    </>
  );
}

/**
 * BAN — rare and silent, so a quiet link at the very FOOT of the side
 * column (after the write-up, details and history), not a button beside
 * the decision. Its own component so the page can place it last.
 */
export function BanLink({ application, afterHref }: { application: Application; afterHref: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  if (application.status === "banned") return null;

  async function ban() {
    if (!window.confirm(`Ban ${application.name}? No email is sent, and any future application from ${application.email} is marked banned automatically.`)) return;
    setPending(true);
    setError(null);
    const res = await moveApplication(application.id, "ban");
    if (res.ok) {
      const sep = afterHref.includes("?") ? "&" : "?";
      router.push(`${afterHref}${sep}done=${encodeURIComponent(`${application.name}: ${res.message}`)}`);
      return;
    }
    setError(res.message);
    setPending(false);
  }

  return (
    <div className="px-1 text-xs text-muted-foreground">
      <p>
        <button
          type="button"
          disabled={pending}
          onClick={ban}
          className="text-graphite underline decoration-border underline-offset-2 hover:decoration-graphite"
        >
          {pending ? "Banning…" : "Ban this applicant"}
        </button>{" "}
        — no email; future applications from this address are marked banned.
      </p>
      {error && (
        <p role="alert" className="mt-1 text-sm text-geekdom-red">
          {error}
        </p>
      )}
    </div>
  );
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-2", done ? "text-graphite" : "text-muted-foreground")}>
      <span
        aria-hidden="true"
        className={cn("flex h-4 w-4 items-center justify-center border text-[10px] leading-none", done ? "border-graphite bg-graphite text-bone" : "border-border")}
      >
        {done ? "✓" : ""}
      </span>
      {children}
      <span className="sr-only">{done ? " (done)" : " (not yet)"}</span>
    </li>
  );
}

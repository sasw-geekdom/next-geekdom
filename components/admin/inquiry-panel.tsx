"use client";

import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import * as React from "react";
import { useRouter } from "next/navigation";
import { moveInquiry, saveInquiryNotes } from "@/lib/admin/inquiry-actions";
import type { Inquiry } from "@/lib/admin/inquiries";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Steps } from "@/components/admin/review-layout";

/*
  THE REQUEST'S NEXT STEP — the application's pattern (review-panel.tsx),
  one step instead of two: a "New → Decided" line, one sentence on what
  happens, then yes or no, each emailing the requester (a confirming
  click, saying what it sends). Decided: "Reopen as new", quietly. Then
  the NOTES — a request's working notes (dates offered, quotes, who's
  following up). ONE place to write: the decision has no note box of its
  own (two boxes both called "note" confused a first-time admin — Jesse).
  Every message shows beside the control that caused it.
*/
const STEPS = ["New", "Decided"];

export function InquiryPanel({
  inquiry,
  accept,
  decline,
  afterHref,
  rooms,
}: {
  inquiry: Inquiry;
  /** An event's Rooms card — placed right after Next step, since a room is what follows a yes. */
  rooms?: React.ReactNode;
  /** Where a decision lands: the next request in the queue, or the list. */
  afterHref: string;
  accept: { label: string; hint: string };
  decline: { label: string; hint: string };
}) {
  const router = useRouter();
  const [notes, setNotes] = React.useState(inquiry.notes);
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState<"accept" | "decline" | null>(null);
  const [result, setResult] = React.useState<{ ok: boolean; message: string; key: string } | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    setPending(key);
    setResult(null);
    const res = await fn();
    if (res.ok && (key === "accept" || key === "decline")) {
      const sep = afterHref.includes("?") ? "&" : "?";
      router.push(`${afterHref}${sep}done=${encodeURIComponent(`${inquiry.company}: ${res.message}`)}`);
      return;
    }
    setResult({ ...res, key });
    setPending(null);
    setConfirming(null);
    router.refresh();
  }

  const messageFor = (...keys: string[]) =>
    result && keys.includes(result.key) ? (
      <p role={result.ok ? "status" : "alert"} className={cn("mt-3 text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
        {result.message}
      </p>
    ) : null;

  const choices = [
    { move: "accept" as const, ...accept, primary: true },
    { move: "decline" as const, ...decline, primary: false },
  ];
  const card = "border border-border bg-bone-light p-5";
  const decided = inquiry.status !== "new";

  return (
    <>
      <section className={card} aria-labelledby="next-step">
        <h2 id="next-step" className={cn(ADMIN_LABEL, "text-graphite")}>
          Next step
        </h2>
        <Steps steps={STEPS} current={decided ? 2 : 0} />
        {!decided ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {inquiry.kind === "event" ? "Say whether Geekdom can host it." : "Say whether it's worth a conversation."} Either answer emails {inquiry.name.split(" ")[0] || "them"}.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {choices.map((c) => (
                <div key={c.move}>
                  <Button
                    variant={c.primary ? "ink" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    disabled={pending !== null}
                    onClick={() => (confirming === c.move ? run(c.move, () => moveInquiry(inquiry.id, c.move)) : (setResult(null), setConfirming(c.move)))}
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
            {messageFor("accept", "decline")}
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {inquiry.status === "accepted"
                ? inquiry.kind === "event"
                  ? "Accepted — they've been told we'd like to host it. Plan it with them directly."
                  : "Accepted — they've been told we'd like to talk."
                : "Declined — they've had a kind no."}
            </p>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => run("reopen", () => moveInquiry(inquiry.id, "reopen"))}
              className="mt-3 text-sm text-muted-foreground underline decoration-border underline-offset-2 hover:text-graphite hover:decoration-graphite"
            >
              {pending === "reopen" ? "Reopening…" : "Reopen as new"}
            </button>
            <span className="ml-1 text-xs text-muted-foreground">— no email.</span>
            {messageFor("reopen")}
          </>
        )}
      </section>

      {rooms}

      <section className={card}>
        <Field label="Notes" htmlFor="inq-notes">
          <Textarea id="inq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24" placeholder="Dates offered, quotes, who's following up…" />
        </Field>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={pending !== null || notes === inquiry.notes}
          onClick={() => run("notes", () => saveInquiryNotes(inquiry.id, notes))}
        >
          {pending === "notes" ? "Saving…" : "Save notes"}
        </Button>
        {messageFor("notes")}
      </section>
    </>
  );
}

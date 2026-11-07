"use client";

import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import * as React from "react";
import { useRouter } from "next/navigation";
import { moveInquiry, saveInquiryNotes } from "@/lib/admin/inquiry-actions";
import type { Inquiry } from "@/lib/admin/inquiries";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/*
  THE INQUIRY DECISION — one step. New: yes or no, each emailing the
  requester (confirm first, and say what it sends). Accepted or declined:
  reopen, quietly. Staff notes below are the running scratchpad; the
  decision note goes into the history.
*/
export function InquiryPanel({
  inquiry,
  accept,
  decline,
  afterHref,
}: {
  inquiry: Inquiry;
  /** Where a decision lands: the next request in the queue, or the list. */
  afterHref: string;
  accept: { label: string; hint: string };
  decline: { label: string; hint: string };
}) {
  const router = useRouter();
  const [note, setNote] = React.useState("");
  const [notes, setNotes] = React.useState(inquiry.notes);
  const [pending, setPending] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState<"accept" | "decline" | null>(null);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  async function run(key: string, fn: () => Promise<{ ok: boolean; message: string }>) {
    setPending(key);
    setResult(null);
    const res = await fn();
    if (res.ok && (key === "accept" || key === "decline")) {
      const sep = afterHref.includes("?") ? "&" : "?";
      router.push(`${afterHref}${sep}done=${encodeURIComponent(`${inquiry.company}: ${res.message}`)}`);
      return;
    }
    setResult(res);
    setPending(null);
    setConfirming(null);
    if (res.ok) setNote("");
    router.refresh();
  }

  const choices = [
    { move: "accept" as const, ...accept, primary: true },
    { move: "decline" as const, ...decline, primary: false },
  ];

  return (
    <>
      {inquiry.status === "new" ? (
        <section className="border border-border bg-bone-light p-5">
          <h2 className={cn(ADMIN_LABEL, "text-muted-foreground")}>Decision</h2>
          <div className="mt-3 flex flex-col gap-3">
            {choices.map((c) => (
              <div key={c.move}>
                <Button
                  variant={c.primary ? "ink" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  disabled={pending !== null}
                  onClick={() => (confirming === c.move ? run(c.move, () => moveInquiry(inquiry.id, c.move, note)) : setConfirming(c.move))}
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
          <Field label="Note with this decision (optional)" htmlFor="inq-note" className="mt-4">
            <Textarea id="inq-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-16" placeholder="Why — for whoever reads the history." />
          </Field>
        </section>
      ) : (
        <section className="border border-border bg-bone-light p-5">
          <h2 className={cn(ADMIN_LABEL, "text-muted-foreground")}>Decision</h2>
          <Button variant="outline" size="sm" className="mt-3" disabled={pending !== null} onClick={() => run("reopen", () => moveInquiry(inquiry.id, "reopen"))}>
            {pending === "reopen" ? "Working…" : "Reopen as new"}
          </Button>
          <p className="mt-1 px-1 text-xs text-muted-foreground">Moves it back to New. No email.</p>
        </section>
      )}

      <section className="border border-border bg-bone-light p-5">
        <Field label="Staff notes" htmlFor="inq-notes">
          <Textarea id="inq-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24" placeholder="Dates offered, quotes, who's following up…" />
        </Field>
        <Button variant="outline" size="sm" className="mt-3" disabled={pending !== null} onClick={() => run("notes", () => saveInquiryNotes(inquiry.id, notes))}>
          {pending === "notes" ? "Saving…" : "Save notes"}
        </Button>
      </section>

      {result && (
        <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
          {result.message}
        </p>
      )}
    </>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { decideApplication, resendInvite, saveNotes } from "@/lib/admin/actions";
import type { ApplicationStatus } from "@/lib/firebase/collections";
import type { Application } from "@/lib/admin/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";

const DECISIONS: { status: ApplicationStatus; label: string; hint: string }[] = [
  {
    status: "reviewing",
    label: "Mark reviewing",
    hint: "No email is sent.",
  },
  {
    status: "approved",
    label: "Approve & invite",
    hint: "Emails a Stripe checkout link.",
  },
  {
    status: "waitlisted",
    label: "Waitlist",
    hint: "Emails a “you're on the list” note.",
  },
  {
    status: "declined",
    label: "Decline",
    hint: "Emails a kind no.",
  },
];

export function ReviewPanel({ application }: { application: Application }) {
  const router = useRouter();
  const [notes, setNotes] = React.useState(application.notes ?? "");
  const [pending, setPending] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string | null>(null);

  // Approving mails a checkout link to a real person — worth one confirmation
  // click rather than making it the same weight as "mark reviewing".
  const [confirming, setConfirming] = React.useState<ApplicationStatus | null>(
    null,
  );

  async function decide(status: ApplicationStatus) {
    setPending(status);
    setResult(null);
    const res = await decideApplication(application.id, status, notes);
    setResult(res.message);
    setPending(null);
    setConfirming(null);
    router.refresh();
  }

  async function onSaveNotes() {
    setPending("notes");
    setResult(null);
    const res = await saveNotes(application.id, notes);
    setResult(res.message);
    setPending(null);
    router.refresh();
  }

  async function onResend() {
    setPending("resend");
    setResult(null);
    const res = await resendInvite(application.id);
    setResult(res.message);
    setPending(null);
    router.refresh();
  }

  const sendsEmail = (s: ApplicationStatus) => s !== "reviewing";

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-white p-6">
      <div>
        <h2 className="text-sm font-semibold text-ink">Staff notes</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Context for whoever picks this up next…"
          className="mt-3 min-h-28"
        />
        <Button
          onClick={onSaveNotes}
          variant="outline"
          size="sm"
          disabled={pending !== null}
          className="mt-3"
        >
          {pending === "notes" ? "Saving…" : "Save notes"}
        </Button>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-ink">Decision</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Notes above are saved with the decision.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          {DECISIONS.map((d) => {
            const isCurrent = application.status === d.status;
            const needsConfirm = sendsEmail(d.status) && confirming !== d.status;

            return (
              <div key={d.status}>
                <Button
                  variant={d.status === "approved" ? "primary" : "outline"}
                  size="sm"
                  disabled={pending !== null || isCurrent}
                  onClick={() =>
                    needsConfirm ? setConfirming(d.status) : decide(d.status)
                  }
                  className="w-full justify-between"
                >
                  <span>
                    {pending === d.status
                      ? "Working…"
                      : confirming === d.status
                        ? "Confirm — this sends an email"
                        : isCurrent
                          ? `Currently ${d.status}`
                          : d.label}
                  </span>
                </Button>
                <p className="mt-1 px-1 text-xs text-muted-foreground">
                  {d.hint}
                </p>
              </div>
            );
          })}
        </div>

        {confirming && (
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="mt-3 text-xs text-muted-foreground underline"
          >
            Cancel
          </button>
        )}
      </div>

      {application.status === "approved" && (
        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-semibold text-ink">Invitation</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {application.invitedAt
              ? "An invitation has been sent. Resending mints a fresh checkout link."
              : "No invitation has gone out yet."}
          </p>
          <Button
            onClick={onResend}
            variant="outline"
            size="sm"
            disabled={pending !== null}
            className="mt-3"
          >
            {pending === "resend" ? "Sending…" : "Resend invite"}
          </Button>
        </div>
      )}

      {result && (
        <p
          role="status"
          className="rounded-lg bg-sand-deep px-3 py-2 text-sm text-ink"
        >
          {result}
        </p>
      )}
    </div>
  );
}

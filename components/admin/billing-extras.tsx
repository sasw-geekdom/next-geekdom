"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { addMailboxAction, oneOffInvoiceAction, removeMailboxAction } from "@/lib/admin/stripe-actions";

/*
  THE MEMBER SLIDE-OUT'S EXTRA BILLING (lib/stripe/extras.ts), Management
  only — Staff see the mailbox as a fact, nothing to press:

    · Mailbox   $50/month. Adding charges the rest of this month now, then
                it rides every monthly bill. A teammate's goes to the
                team's owner.
    · Invoice   a one-off, card only: lines and amounts, then charge their
                card on file now, or send it to pay in the portal.

  Each says what will happen before it happens, in one line, and reports
  what did — the same pattern as Start Club billing above it.
*/

const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const longDate = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex self-start border border-border bg-bone-light">
      {options.map(([v, text], i) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn("h-8 px-3 text-[13px] font-medium", i > 0 && "border-l border-border", value === v ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function MailboxControl({
  memberId,
  mailbox,
  teammateOf,
  canAct,
  onChanged,
}: {
  memberId: string;
  mailbox: { since: string; separate: boolean } | null;
  /** The owner's name, for a teammate — their mailbox is billed to the team. */
  teammateOf: string | null;
  canAct: boolean;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setConfirming(false);
        onChanged();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {mailbox ? (
        <span>
          {fmt(5000)}/month · since {longDate(mailbox.since)}
          {mailbox.separate && <span className="block text-[13px] text-muted-foreground">Billed on its own (their membership isn&rsquo;t billing).</span>}
        </span>
      ) : (
        <span className="text-muted-foreground">None</span>
      )}
      {canAct && !confirming && (
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setConfirming(true);
          }}
          className="self-start text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
        >
          {mailbox ? "Remove mailbox…" : `Add a mailbox — ${fmt(5000)}/month…`}
        </button>
      )}
      {confirming && (
        <div className="flex flex-col gap-3 border border-border bg-bone p-3">
          <p className="text-[13px] text-muted-foreground">
            {mailbox
              ? "It stops today and isn't billed again. The current month isn't refunded."
              : `The rest of this month is charged now, then ${fmt(5000)} with each monthly bill${teammateOf ? ` — to ${teammateOf}'s card, who pays for the team` : ""}. On their card on file.`}
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="ink" size="sm" disabled={pending} onClick={() => run(() => (mailbox ? removeMailboxAction(memberId) : addMailboxAction(memberId)))}>
              {pending ? "Saving…" : mailbox ? "Remove mailbox" : "Add mailbox"}
            </Button>
            <button type="button" onClick={() => setConfirming(false)} className="text-sm text-muted-foreground underline underline-offset-2">
              Cancel
            </button>
          </div>
        </div>
      )}
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={cn("text-[13px]", msg.ok ? "text-graphite" : "text-geekdom-red")}>
          {msg.text}
        </p>
      )}
    </div>
  );
}

const DUE = [
  { value: "7", label: "Due in 7 days" },
  { value: "14", label: "Due in 14 days" },
  { value: "30", label: "Due in 30 days" },
];

export function InvoiceComposer({ memberId, payerName, onChanged }: { memberId: string; payerName: string | null; onChanged: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [lines, setLines] = React.useState([{ description: "", amount: "" }]);
  const [mode, setMode] = React.useState<"charge" | "send">("charge");
  const [due, setDue] = React.useState("7");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const cents = (a: string) => Math.round(Number(a.replace(/[$,\s]/g, "")) * 100);
  const total = lines.reduce((sum, l) => sum + (Number.isFinite(cents(l.amount)) ? cents(l.amount) : 0), 0);

  function submit() {
    setMsg(null);
    const bad = lines.find((l) => l.description.trim().length < 2 || !(cents(l.amount) >= 50));
    if (bad) return setMsg({ ok: false, text: "Each line needs a description and an amount (at least $0.50)." });
    startTransition(async () => {
      const res = await oneOffInvoiceAction(memberId, { lines: lines.map((l) => ({ description: l.description.trim(), cents: cents(l.amount) })), mode, dueDays: Number(due) });
      setMsg({ ok: res.ok, text: res.message });
      if (res.ok) {
        setOpen(false);
        setLines([{ description: "", amount: "" }]);
        onChanged();
      }
    });
  }

  if (!open)
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setOpen(true);
          }}
          className="self-start text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
        >
          New invoice…
        </button>
        {msg && (
          <p role={msg.ok ? "status" : "alert"} className={cn("text-[13px]", msg.ok ? "text-graphite" : "text-geekdom-red")}>
            {msg.text}
          </p>
        )}
      </div>
    );

  return (
    <div className="flex flex-col gap-3 border border-border bg-bone p-3">
      <p className="text-[13px] text-muted-foreground">
        A one-off charge — a company event in the space, say. Card only{payerName ? `, billed to ${payerName}, who pays for the team` : ""}.
      </p>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_6.5rem_2rem] gap-2">
          <Input
            aria-label={`Line ${i + 1} — what it's for`}
            placeholder="Event space · December 12"
            value={l.description}
            maxLength={200}
            onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
            className="h-9"
          />
          <Input
            aria-label={`Line ${i + 1} — amount in dollars`}
            placeholder="$0"
            inputMode="decimal"
            value={l.amount}
            onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/[^\d.,$]/g, "") } : x)))}
            className="h-9 tabular-nums"
          />
          {lines.length > 1 ? (
            <button type="button" aria-label={`Remove line ${i + 1}`} onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="inline-flex h-9 w-8 items-center justify-center text-muted-foreground hover:text-graphite">
              <X className="h-4 w-4" strokeWidth={1.7} />
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {lines.length < 10 && (
        <button type="button" onClick={() => setLines((ls) => [...ls, { description: "", amount: "" }])} className="inline-flex items-center gap-1.5 self-start text-[13px] text-graphite">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
          Add a line
        </button>
      )}
      <Segmented
        label="How it's paid"
        value={mode}
        options={[
          ["charge", "Charge their card now"],
          ["send", "Send it to pay"],
        ]}
        onChange={setMode}
      />
      {mode === "send" && (
        <div className="flex flex-wrap items-center gap-3">
          <Combobox name="due" label="When it's due" options={DUE} value={due} onChange={setDue} searchable={false} className="w-44" />
          <span className="text-[13px] text-muted-foreground">We email them; they pay by card with Pay now in the portal.</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
        <Button type="button" variant="ink" size="sm" disabled={pending || total < 50} onClick={submit}>
          {pending ? "Working…" : mode === "charge" ? `Charge ${total ? fmt(total) : ""}`.trim() : `Send ${total ? fmt(total) : ""} invoice`.replace("  ", " ")}
        </Button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted-foreground underline underline-offset-2">
          Cancel
        </button>
      </div>
      {msg && (
        <p role="alert" className="text-[13px] text-geekdom-red">
          {msg.text}
        </p>
      )}
    </div>
  );
}

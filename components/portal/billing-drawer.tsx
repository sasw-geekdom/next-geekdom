"use client";

import * as React from "react";
import { AlertTriangle, ArrowUpRight, CreditCard, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { HEADING, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  BILLING, IN THE APP — the slide-out "Manage billing" opens. A DESIGN MOCK:
  no Stripe calls, sample data, and a sample-only state switch so every case
  can be reviewed (Active · Past due · Canceling).

  Decided: members manage ALL billing here and never see Stripe's hosted
  portal. The real build (needs sk_test_/pk_test_ keys) wires each part to
  Stripe:
    · Update card   → Stripe's Payment Element in this drawer + a
                      SetupIntent; card numbers go browser → Stripe, never
                      through Geekdom's servers. Styled to the brand
                      (Rubik, square corners) via Stripe's Appearance API.
    · Invoices      → invoices.list; each row links Stripe's PDF/receipt.
    · Pay now       → invoices.pay on the saved card (past due).
    · Cancel/resume → subscription cancel_at_period_end true/false; the
                      webhook syncs the member record.

  THE CARD FIELDS HERE ARE A PICTURE OF THE FORM, NOT A FORM. They're
  read-only on purpose: a mock that accepted typing would invite someone to
  enter a real card number into fields that aren't Stripe's. In production
  the same spot holds Stripe's Payment Element — real, typeable fields that
  Stripe renders inside this drawer — and members update their card here.
*/

type State = "active" | "past_due" | "canceling";
type Panel = "overview" | "card" | "cancel";

export interface BillingMock {
  price: string; // "$100/month"
  amount: string; // "$100"
  nextPayment: string; // formatted
  card: { brand: string; last4: string; exp: string };
  invoices: { id: string; number: string; date: string; status: "paid" }[];
}

function dateLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}

export function ManageBillingButton({ mock, size = "sm" }: { mock: BillingMock; size?: "sm" | "md" }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button type="button" variant="ink" size={size} onClick={() => setOpen(true)}>
        Manage billing
      </Button>
      <BillingDrawer open={open} onClose={() => setOpen(false)} mock={mock} />
    </>
  );
}

function BillingDrawer({ open, onClose, mock }: { open: boolean; onClose: () => void; mock: BillingMock }) {
  const [state, setState] = React.useState<State>("active");
  const [panel, setPanel] = React.useState<Panel>("overview");
  const [card, setCard] = React.useState(mock.card);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [paidOpen, setPaidOpen] = React.useState(false);

  // The past-due case has one open invoice on top of the history.
  const invoices =
    state === "past_due" && !paidOpen
      ? [{ id: "in_7", number: "GKDM-0007", date: "2026-11-22T18:00:00.000Z", status: "open" as const }, ...mock.invoices]
      : paidOpen
        ? [{ id: "in_7", number: "GKDM-0007", date: "2026-11-22T18:00:00.000Z", status: "paid" as const }, ...mock.invoices]
        : mock.invoices;

  function go(p: Panel) {
    setNotice(null);
    setPanel(p);
  }

  const footer =
    panel === "card" ? (
      <>
        <Button
          type="button"
          variant="ink"
          onClick={() => {
            setCard({ brand: "Mastercard", last4: "4444", exp: "11/29" });
            setPanel("overview");
            if (state === "past_due" && !paidOpen) {
              setPaidOpen(true);
              setState("active");
              setNotice(`Card updated. Your ${mock.amount} payment went through — you're all set.`);
            } else {
              setNotice("Card updated. Future payments use the new card.");
            }
          }}
        >
          Save card
        </Button>
        <Button type="button" variant="ghost" onClick={() => go("overview")}>
          Back
        </Button>
      </>
    ) : panel === "cancel" ? (
      <>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setState("canceling");
            setPanel("overview");
            setNotice(`Your membership will end on ${mock.nextPayment}. You keep full access until then.`);
          }}
        >
          Cancel at end of period
        </Button>
        <Button type="button" variant="ink" onClick={() => go("overview")}>
          Keep my membership
        </Button>
      </>
    ) : (
      <Button type="button" variant="ghost" onClick={onClose}>
        Done
      </Button>
    );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="Billing"
      title={panel === "card" ? "Update your card" : panel === "cancel" ? "Cancel membership" : "Manage billing"}
      footer={footer}
    >
      <div className="flex flex-col gap-8">
        {/* Sample-only: flip through the states for design review. */}
        <div className="flex flex-wrap items-center gap-3 border border-dashed border-border px-3 py-2.5">
          <span className={cn(MONO.label, "text-graphite")}>Sample state</span>
          <div role="radiogroup" aria-label="Sample billing state" className="flex">
            {(["active", "past_due", "canceling"] as State[]).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={state === s}
                onClick={() => {
                  setState(s);
                  setPaidOpen(false);
                  setPanel("overview");
                  setNotice(null);
                }}
                className={cn(
                  "-ml-px border px-2.5 py-1 text-xs first:ml-0",
                  state === s ? "relative z-10 border-graphite bg-graphite text-bone" : "border-border text-graphite hover:border-graphite",
                )}
              >
                {s === "active" ? "Active" : s === "past_due" ? "Past due" : "Canceling"}
              </button>
            ))}
          </div>
        </div>

        {notice && (
          <p role="status" className="border-l-2 border-clay bg-bone-light px-4 py-3 text-sm text-graphite">
            {notice}
          </p>
        )}

        {panel === "overview" && (
          <>
            {state === "past_due" && (
              <div role="alert" className="flex gap-3 border border-geekdom-red/40 bg-bone-light p-4">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-geekdom-red" strokeWidth={1.7} />
                <div>
                  <p className="font-medium text-graphite">Your last payment didn&rsquo;t go through.</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {card.brand} •••• {card.last4} was declined for {mock.amount}. Update your card or try it again —
                    your access continues while you sort it out.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ink"
                      size="sm"
                      onClick={() => {
                        setPaidOpen(true);
                        setState("active");
                        setNotice(`Paid ${mock.amount} with ${card.brand} •••• ${card.last4}. Thanks — you're all set.`);
                      }}
                    >
                      Pay {mock.amount} with •••• {card.last4}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => go("card")}>
                      Use a different card
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <FieldGroup title="Plan">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn(HEADING.item, "text-graphite")}>Club membership</p>
                  <p className="mt-1 tabular-nums text-muted-foreground">{mock.price}</p>
                </div>
                <p className="text-right text-sm">
                  <span className="block text-muted-foreground">
                    {state === "canceling" ? "Ends" : state === "past_due" ? "Payment due" : "Next payment"}
                  </span>
                  <span className="tabular-nums text-graphite">{mock.nextPayment}</span>
                </p>
              </div>
              {state === "canceling" ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bone-light p-4">
                  <p className="text-sm text-graphite">
                    Your membership ends on {mock.nextPayment}. You won&rsquo;t be charged again.
                  </p>
                  <Button
                    type="button"
                    variant="ink"
                    size="sm"
                    onClick={() => {
                      setState("active");
                      setNotice("Welcome back — your membership continues.");
                    }}
                  >
                    Keep my membership
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Billed monthly, automatically, to the card below.</p>
              )}
            </FieldGroup>

            <FieldGroup title="Payment method">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-9 w-12 items-center justify-center border border-border bg-bone">
                    <CreditCard className="h-4 w-4 text-graphite" strokeWidth={1.6} />
                  </span>
                  <span>
                    <span className="block tabular-nums text-graphite">
                      {card.brand} •••• {card.last4}
                    </span>
                    <span className="block text-sm tabular-nums text-muted-foreground">Expires {card.exp}</span>
                  </span>
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => go("card")}>
                  Update card
                </Button>
              </div>
            </FieldGroup>

            <FieldGroup title="Invoices and receipts">
              <ul className="-mt-2 border-b border-border">
                {invoices.map((inv) => (
                  <li key={inv.id} className="grid grid-cols-[1fr_4.5rem_9.5rem] items-center gap-4 border-t border-border py-3 first:border-t-0">
                    <span>
                      <span className="block tabular-nums text-graphite">{dateLabel(inv.date)}</span>
                      <span className={cn(MONO.micro, "text-muted-foreground")}>{inv.number}</span>
                    </span>
                    <span className="text-right">
                      <span className="block tabular-nums text-graphite">{mock.amount}</span>
                      <span className={cn(MONO.micro, inv.status === "open" ? "text-geekdom-red" : "text-muted-foreground")}>
                        {inv.status === "open" ? "Unpaid" : "Paid"}
                      </span>
                    </span>
                    <span className="flex justify-end gap-1">
                      <span
                        aria-disabled="true"
                        title="Stripe's PDF — opens the official file (sample)"
                        className="inline-flex h-8 items-center gap-1.5 border border-border px-2 text-xs text-graphite"
                      >
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.6} />
                        PDF
                      </span>
                      {inv.status === "paid" && (
                        <span
                          aria-disabled="true"
                          title="Stripe's receipt (sample)"
                          className="inline-flex h-8 items-center gap-1 border border-border px-2 text-xs text-graphite"
                        >
                          Receipt
                          <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </FieldGroup>

            {state !== "canceling" && (
              <div className="border-t border-border pt-6">
                <button
                  type="button"
                  onClick={() => go("cancel")}
                  className="text-sm text-muted-foreground underline decoration-border underline-offset-4 hover:text-graphite hover:decoration-graphite"
                >
                  Cancel membership
                </button>
              </div>
            )}
          </>
        )}

        {panel === "card" && (
          <>
            <p className="leading-relaxed text-muted-foreground">
              Your new card replaces {card.brand} •••• {card.last4} for every payment from now on.
              {state === "past_due" && !paidOpen && ` Saving it also retries your unpaid ${mock.amount}.`}
            </p>
            {/*
              A PICTURE of Stripe's Payment Element as it will be styled here
              (Rubik, square, Bone fields). Read-only — see the note above.
            */}
            <div aria-label="Card form preview" className="flex flex-col gap-3">
              <MockField label="Card number" value="1234 1234 1234 1234" />
              <div className="grid grid-cols-2 gap-3">
                <MockField label="Expiration" value="MM / YY" />
                <MockField label="Security code" value="CVC" />
              </div>
              <MockField label="ZIP" value="78205" />
            </div>
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
              Card details go straight to Stripe, our payment processor. Geekdom never sees or stores your card number.
            </p>
            <p className="border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              Sample — these fields are a picture of the form. The real ones are Stripe&rsquo;s secure fields. Pressing
              Save shows what happens next.
            </p>
          </>
        )}

        {panel === "cancel" && (
          <>
            <p className={cn(HEADING.item, "text-graphite")}>We&rsquo;re sorry to see you go.</p>
            <ul className="flex flex-col gap-2 leading-relaxed text-muted-foreground">
              <li>· Your membership stays active until <span className="text-graphite">{mock.nextPayment}</span>.</li>
              <li>· You won&rsquo;t be charged again.</li>
              <li>· You can change your mind any time before then, right here.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Questions before you go? Email club@geekdom.com.
            </p>
          </>
        )}
      </div>
    </Drawer>
  );
}

function MockField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm text-graphite">{label}</p>
      <div className="flex h-11 items-center border border-border bg-bone-light px-3.5 text-base text-muted-foreground" aria-readonly="true">
        {value}
      </div>
    </div>
  );
}

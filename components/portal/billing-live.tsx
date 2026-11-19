"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertTriangle, ArrowUpRight, CreditCard, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { HEADING, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { finishCardUpdate, payNow, setCancelAtPeriodEnd, startCardUpdate } from "@/lib/stripe/billing-actions";
import type { BillingView } from "@/lib/stripe/billing";

/*
  BILLING, IN THE APP — LIVE (the design mock it replaces is billing-drawer.tsx,
  still used for staff previews and copies without Stripe). Members manage
  all billing here; they never see Stripe's hosted pages (Geekdom's call).

    · Update card    Stripe's Payment Element INSIDE this drawer, confirming
                     a SetupIntent — card numbers go browser → Stripe, never
                     through Geekdom's servers. Styled to the brand: Rubik,
                     square corners, Bone fields, Graphite text.
    · Invoices       Stripe's own PDF and hosted receipt for each.
    · Pay now        past due: retries what's owed on the card on file.
    · Cancel/resume  cancel at the end of the paid period, or undo it.

  Every action is a server action that resolves the member from the
  session (lib/stripe/billing-actions.ts); the page re-reads Stripe after.
*/

let stripePromise: Promise<StripeJs | null> | null = null;
const getStripeJs = () => (stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""));

/** The Payment Element in the brand: square, Rubik, Bone fields, Graphite type, Clay focus. */
const APPEARANCE = {
  theme: "flat" as const,
  variables: {
    fontFamily: "Rubik, system-ui, sans-serif",
    fontSizeBase: "16px",
    borderRadius: "0px",
    colorPrimary: "#1b1b1b",
    colorBackground: "#faf8f3",
    colorText: "#1b1b1b",
    colorTextSecondary: "#6b6b6b",
    colorTextPlaceholder: "#6b6b6b",
    colorDanger: "#ca3625",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": { border: "1px solid #d9d3c5", boxShadow: "none", padding: "12px 14px" },
    ".Input:focus": { border: "1px solid #1b1b1b", boxShadow: "0 0 0 2px #c8623d" },
    ".Label": { fontWeight: "400", color: "#1b1b1b", marginBottom: "6px" },
    ".Tab": { border: "1px solid #d9d3c5" },
  },
};
const FONTS = [{ cssSrc: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500&display=swap" }];

type Panel = "overview" | "card" | "cancel";

const longDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(new Date(iso)) : "—";
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));

export function LiveBillingButton({ billing, planName }: { billing: BillingView; planName: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button type="button" variant="ink" size="sm" onClick={() => setOpen(true)}>
        Manage billing
      </Button>
      <LiveBillingDrawer open={open} onClose={() => setOpen(false)} billing={billing} planName={planName} />
    </>
  );
}

function LiveBillingDrawer({ open, onClose, billing, planName }: { open: boolean; onClose: () => void; billing: BillingView; planName: string }) {
  const router = useRouter();
  const [panel, setPanel] = React.useState<Panel>("overview");
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);

  const b = billing;
  const pastDue = b.state === "past_due";
  const canceling = b.state === "canceling";

  function go(p: Panel) {
    setNotice(null);
    setPanel(p);
    if (p === "card") {
      setClientSecret(null);
      startTransition(async () => {
        const res = await startCardUpdate();
        if (res.ok && res.clientSecret) setClientSecret(res.clientSecret);
        else setNotice({ ok: false, text: res.message || "Couldn't open the card form. Try again." });
      });
    }
  }

  function act(fn: () => Promise<{ ok: boolean; message: string }>, after: Panel = "overview") {
    setNotice(null);
    startTransition(async () => {
      const res = await fn();
      setNotice({ ok: res.ok, text: res.message });
      if (res.ok) setPanel(after);
      router.refresh();
    });
  }

  const footer =
    panel === "cancel" ? (
      <>
        <Button type="button" variant="outline" disabled={pending} onClick={() => act(() => setCancelAtPeriodEnd(true))}>
          {pending ? "Working…" : "Cancel at end of period"}
        </Button>
        <Button type="button" variant="ink" disabled={pending} onClick={() => go("overview")}>
          Keep my membership
        </Button>
      </>
    ) : panel === "card" ? (
      <>
        <Button type="submit" form="card-form" variant="ink" disabled={pending || !clientSecret}>
          {pending ? "Saving…" : pastDue && b.open ? `Save card and pay ${b.open.amount}` : "Save card"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={() => go("overview")}>
          Back
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
        {notice && (
          <p
            role={notice.ok ? "status" : "alert"}
            className={cn("border-l-2 bg-bone-light px-4 py-3 text-sm", notice.ok ? "border-clay text-graphite" : "border-geekdom-red text-geekdom-red")}
          >
            {notice.text}
          </p>
        )}

        {panel === "overview" && (
          <>
            {pastDue && b.open && (
              <div role="alert" className="flex gap-3 border border-geekdom-red/40 bg-bone-light p-4">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-geekdom-red" strokeWidth={1.7} />
                <div>
                  <p className="font-medium text-graphite">Your last payment didn&rsquo;t go through.</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {b.open.amount} is due{b.card ? ` — ${b.card.brand} •••• ${b.card.last4} was declined` : ""}. Update your card or try it again; your access continues while you sort it out.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {b.card && (
                      <Button type="button" variant="ink" size="sm" disabled={pending} onClick={() => act(payNow)}>
                        {pending ? "Paying…" : `Pay ${b.open.amount} with •••• ${b.card.last4}`}
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => go("card")}>
                      Use a different card
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <FieldGroup title="Plan">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn(HEADING.item, "text-graphite")}>Club membership · {planName}</p>
                  <p className="mt-1 tabular-nums text-muted-foreground">{b.price}</p>
                </div>
                <p className="text-right text-sm">
                  <span className="block text-muted-foreground">{canceling ? "Ends" : pastDue ? "Payment due" : b.state === "canceled" ? "Ended" : "Next payment"}</span>
                  <span className="tabular-nums text-graphite">{longDate(b.periodEnd)}</span>
                </p>
              </div>
              {canceling ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bone-light p-4">
                  <p className="text-sm text-graphite">Your membership ends on {longDate(b.periodEnd)}. You won&rsquo;t be charged again.</p>
                  <Button type="button" variant="ink" size="sm" disabled={pending} onClick={() => act(() => setCancelAtPeriodEnd(false))}>
                    {pending ? "Working…" : "Keep my membership"}
                  </Button>
                </div>
              ) : b.state !== "canceled" ? (
                <p className="text-sm text-muted-foreground">Billed monthly, automatically, to the card below.</p>
              ) : null}
            </FieldGroup>

            <FieldGroup title="Payment method">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-3">
                  <span aria-hidden="true" className="flex h-9 w-12 items-center justify-center border border-border bg-bone">
                    <CreditCard className="h-4 w-4 text-graphite" strokeWidth={1.6} />
                  </span>
                  {b.card ? (
                    <span>
                      <span className="block tabular-nums text-graphite">
                        {b.card.brand} •••• {b.card.last4}
                      </span>
                      <span className="block text-sm tabular-nums text-muted-foreground">Expires {b.card.exp}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No card on file</span>
                  )}
                </span>
                {b.state !== "canceled" && (
                  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => go("card")}>
                    {b.card ? "Update card" : "Add a card"}
                  </Button>
                )}
              </div>
            </FieldGroup>

            <FieldGroup title="Invoices and receipts">
              {b.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <ul className="-mt-2 border-b border-border">
                  {b.invoices.map((inv) => (
                    <li key={inv.id} className="grid grid-cols-[1fr_5rem_9.5rem] items-center gap-4 border-t border-border py-3 first:border-t-0">
                      <span>
                        <span className="block tabular-nums text-graphite">{shortDate(inv.date)}</span>
                        <span className={cn(MONO.micro, "text-muted-foreground")}>{inv.number}</span>
                      </span>
                      <span className="text-right">
                        <span className="block tabular-nums text-graphite">{inv.amount}</span>
                        <span className={cn(MONO.micro, inv.status === "open" ? "text-geekdom-red" : "text-muted-foreground")}>
                          {inv.status === "paid" ? "Paid" : inv.status === "open" ? "Unpaid" : inv.status === "void" ? "Void" : "Unpaid"}
                        </span>
                      </span>
                      <span className="flex justify-end gap-1">
                        {inv.pdf && (
                          <a href={inv.pdf} target="_blank" rel="noreferrer noopener" className="inline-flex h-8 items-center gap-1.5 border border-border px-2 text-xs text-graphite hover:border-graphite">
                            <FileText className="h-3.5 w-3.5" strokeWidth={1.6} />
                            PDF
                          </a>
                        )}
                        {inv.hosted && inv.status === "paid" && (
                          <a href={inv.hosted} target="_blank" rel="noreferrer noopener" className="inline-flex h-8 items-center gap-1 border border-border px-2 text-xs text-graphite hover:border-graphite">
                            Receipt
                            <ArrowUpRight className="h-3 w-3" strokeWidth={1.6} />
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </FieldGroup>

            {b.state === "active" && (
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
              {b.card ? `Your new card replaces ${b.card.brand} •••• ${b.card.last4} for every payment from now on.` : "This card is used for every payment from now on."}
              {pastDue && b.open && ` Saving it also pays the ${b.open.amount} that's due.`}
            </p>
            {clientSecret ? (
              <Elements stripe={getStripeJs()} options={{ clientSecret, appearance: APPEARANCE, fonts: FONTS }}>
                <CardForm
                  onDone={(setupIntentId) => act(() => finishCardUpdate(setupIntentId))}
                  onError={(text) => setNotice({ ok: false, text })}
                />
              </Elements>
            ) : (
              <p className="border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Loading the secure card form…</p>
            )}
            <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.6} />
              Card details go straight to Stripe, our payment processor. Geekdom never sees or stores your card number.
            </p>
          </>
        )}

        {panel === "cancel" && (
          <>
            <p className={cn(HEADING.item, "text-graphite")}>We&rsquo;re sorry to see you go.</p>
            <ul className="flex flex-col gap-2 leading-relaxed text-muted-foreground">
              <li>· Your membership stays active until <span className="text-graphite">{longDate(b.periodEnd)}</span>.</li>
              <li>· You won&rsquo;t be charged again.</li>
              <li>· You can change your mind any time before then, right here.</li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">Questions before you go? Email club@geekdom.com.</p>
          </>
        )}
      </div>
    </Drawer>
  );
}

/** Stripe's card fields. Confirms the SetupIntent in the browser, then hands its id to the server. */
function CardForm({ onDone, onError }: { onDone: (setupIntentId: string) => void; onError: (text: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    const { error, setupIntent } = await stripe.confirmSetup({ elements, redirect: "if_required" });
    setBusy(false);
    if (error) return onError(error.message ?? "That card couldn't be saved.");
    if (setupIntent?.status === "succeeded" && setupIntent.id) onDone(setupIntent.id);
    else onError("That card needs another step. Try again.");
  }

  return (
    <form id="card-form" onSubmit={submit}>
      {/* Card only, in Geekdom's form: no wallets, and no Stripe "Link" — its green
          banner, "save my information" box and "Bank · $5 back" tab were off-brand
          and would sign members up for a separate Stripe account. */}
      <PaymentElement options={{ layout: "tabs", wallets: { applePay: "never", googlePay: "never", link: "never" } }} />
    </form>
  );
}

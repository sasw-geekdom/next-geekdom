"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertTriangle, ArrowUpRight, CreditCard, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { HEADING } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { finishCardUpdate, payNow, setCancelAtPeriodEnd, startCardUpdate } from "@/lib/stripe/billing-actions";
import type { BillingView } from "@/lib/stripe/billing";
import { ExitSurvey, type ExitAnswer } from "@/components/portal/exit-survey";
import { InvoiceRow, dayOf, invoiceMark, invoiceWhen, monthOf, shortDate } from "@/components/portal/invoice-row";

/*
  BILLING, IN THE APP — LIVE (the design mock it replaces is billing-drawer.tsx,
  still used for staff previews and copies without Stripe). Members manage
  all billing here; they never see Stripe's hosted pages (Geekdom's call).

    · Update card    Stripe's Payment Element INSIDE this drawer, confirming
                     a SetupIntent — card numbers go browser → Stripe, never
                     through Geekdom's servers. Styled to the brand: Rubik,
                     square corners, Bone fields, Graphite text.
    · Invoices       Upcoming (Stripe's preview of the next bill), then each
                     invoice named by its month, marked Paid / Due / Void,
                     with Stripe's PDF and receipt; Pay now sits on the
                     Due one.
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

/** Past invoices shown before "Show earlier invoices" — anything Due always shows. */
const RECENT = 3;

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
  const [exit, setExit] = React.useState<ExitAnswer>({ reason: null, note: "" });
  const [notice, setNotice] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [allInvoices, setAllInvoices] = React.useState(false);

  const b = billing;
  // Not an endless list: Upcoming, anything Due, and the latest RECENT; the
  // rest (up to two years) fold behind one button.
  const shownInvoices = allInvoices ? b.invoices : b.invoices.filter((inv, i) => i < RECENT || inv.status === "open");
  const folded = b.invoices.length - shownInvoices.length;
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
        <Button type="button" variant="outline" disabled={pending} onClick={() => act(() => setCancelAtPeriodEnd(true, exit))}>
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
                    {b.open.amount} is due{b.card ? ` — ${b.card.brand} •••• ${b.card.last4} was declined` : ""}. {b.card ? "Pay it again from the invoice below, or use a different card" : "Add a card to pay it"}; your access continues while you sort it out.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => go("card")}>
                      {b.card ? "Use a different card" : "Add a card"}
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
              {b.invoices.length === 0 && !b.upcoming ? (
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
              ) : (
                <ul className="-mt-2 border-b border-border">
                  {b.upcoming && (
                    <InvoiceRow
                      title={b.upcoming.kind === "resumes" ? `Complimentary until ${shortDate(b.upcoming.date)}` : monthOf(b.upcoming.periodStart)}
                      mark="upcoming"
                      detail={
                        b.upcoming.kind === "resumes"
                          ? `Club membership · ${planName} · billing resumes`
                          : `Club membership · ${planName}${b.upcoming.periodEnd ? ` · ${dayOf(b.upcoming.periodStart)} – ${dayOf(b.upcoming.periodEnd)}` : ""}`
                      }
                      amount={b.upcoming.amount}
                      when={`Charged ${shortDate(b.upcoming.date)}${b.card ? ` to •••• ${b.card.last4}` : ""}`}
                    />
                  )}
                  {shownInvoices.map((inv) => {
                    const mark = invoiceMark(inv.status);
                    const payHere = inv.status === "open" && b.open?.id === inv.id && b.card;
                    return (
                      <InvoiceRow
                        key={inv.id}
                        title={monthOf(inv.periodStart)}
                        mark={mark}
                        detail={`Club membership · ${planName}${inv.number ? ` · ${inv.number}` : ""}`}
                        amount={inv.amount}
                        when={invoiceWhen(inv, mark)}
                      >
                        {payHere && (
                          <Button type="button" variant="ink" size="sm" disabled={pending} onClick={() => act(payNow)}>
                            {pending ? "Paying…" : `Pay ${inv.amount} now`}
                          </Button>
                        )}
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
                      </InvoiceRow>
                    );
                  })}
                </ul>
              )}
              {folded > 0 ? (
                <button type="button" onClick={() => setAllInvoices(true)} className="self-start text-sm text-graphite underline decoration-clay decoration-1 underline-offset-4">
                  Show {folded} earlier {folded === 1 ? "invoice" : "invoices"}
                </button>
              ) : allInvoices && b.invoices.length > RECENT ? (
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <button type="button" onClick={() => setAllInvoices(false)} className="text-graphite underline decoration-clay decoration-1 underline-offset-4">
                    Show fewer
                  </button>
                  {b.olderInvoices && <span>Need one from before {monthOf(b.invoices[b.invoices.length - 1].periodStart)}? Email club@geekdom.com.</span>}
                </p>
              ) : null}
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
            <ExitSurvey value={exit} onChange={setExit} />
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

/**
 * ADD A CARD, inline — the welcome flow's billing step. The same SetupIntent
 * path as the drawer (card numbers go browser → Stripe), with its own Save
 * button. Creates the member's Stripe customer if they have none.
 */
export function CardSetup({ onSaved }: { onSaved: (message: string) => void }) {
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    startCardUpdate().then((res) => {
      if (!live) return;
      if (res.ok && res.clientSecret) setClientSecret(res.clientSecret);
      else setError(res.message || "Couldn't open the card form. Try again.");
    });
    return () => {
      live = false;
    };
  }, []);

  if (error && !clientSecret) return <p role="alert" className="text-sm text-geekdom-red">{error}</p>;
  if (!clientSecret) return <p className="border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Loading the secure card form…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Elements stripe={getStripeJs()} options={{ clientSecret, appearance: APPEARANCE, fonts: FONTS }}>
        <CardForm
          onDone={async (id) => {
            setSaving(true);
            const res = await finishCardUpdate(id);
            setSaving(false);
            if (res.ok) onSaved(res.message);
            else setError(res.message);
          }}
          onError={setError}
        />
      </Elements>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" form="card-form" variant="ink" disabled={saving}>
          {saving ? "Saving…" : "Save card"}
        </Button>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.6} />
          Goes straight to Stripe. Geekdom never sees your card number.
        </span>
      </div>
      {error && <p role="alert" className="text-sm text-geekdom-red">{error}</p>}
    </div>
  );
}

/** The profile's billing panel for a member with nothing on Stripe yet: one button, then the card form. */
export function AddCardPanel() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saved, setSaved] = React.useState<string | null>(null);
  if (saved) return <p role="status" className="text-sm text-graphite">{saved} The Club team will start your Club billing and let you know first.</p>;
  return open ? (
    <CardSetup
      onSaved={(m) => {
        setSaved(m);
        router.refresh();
      }}
    />
  ) : (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted-foreground">No card on file yet. Saving one doesn&rsquo;t charge anything — the Club team starts your billing and lets you know first.</p>
      <Button type="button" variant="ink" size="sm" className="self-start" onClick={() => setOpen(true)}>
        Add a card
      </Button>
    </div>
  );
}

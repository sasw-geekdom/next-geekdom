import "server-only";

import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { env } from "@/lib/env";
import type { MemberDoc } from "@/lib/firebase/collections";

/*
  A MEMBER'S BILLING, READ FROM STRIPE — what the portal's billing panel and
  drawer show (components/portal/billing-live.tsx). Plain, serializable
  shapes only: this crosses into a client component.

  Read on every visit, uncached: it's one member's money, and a stale
  "past due" after they've paid would be worse than a slower page.

  Stripe is the source of truth for the card, the invoices and what's owed;
  the members doc mirrors status and dates (the webhook keeps it in step).
*/

export interface BillingCard {
  brand: string; // "Visa"
  last4: string;
  exp: string; // "08/28"
}

export interface BillingInvoice {
  id: string;
  number: string;
  date: string; // ISO
  amount: string; // "$100"
  status: "paid" | "open" | "void" | "uncollectible" | "draft";
  /** Stripe's PDF of the invoice. */
  pdf: string | null;
  /** Stripe's hosted invoice page — the receipt once paid. */
  hosted: string | null;
}

export interface BillingView {
  /** "active" | "past_due" | "canceling" (cancel at period end) | "canceled" | "none". */
  state: "active" | "past_due" | "canceling" | "canceled" | "none";
  /** "$100/month", from the subscription's own price. */
  price: string;
  amount: string;
  /** When the next charge is (or when it ends, if canceling). ISO. */
  periodEnd: string | null;
  card: BillingCard | null;
  invoices: BillingInvoice[];
  /** What's owed right now, if anything. */
  open: { id: string; amount: string } | null;
}

/** Is Stripe connected on this copy of the site? */
export const stripeConfigured = () => Boolean(env(process.env.STRIPE_SECRET_KEY) && env(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));

const money = (cents: number | null | undefined, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: (cents ?? 0) % 100 ? 2 : 0 }).format((cents ?? 0) / 100);

const BRANDS: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover", diners: "Diners", jcb: "JCB", unionpay: "UnionPay" };

export function cardOf(pm: Stripe.PaymentMethod | string | null | undefined): BillingCard | null {
  if (!pm || typeof pm === "string" || !pm.card) return null;
  const c = pm.card;
  return { brand: BRANDS[c.brand] ?? c.brand, last4: c.last4, exp: `${String(c.exp_month).padStart(2, "0")}/${String(c.exp_year).slice(-2)}` };
}

/** The card a subscription charges: its own default, else the customer's. */
async function defaultCard(customerId: string, sub: Stripe.Subscription | null): Promise<BillingCard | null> {
  const fromSub = cardOf(sub?.default_payment_method as Stripe.PaymentMethod | string | null);
  if (fromSub) return fromSub;
  const customer = await getStripe().customers.retrieve(customerId, { expand: ["invoice_settings.default_payment_method"] });
  if (customer.deleted) return null;
  const fromCustomer = cardOf(customer.invoice_settings?.default_payment_method as Stripe.PaymentMethod | string | null);
  if (fromCustomer) return fromCustomer;
  // Checkout saves the card on the customer without always making it the default.
  const pms = await getStripe().paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
  return cardOf(pms.data[0]);
}

export async function getBilling(member: Pick<MemberDoc, "stripeCustomerId" | "stripeSubscriptionId">): Promise<BillingView | null> {
  if (!member.stripeCustomerId || !stripeConfigured()) return null;
  const stripe = getStripe();
  const sub = member.stripeSubscriptionId
    ? await stripe.subscriptions.retrieve(member.stripeSubscriptionId, { expand: ["default_payment_method"] }).catch(() => null)
    : null;

  const item = sub?.items.data[0];
  const unit = item?.price.unit_amount ?? null;
  const currency = item?.price.currency ?? "usd";
  const interval = item?.price.recurring?.interval ?? "month";

  const [card, list] = await Promise.all([
    defaultCard(member.stripeCustomerId, sub),
    stripe.invoices.list({ customer: member.stripeCustomerId, limit: 24 }),
  ]);

  const invoices: BillingInvoice[] = list.data
    .filter((i) => i.status !== "draft")
    .map((i) => ({
      id: i.id ?? "",
      number: i.number ?? "",
      date: new Date((i.status_transitions?.paid_at ?? i.created) * 1000).toISOString(),
      amount: money(i.status === "paid" ? i.amount_paid : i.amount_due, i.currency),
      status: (i.status ?? "open") as BillingInvoice["status"],
      pdf: i.invoice_pdf ?? null,
      hosted: i.hosted_invoice_url ?? null,
    }));
  const openInv = list.data.find((i) => i.status === "open" && i.amount_due > 0);

  const state: BillingView["state"] = !sub
    ? "none"
    : sub.status === "canceled"
      ? "canceled"
      : // Stripe's status, not "an invoice is open": a renewal sits open for up to
        // an hour before it's charged, and that isn't the member being late.
        sub.status === "past_due" || sub.status === "unpaid"
        ? "past_due"
        : sub.cancel_at_period_end
          ? "canceling"
          : "active";

  const end = item?.current_period_end;
  return {
    state,
    price: unit === null ? "" : `${money(unit, currency)}/${interval}`,
    amount: unit === null ? "" : money(unit, currency),
    periodEnd: end ? new Date(end * 1000).toISOString() : null,
    card,
    invoices,
    open: openInv ? { id: openInv.id ?? "", amount: money(openInv.amount_due, openInv.currency) } : null,
  };
}

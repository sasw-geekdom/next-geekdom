import "server-only";

import type Stripe from "stripe";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc, type TeamDoc } from "@/lib/firebase/collections";
import { getStripe, periodEnd, toMemberStatus } from "@/lib/stripe/server";
import { env } from "@/lib/env";

/*
  WHAT MANAGEMENT BILLS BEYOND THE PLAN PRICE (Geekdom, November 2026),
  all on Stripe, all CARD:

    · ENTERPRISE   a custom monthly amount, agreed with the company, on
                   card autopay — a subscription on the owner's card with
                   the amount as its price (the "Club Enterprise" product,
                   STRIPE_PRODUCT_ENTERPRISE). Changing it takes effect on
                   the next bill.
    · MAILBOX      $50/month (STRIPE_PRICE_MAILBOX). The PARTIAL MONTH IS
                   CHARGED when it's added: an item on the payer's Club
                   subscription, invoiced at once for the rest of the
                   period, then on every monthly bill. Not free for a
                   complimentary member — their subscription is paused, so
                   the mailbox gets its own subscription instead (a future
                   tag may make mail complimentary: pause THAT one).
    · ONE-OFF      an invoice for something else (a company event in the
                   space): line items, card only — charged to the card on
                   file now, or sent to pay with "Pay now" in their portal
                   (members never see Stripe's pages).

  THE PAYER is the member, or a teammate's team owner: a teammate has no
  billing of their own.

  Every subscription made here is stamped `app: next-geekdom`; a mailbox
  one also `kind: mailbox`, which keeps it from ever being read as the
  membership (lib/stripe/link.ts isClubSubscription, the webhook).
*/

const members = () => getAdminDb().collection(COLLECTIONS.members);

export const MAILBOX_CENTS = 5000;

async function load(memberId: string) {
  const ref = members().doc(memberId);
  const m = (await ref.get()).data() as MemberDoc | undefined;
  if (!m) throw new Error("That member no longer exists.");
  return { ref, m };
}

/** Who pays for this member: themselves, or their team's owner. */
async function payerOf(memberId: string) {
  const self = await load(memberId);
  if (!self.m.teamOwnerId) return { ...self, payerId: memberId };
  const owner = await load(self.m.teamOwnerId);
  return { ...owner, payerId: self.m.teamOwnerId };
}

/** The card a customer's charges go to, or null. */
async function cardOn(customerId: string): Promise<string | null> {
  const stripe = getStripe();
  const c = await stripe.customers.retrieve(customerId, { expand: ["invoice_settings.default_payment_method"] });
  if (c.deleted) return null;
  const pm = c.invoice_settings?.default_payment_method as Stripe.PaymentMethod | string | null;
  if (pm) return typeof pm === "string" ? pm : pm.id;
  return (await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 })).data[0]?.id ?? null;
}

const NO_CARD = (name: string) => `There's no card on file for ${name}. Ask them to add one in the portal (Profile → Billing).`;
const fmt = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
const day = (d: Date) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(d);

// ─── Enterprise ─────────────────────────────────────────────────────────────

/**
 * Start, or change, an Enterprise account's monthly amount — card autopay
 * on the owner's card. `startOn`: "now" or an ISO date (nothing is charged
 * before it). An existing subscription keeps its dates; the new amount
 * applies from the next bill.
 */
export async function setEnterpriseBilling(teamId: string, cents: number, startOn: string, by: string): Promise<string> {
  const product = env(process.env.STRIPE_PRODUCT_ENTERPRISE);
  if (!product) throw new Error("The Enterprise product isn't set up on Stripe (STRIPE_PRODUCT_ENTERPRISE).");
  if (!Number.isInteger(cents) || cents < 100) throw new Error("Enter the monthly amount in dollars.");
  const teamRef = getAdminDb().collection(COLLECTIONS.teams).doc(teamId);
  const team = (await teamRef.get()).data() as TeamDoc | undefined;
  if (!team) throw new Error("That team no longer exists.");
  if (team.plan !== "enterprise") throw new Error("Only Enterprise accounts have a custom amount — Team is the plan price.");
  const { ref, m } = await load(team.ownerId);
  if (!m.stripeCustomerId) throw new Error(NO_CARD(m.name));
  const pm = await cardOn(m.stripeCustomerId);
  if (!pm) throw new Error(NO_CARD(m.name));
  const stripe = getStripe();
  const price_data = { currency: "usd", product, unit_amount: cents, recurring: { interval: "month" as const } };

  const current = m.stripeSubscriptionId ? await stripe.subscriptions.retrieve(m.stripeSubscriptionId).catch(() => null) : null;
  const live = current && current.status !== "canceled" && current.status !== "incomplete_expired" ? current : null;
  let message: string;
  if (live) {
    const plan = live.items.data.find((i) => (typeof i.price.product === "string" ? i.price.product : i.price.product.id) === product);
    if (!plan) throw new Error(`${m.name} already pays for a different Club plan on Stripe. Cancel it before starting Enterprise billing.`);
    await stripe.subscriptions.update(live.id, { items: [{ id: plan.id, price_data }], proration_behavior: "none" });
    message = `${team.name} is now ${fmt(cents)} a month, from the next bill.`;
  } else {
    let start = startOn === "now" ? null : new Date(startOn);
    if (start && Number.isNaN(start.getTime())) throw new Error("Pick a start date.");
    if (start && start.getTime() < Date.now() + 3600_000) start = null;
    const sub = await stripe.subscriptions.create({
      customer: m.stripeCustomerId,
      items: [{ price_data }],
      default_payment_method: pm,
      ...(start ? { trial_end: Math.floor(start.getTime() / 1000) } : {}),
      metadata: { app: "next-geekdom", plan: "enterprise", teamId, memberId: team.ownerId, name: m.name, startedBy: by },
    });
    const end = periodEnd(sub);
    await ref.set(
      { stripeSubscriptionId: sub.id, status: toMemberStatus(sub.status), currentPeriodEnd: end ? Timestamp.fromDate(end) : null, cancelAtPeriodEnd: false, updatedAt: Timestamp.now() },
      { merge: true },
    );
    message = start ? `${team.name}: ${fmt(cents)} a month from ${day(start)} on ${m.name}'s card — nothing is charged before then.` : `${team.name}: ${fmt(cents)} a month, starting today on ${m.name}'s card.`;
  }
  await teamRef.update({ monthlyCents: cents, updatedAt: Timestamp.now() });
  return message;
}

// ─── Mailbox ────────────────────────────────────────────────────────────────

/** Add a mailbox, charging the partial month now. Returns what happened, in words. */
export async function addMailbox(memberId: string, by: string): Promise<string> {
  const price = env(process.env.STRIPE_PRICE_MAILBOX);
  if (!price) throw new Error("The mailbox price isn't set up on Stripe (STRIPE_PRICE_MAILBOX).");
  const { ref: selfRef, m: self } = await load(memberId);
  if (self.mailbox) throw new Error(`${self.name} already has a mailbox.`);
  const { m: payer, payerId } = await payerOf(memberId);
  if (!payer.stripeCustomerId) throw new Error(NO_CARD(payer.name));
  const pm = await cardOn(payer.stripeCustomerId);
  if (!pm) throw new Error(NO_CARD(payer.name));
  const stripe = getStripe();
  const meta = { app: "next-geekdom", kind: "mailbox", memberId, name: self.name, addedBy: by };

  // On the payer's Club subscription, if it's billing (not paused for a complimentary period).
  const club = payer.stripeSubscriptionId ? await stripe.subscriptions.retrieve(payer.stripeSubscriptionId).catch(() => null) : null;
  const billing = club && (club.status === "active" || club.status === "past_due") && !club.pause_collection ? club : null;
  let record: NonNullable<MemberDoc["mailbox"]>;
  let message: string;
  if (billing) {
    const item = await stripe.subscriptionItems.create({ subscription: billing.id, price, quantity: 1, proration_behavior: "always_invoice", metadata: meta });
    record = { since: Timestamp.now(), by, subscriptionId: billing.id, itemId: item.id, separate: false };
    message = `Mailbox added. The rest of this month is charged now${payerId !== memberId ? ` to ${payer.name}'s card (they pay for the team)` : ""}, then ${fmt(MAILBOX_CENTS)} with each monthly bill.`;
  } else {
    const sub = await stripe.subscriptions.create({ customer: payer.stripeCustomerId, items: [{ price, metadata: meta }], default_payment_method: pm, metadata: meta });
    record = { since: Timestamp.now(), by, subscriptionId: sub.id, itemId: sub.items.data[0].id, separate: true };
    message = `Mailbox added — ${fmt(MAILBOX_CENTS)} charged today${payerId !== memberId ? ` to ${payer.name}'s card` : ""}, then monthly${club?.pause_collection ? ". Their membership is complimentary, so the mailbox is billed on its own" : ""}.`;
  }
  await selfRef.set({ mailbox: record, updatedAt: Timestamp.now() }, { merge: true });
  return message;
}

/** Remove a mailbox from today. No refund for the rest of the month. */
export async function removeMailbox(memberId: string): Promise<string> {
  const { ref, m } = await load(memberId);
  if (!m.mailbox) throw new Error(`${m.name} doesn't have a mailbox.`);
  const stripe = getStripe();
  try {
    if (m.mailbox.separate) await stripe.subscriptions.cancel(m.mailbox.subscriptionId);
    else await stripe.subscriptionItems.del(m.mailbox.itemId, { proration_behavior: "none" });
  } catch (e) {
    // Already gone on Stripe (the subscription ended) — the record still clears.
    if (!(e instanceof Error && /No such|resource_missing|canceled/i.test(e.message))) throw e;
  }
  await ref.update({ mailbox: FieldValue.delete(), updatedAt: Timestamp.now() });
  return "Mailbox removed. It's not billed again; the current month isn't refunded.";
}

// ─── One-off invoices ───────────────────────────────────────────────────────

export interface InvoiceLine {
  description: string;
  cents: number;
}

/**
 * A ONE-OFF INVOICE, card only. "charge": the card on file, now. "send":
 * open for `dueDays`, paid with Pay now in the portal — the caller emails
 * them. Returns the invoice and who it was billed to.
 */
export async function createOneOffInvoice(
  memberId: string,
  lines: InvoiceLine[],
  mode: "charge" | "send",
  dueDays: number,
  by: string,
): Promise<{ invoice: Stripe.Invoice; payer: MemberDoc; paid: boolean }> {
  if (!lines.length) throw new Error("Add at least one line.");
  const { m: payer, payerId } = await payerOf(memberId);
  const stripe = getStripe();
  let customerId = payer.stripeCustomerId;
  if (!customerId) {
    if (mode === "charge") throw new Error(NO_CARD(payer.name));
    // Sent to pay in the portal: they need a Stripe customer, not a card yet.
    const c = await stripe.customers.create({ email: payer.email, name: payer.name, metadata: { app: "next-geekdom", memberId: payerId } });
    customerId = c.id;
    await members().doc(payerId).set({ stripeCustomerId: c.id, updatedAt: Timestamp.now() }, { merge: true });
  }
  const pm = await cardOn(customerId);
  if (mode === "charge" && !pm) throw new Error(NO_CARD(payer.name));

  const description = lines.map((l) => l.description).join(" · ").slice(0, 400);
  const invoice = await stripe.invoices.create({
    customer: customerId,
    auto_advance: false,
    pending_invoice_items_behavior: "exclude",
    description,
    collection_method: mode === "charge" ? "charge_automatically" : "send_invoice",
    ...(mode === "send" ? { days_until_due: dueDays } : {}),
    ...(mode === "charge" && pm ? { default_payment_method: pm } : {}),
    payment_settings: { payment_method_types: ["card"] },
    metadata: { app: "next-geekdom", kind: "one_off", memberId, payerId, by },
  });
  for (const l of lines) await stripe.invoiceItems.create({ customer: customerId, invoice: invoice.id!, amount: l.cents, currency: "usd", description: l.description });
  let final = await stripe.invoices.finalizeInvoice(invoice.id!, { auto_advance: false });
  let paid = false;
  if (mode === "charge") {
    try {
      final = await stripe.invoices.pay(final.id!);
      paid = final.status === "paid";
    } catch {
      // Declined: it stays open, and they can pay it in the portal with another card.
      final = await stripe.invoices.retrieve(final.id!);
    }
  }
  return { invoice: final, payer, paid };
}

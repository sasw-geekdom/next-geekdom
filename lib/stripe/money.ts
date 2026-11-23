import "server-only";

import { unstable_cache } from "next/cache";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { isClubSubscription } from "@/lib/stripe/link";
import { env } from "@/lib/env";

/*
  THE CLUB'S MONEY, FROM STRIPE — the Overview's money row (MANAGEMENT ONLY;
  app/portal/admin/page.tsx). Stripe is the source, not the members docs:
  what's billed, what came in and what's owed are Stripe's facts.

  CLUB ONLY. The account also bills Coworks' other plans (Community
  Membership etc.), so every subscription goes through isClubSubscription —
  our prices, or Coworks' product named "Club Membership" — the same rule
  that links a member to their Stripe customer.

    · recurring   monthly recurring revenue: every active or past-due Club
                  subscription that's billing (not paused for a
                  complimentary period, not still waiting to start),
                  normalized to a month. Ones set to cancel still count
                  until they end, and are counted separately.
    · collected   Club invoices PAID in the last 30 days.
    · pastDue     Club subscriptions Stripe marks past due, what they owe,
                  and charges that FAILED in the last 30 days (attempted,
                  still unpaid — or paid only after a retry).

  Cached 5 minutes (one read pages through every subscription and a
  month's invoices); a failure THROWS so it isn't cached as the answer.
*/

export interface ClubMoney {
  /** Is this Stripe's sandbox (test keys)? The figures are then test data. */
  sandbox: boolean;
  recurringCents: number;
  paying: number;
  canceling: number;
  /** Billing set to start later (staff's "Start Club billing" on a date). */
  startingLater: number;
  /** Billing paused for a complimentary period. */
  paused: number;
  collectedCents: number;
  payments: number;
  pastDue: number;
  owedCents: number;
  failed30: number;
}

const DAY = 86_400;

/** A price's amount per month. */
function monthly(item: Stripe.SubscriptionItem): number {
  const unit = (item.price.unit_amount ?? 0) * (item.quantity ?? 1);
  const r = item.price.recurring;
  if (!r) return 0;
  const per = r.interval_count || 1;
  if (r.interval === "year") return unit / (12 * per);
  if (r.interval === "week") return (unit * 52) / (12 * per);
  if (r.interval === "day") return (unit * 365) / (12 * per);
  return unit / per;
}

const subIdOf = (inv: Stripe.Invoice): string | null => {
  const s = inv.parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : (s?.id ?? null);
};

async function readClubMoney(): Promise<ClubMoney> {
  const stripe = getStripe();
  const names = new Map<string, string>();
  async function nameProducts(subs: Stripe.Subscription[]) {
    for (const s of subs)
      for (const i of s.items.data) {
        const pid = typeof i.price.product === "string" ? i.price.product : i.price.product.id;
        if (!names.has(pid)) names.set(pid, (await stripe.products.retrieve(pid).catch(() => null))?.name ?? "");
      }
  }

  // Live subscriptions: three small lists rather than "all" (years of Coworks history).
  const live: Stripe.Subscription[] = [];
  for (const status of ["active", "past_due", "trialing"] as const)
    for await (const s of stripe.subscriptions.list({ status, limit: 100 })) live.push(s);
  await nameProducts(live);
  const club = live.filter((s) => isClubSubscription(s, names));
  const clubIds = new Set(club.map((s) => s.id));

  let recurringCents = 0;
  let paying = 0;
  let canceling = 0;
  let startingLater = 0;
  let paused = 0;
  let pastDue = 0;
  for (const s of club) {
    if (s.status === "trialing") {
      startingLater++;
      continue;
    }
    if (s.pause_collection) {
      paused++;
      continue;
    }
    paying++;
    if (s.cancel_at_period_end) canceling++;
    if (s.status === "past_due") pastDue++;
    recurringCents += s.items.data.reduce((sum, i) => sum + monthly(i), 0);
  }

  // A month of invoices, for what came in and what failed. A paid invoice
  // whose subscription has since ended isn't in `club`: look it up once.
  const since = Math.floor(Date.now() / 1000) - 30 * DAY;
  const ended = new Map<string, boolean>();
  async function isClubSub(id: string | null): Promise<boolean> {
    if (!id) return false;
    if (clubIds.has(id)) return true;
    if (!ended.has(id)) {
      const sub = await stripe.subscriptions.retrieve(id).catch(() => null);
      if (sub) await nameProducts([sub]);
      ended.set(id, Boolean(sub && isClubSubscription(sub, names)));
    }
    return ended.get(id)!;
  }

  let collectedCents = 0;
  let payments = 0;
  let failed30 = 0;
  for await (const inv of stripe.invoices.list({ created: { gte: since }, limit: 100 })) {
    if (inv.status === "draft" || !(await isClubSub(subIdOf(inv)))) continue;
    if (inv.status === "paid" && inv.amount_paid > 0) {
      collectedCents += inv.amount_paid;
      payments++;
    }
    // A charge that failed: attempted and still unpaid, or paid only on a retry.
    if ((inv.attempted && inv.status === "open") || (inv.attempt_count ?? 0) > 1) failed30++;
  }

  // What's owed now — every open Club invoice, whenever it was issued.
  let owedCents = 0;
  for await (const inv of stripe.invoices.list({ status: "open", limit: 100 }))
    if (inv.amount_due > 0 && clubIds.has(subIdOf(inv) ?? "")) owedCents += inv.amount_due;

  return {
    sandbox: (env(process.env.STRIPE_SECRET_KEY) ?? "").startsWith("sk_test_"),
    recurringCents: Math.round(recurringCents),
    paying,
    canceling,
    startingLater,
    paused,
    collectedCents,
    payments,
    pastDue,
    owedCents,
    failed30,
  };
}

/** Null when Stripe isn't connected on this copy of the site. Throws if Stripe can't be read. */
export async function getClubMoney(): Promise<ClubMoney | null> {
  const key = env(process.env.STRIPE_SECRET_KEY);
  if (!key) return null;
  // Keyed by account mode, so a sandbox figure is never served as a live one.
  return unstable_cache(readClubMoney, ["club-money:v1", key.startsWith("sk_test_") ? "test" : "live"], { revalidate: 300, tags: ["club-money"] })();
}

export const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

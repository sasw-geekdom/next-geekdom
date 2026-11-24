import "server-only";

import type Stripe from "stripe";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getStripe, periodEnd, toMemberStatus } from "@/lib/stripe/server";
import { env } from "@/lib/env";

/*
  LINKING A MEMBER TO THEIR STRIPE CUSTOMER — so the portal shows the card
  and payment history Geekdom already has for them (most current members
  paid through Coworks, which billed on Geekdom's own Stripe account).

  BY EMAIL, BEST FIRST. People have SEVERAL customers under one email
  (Coworks created them repeatedly — 37 of 42 matched people had more than
  one), so: one with an active subscription, else one with a card that
  hasn't expired, else the newest.

  A linked CLUB subscription (our prices, or a product named "Club
  Membership" — Coworks' own Club plan) is recorded as the member's, so the
  webhook and billing drawer treat it as their membership. Any other
  active subscription (Coworks' "Community Membership" etc.) is NOT — staff
  move those over ("Start Club billing"), so nobody is billed twice.

  READ-ONLY on Stripe. Writes only the member record. Staff can also link
  by hand when the emails differ (lib/admin/stripe-actions.ts).
*/

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export function isClubSubscription(sub: Stripe.Subscription, productNames: Map<string, string>): boolean {
  // A MAILBOX-ONLY subscription (lib/stripe/extras.ts) is an add-on, never the membership.
  if (sub.metadata?.kind === "mailbox") return false;
  // Ours, made by this site: checkout, "Start Club billing", Enterprise billing — all stamp the plan.
  if (sub.metadata?.plan === "solo" || sub.metadata?.plan === "team" || sub.metadata?.plan === "enterprise") return true;
  const ours = [env(process.env.STRIPE_PRICE_SOLO), env(process.env.STRIPE_PRICE_TEAM), env(process.env.STRIPE_MEMBERSHIP_PRICE_ID)].filter(Boolean);
  return sub.items.data.some((i) => {
    if (ours.includes(i.price.id)) return true;
    const pid = typeof i.price.product === "string" ? i.price.product : i.price.product.id;
    return /club membership/i.test(productNames.get(pid) ?? "");
  });
}

async function productNamesFor(subs: Stripe.Subscription[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  for (const s of subs)
    for (const i of s.items.data) {
      const pid = typeof i.price.product === "string" ? i.price.product : i.price.product.id;
      if (!names.has(pid)) names.set(pid, (await getStripe().products.retrieve(pid).catch(() => ({ name: "" }))).name ?? "");
    }
  return names;
}

export interface CustomerSummary {
  id: string;
  created: number;
  /** An active subscription that's the Club, if any. */
  club: Stripe.Subscription | null;
  /** Any active subscription at all (Coworks' Community Membership counts). */
  activeOther: string[];
  validCard: boolean;
}

/** Everything that decides which customer is "theirs". */
export async function summarize(c: Stripe.Customer): Promise<CustomerSummary> {
  const stripe = getStripe();
  const [subs, cards] = await Promise.all([
    stripe.subscriptions.list({ customer: c.id, status: "all", limit: 20 }),
    stripe.paymentMethods.list({ customer: c.id, type: "card", limit: 10 }),
  ]);
  const active = subs.data.filter((s) => ACTIVE.has(s.status));
  const names = await productNamesFor(active);
  const club = active.find((s) => isClubSubscription(s, names)) ?? null;
  const now = new Date();
  const validCard = cards.data.some((pm) => pm.card && new Date(Date.UTC(pm.card.exp_year, pm.card.exp_month, 1)) > now);
  const activeOther = active
    .filter((s) => s !== club)
    .map((s) => s.items.data.map((i) => names.get(typeof i.price.product === "string" ? i.price.product : i.price.product.id) || "a subscription").join(" + "));
  return { id: c.id, created: c.created, club, activeOther, validCard };
}

/** The best customer for an email, or null. */
export async function findBestCustomer(email: string): Promise<CustomerSummary | null> {
  const list = await getStripe().customers.list({ email: email.trim().toLowerCase(), limit: 10 });
  if (!list.data.length) return null;
  const all = await Promise.all(list.data.map(summarize));
  const score = (s: CustomerSummary) => (s.club ? 4 : 0) + (s.activeOther.length ? 2 : 0) + (s.validCard ? 1 : 0);
  return all.sort((a, b) => score(b) - score(a) || b.created - a.created)[0];
}

/** Write the link onto the member: the customer, and a Club subscription if there is one. */
export async function linkMember(memberId: string, s: CustomerSummary) {
  const record: Record<string, unknown> = { stripeCustomerId: s.id, updatedAt: Timestamp.now() };
  if (s.club) {
    const end = periodEnd(s.club);
    Object.assign(record, {
      stripeSubscriptionId: s.club.id,
      status: toMemberStatus(s.club.status),
      currentPeriodEnd: end ? Timestamp.fromDate(end) : null,
      cancelAtPeriodEnd: s.club.cancel_at_period_end,
    });
  }
  await getAdminDb().collection(COLLECTIONS.members).doc(memberId).set(record, { merge: true });
}

/**
 * Link a member by their email if they aren't linked yet. Quiet: returns
 * what it found (for the welcome step's wording), never throws.
 */
export async function autoLink(member: { id: string; email: string; stripeCustomerId: string | null }): Promise<CustomerSummary | null> {
  if (member.stripeCustomerId || !env(process.env.STRIPE_SECRET_KEY)) return null;
  try {
    const best = await findBestCustomer(member.email);
    if (best) await linkMember(member.id, best);
    return best;
  } catch (e) {
    console.error("[stripe] auto-link failed", e);
    return null;
  }
}

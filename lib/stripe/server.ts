import "server-only";

import Stripe from "stripe";
import { SITE_URL } from "@/lib/site";
import type { MemberStatus } from "@/lib/firebase/collections";

/**
 * Stripe client, constructed lazily.
 *
 * `new Stripe("")` THROWS ("Neither apiKey nor config.authenticator provided"),
 * and a module-scope client turns that into a build failure — Next evaluates
 * every route module while collecting page data, so an unset key breaks
 * `next build` rather than the one request that needed Stripe. Deferring
 * construction puts the error at the call site instead.
 *
 * No `apiVersion` is passed on purpose. stripe-node pins its own version
 * (v22 → 2026-07-29.dahlia) and its TypeScript types are generated against
 * exactly that pin — passing a different string compiles only when it happens
 * to match, and silently changes response shapes when it doesn't. Upgrade the
 * API version by upgrading the package.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    client = new Stripe(key, {
      // Shows up in Stripe's request log, which is worth having when two apps
      // share one Stripe account.
      appInfo: { name: "Geekdom Membership", url: SITE_URL },
    });
  }
  return client;
}

/** The single recurring price backing the one membership. */
export function membershipPriceId(): string {
  const id = process.env.STRIPE_MEMBERSHIP_PRICE_ID;
  if (!id) {
    throw new Error(
      "STRIPE_MEMBERSHIP_PRICE_ID is not set — create the recurring price in Stripe and add it to the environment.",
    );
  }
  return id;
}

/**
 * Map a Stripe subscription status onto the roster's status.
 *
 * The default arm matters: Stripe adds statuses over time, and anything we
 * don't recognize must NOT read as an active membership. Falling through to
 * `inactive` fails closed.
 */
export function toMemberStatus(status: Stripe.Subscription.Status): MemberStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "inactive";
  }
}

/**
 * Paid-through date, as a JS Date.
 *
 * `current_period_end` lives on the SUBSCRIPTION ITEM, not the subscription —
 * Stripe moved it when subscriptions gained the ability to hold items on
 * different billing cadences. `subscription.current_period_end` is `undefined`
 * on this API version and reading it yields an Invalid Date on the roster.
 *
 * The membership has exactly one item, so the first item is the answer. If a
 * subscription ever arrives with none, return null rather than guessing.
 */
export function periodEnd(subscription: Stripe.Subscription): Date | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000) : null;
}

/**
 * Find an existing Stripe customer by email, or create one.
 *
 * Email is the identity key across this whole flow — someone applies with an
 * email, gets approved, and checks out. Reusing the customer keeps one billing
 * history per person instead of a new customer per checkout attempt.
 */
export async function getOrCreateCustomer(
  email: string,
  name?: string,
): Promise<Stripe.Customer> {
  const normalized = email.trim().toLowerCase();

  const existing = await getStripe().customers.list({ email: normalized, limit: 1 });
  if (existing.data[0]) return existing.data[0];

  return getStripe().customers.create({ email: normalized, name });
}

/**
 * Checkout session for the membership.
 *
 * `applicationId` rides along in metadata so the webhook can link the resulting
 * member back to the application they came in through — the webhook fires from
 * Stripe with no session of its own, so anything it needs has to be carried in
 * the object.
 */
export async function createCheckoutSession(opts: {
  email: string;
  name?: string;
  applicationId?: string;
}): Promise<Stripe.Checkout.Session> {
  const customer = await getOrCreateCustomer(opts.email, opts.name);

  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: membershipPriceId(), quantity: 1 }],
    // Stripe fills {CHECKOUT_SESSION_ID} in on redirect.
    success_url: `${SITE_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/membership`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    // Duplicated onto the subscription because `customer.subscription.updated`
    // and `.deleted` events carry the subscription, not the checkout session.
    subscription_data: {
      metadata: {
        applicationId: opts.applicationId ?? "",
        name: opts.name ?? "",
      },
    },
    metadata: {
      applicationId: opts.applicationId ?? "",
      name: opts.name ?? "",
    },
  });
}

/** Stripe-hosted billing portal — update card, view invoices, cancel. */
export async function createPortalSession(
  customerId: string,
): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/account`,
  });
}

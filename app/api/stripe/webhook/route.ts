import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { getStripe, periodEnd, toMemberStatus } from "@/lib/stripe/server";
import { sendSafely } from "@/lib/email/resend";
import { welcomeEmail } from "@/lib/email/templates";

/**
 * Stripe webhook — the only thing that promotes an applicant to a member.
 *
 * The client-side success redirect deliberately does NOT create the member:
 * someone can close the tab before it fires, or hit /welcome directly. Stripe
 * is the source of truth for whether money moved, so the roster is written
 * from here and nowhere else.
 */

// Stripe signs the EXACT bytes it sent. Next parses nothing here as long as we
// read the body with `.text()` — using `.json()` would reformat the payload and
// every signature check would fail.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe] STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    // The async variant uses the platform's WebCrypto, which works on every
    // runtime this might deploy to.
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      secret,
    );
  } catch (error) {
    // A bad signature is either a misconfigured endpoint secret or someone
    // POSTing forged events at a public URL. Never process it.
    console.error("[stripe] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription") break;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        await syncSubscription(event.data.object);
        break;
      }

      default:
        // Everything else is acknowledged and ignored. Returning a non-2xx for
        // an event type we don't handle would make Stripe retry it forever.
        break;
    }
  } catch (error) {
    // A 500 tells Stripe to retry with backoff, which is what we want for a
    // transient Firestore failure — the alternative is a paying customer who
    // never lands on the roster.
    console.error(`[stripe] handler failed for ${event.type}`, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Doc id is the Stripe customer id, which makes every write idempotent. */
function memberRef(customerId: string) {
  return getAdminDb().collection(COLLECTIONS.members).doc(customerId);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!customerId) {
    console.error("[stripe] checkout session had no customer", session.id);
    return;
  }

  // The session's `subscription` is an id, not an object. Retrieve it so the
  // status and period end come from the subscription itself rather than being
  // guessed from the fact that checkout succeeded.
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const subscription = subscriptionId
    ? await getStripe().subscriptions.retrieve(subscriptionId)
    : null;

  const email =
    session.customer_details?.email ?? session.customer_email ?? "";
  const name =
    session.metadata?.name || session.customer_details?.name || email;
  const applicationId = session.metadata?.applicationId || null;

  const ref = memberRef(customerId);
  const existing = await ref.get();

  const record: Partial<MemberDoc> = {
    name,
    email: email.trim().toLowerCase(),
    applicationId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription?.id ?? null,
    status: subscription ? toMemberStatus(subscription.status) : "inactive",
    currentPeriodEnd: subscription
      ? toTimestamp(periodEnd(subscription))
      : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    updatedAt: Timestamp.now(),
  };

  // joinedAt is set once and never overwritten — a member who cancels and
  // rejoins should keep their original join date on the roster.
  if (!existing.exists) record.joinedAt = Timestamp.now();

  await ref.set(record, { merge: true });

  // Welcome mail only on the first checkout. Stripe redelivers events, and a
  // member should not get "Welcome to Geekdom" twice.
  if (!existing.exists && email) {
    const mail = welcomeEmail({ name });
    await sendSafely({ to: email, subject: mail.subject, html: mail.html });
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const ref = memberRef(customerId);
  const existing = await ref.get();

  // No member doc means checkout.session.completed hasn't landed yet — Stripe
  // does not guarantee event ordering. Creating a stub here would produce a
  // roster row with no name or email, so let the checkout handler create it
  // and rely on Stripe's retry to re-deliver this one.
  if (!existing.exists) {
    console.warn(
      "[stripe] subscription event before checkout for customer",
      customerId,
    );
    return;
  }

  await ref.set(
    {
      stripeSubscriptionId: subscription.id,
      status: toMemberStatus(subscription.status),
      currentPeriodEnd: toTimestamp(periodEnd(subscription)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
}

function toTimestamp(date: Date | null): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

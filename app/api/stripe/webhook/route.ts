import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { getStripe, periodEnd, toMemberStatus } from "@/lib/stripe/server";
import { sendSafely } from "@/lib/email/resend";
import {
  cancellationConfirmedEmail,
  memberWelcomeEmail,
  membershipEndedEmail,
  paymentFailedEmail,
  receiptEmail,
  welcomeBackEmail,
} from "@/lib/email/member-templates";
import { cardOf } from "@/lib/stripe/billing";
import { PLAN_IDS, type PlanId } from "@/lib/membership";
import { syncTeamStatus } from "@/lib/team";
import type { ApplicationDoc } from "@/lib/firebase/collections";
import { logActivity } from "@/lib/admin/activity";

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

  // ONCE PER EVENT. Stripe redelivers (a slow response, a retry), and the
  // handlers below send email — so an event already handled is acknowledged
  // and skipped. Marked only AFTER it succeeds, so a failed one still retries.
  const seen = getAdminDb().collection(COLLECTIONS.stripeEvents).doc(event.id);
  if ((await seen.get()).exists) return NextResponse.json({ received: true, duplicate: true });

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
        // RE-READ, don't trust the event's copy: an endpoint can be on an older
        // Stripe API version (the sandbox's default is 2017), where a
        // subscription carries no item-level period end. Retrieving it with
        // the SDK returns it in the version this code is written against.
        // (A canceled subscription can still be retrieved.)
        const sub = await getStripe().subscriptions.retrieve(event.data.object.id);
        const member = await syncSubscription(sub);
        if (member) await subscriptionEmails(event, member, sub);
        break;
      }

      // A payment went through — the receipt, and the date on the record.
      case "invoice.paid": {
        await invoicePaid(await getStripe().invoices.retrieve(event.data.object.id!));
        break;
      }

      // A payment failed — tell the member, with the way to fix it.
      case "invoice.payment_failed": {
        await invoiceFailed(await getStripe().invoices.retrieve(event.data.object.id!));
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

  await seen.set({ type: event.type, at: Timestamp.now() }).catch(() => {});
  return NextResponse.json({ received: true });
}

/*
  FIND THE MEMBER BEFORE CREATING ONE.

  The webhook used to key every member doc by the Stripe customer id and look
  nowhere else. Members now also arrive from the admin ("Add a member") and
  Geekdom's CSV, with auto ids and no Stripe customer yet — so the first time
  one of them paid, checkout would have made a SECOND record for the same
  person, with a fresh join date and a second welcome email.

  So, in order: the doc keyed by the customer id (everything the webhook
  created before this change), then any doc whose `stripeCustomerId` FIELD
  matches, then — at checkout only — the member with that email, which is how
  an admin-added member is linked to Stripe the first time they pay. Only
  when all three miss is a new doc created, keyed by the customer id as
  before, so redelivered events stay idempotent.
*/
async function findMember(customerId: string, email?: string) {
  const col = getAdminDb().collection(COLLECTIONS.members);
  const byId = col.doc(customerId);
  const snap = await byId.get();
  if (snap.exists) return { ref: byId, existing: snap };

  const byField = await col.where("stripeCustomerId", "==", customerId).limit(1).get();
  if (!byField.empty) return { ref: byField.docs[0].ref, existing: byField.docs[0] };

  if (email) {
    const byEmail = await col.where("email", "==", email).limit(1).get();
    if (!byEmail.empty) return { ref: byEmail.docs[0].ref, existing: byEmail.docs[0] };
  }
  return { ref: byId, existing: null };
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

  const email = (
    session.customer_details?.email ?? session.customer_email ?? ""
  )
    .trim()
    .toLowerCase();
  const name =
    session.metadata?.name || session.customer_details?.name || email;
  const applicationId = session.metadata?.applicationId || null;
  const planMeta = session.metadata?.plan;
  const plan: PlanId | undefined = PLAN_IDS.includes(planMeta as PlanId) ? (planMeta as PlanId) : undefined;

  const { ref, existing } = await findMember(customerId, email || undefined);
  const known = existing?.data() as MemberDoc | undefined;
  // A Team or Enterprise membership is a company's — carry it over from the application.
  const application = applicationId
    ? ((await getAdminDb().collection(COLLECTIONS.applications).doc(applicationId).get()).data() as ApplicationDoc | undefined)
    : undefined;
  const company = application?.company;

  const record: Partial<MemberDoc> = {
    // An existing member keeps the name staff gave them; Stripe's
    // cardholder name is often a spouse or a company.
    name: known?.name || name,
    email,
    applicationId: known?.applicationId ?? applicationId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription?.id ?? null,
    status: subscription ? toMemberStatus(subscription.status) : "inactive",
    currentPeriodEnd: subscription
      ? toTimestamp(periodEnd(subscription))
      : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
    ...(plan ? { plan } : {}),
    ...(company && !known?.company ? { company } : {}),
    updatedAt: Timestamp.now(),
  };

  // joinedAt is set once and never overwritten — a member who cancels and
  // rejoins, or one added by staff before they first paid, keeps their
  // original join date on the roster.
  if (!existing) {
    record.joinedAt = Timestamp.now();
    record.source = "stripe";
  }

  await ref.set(record, { merge: true });
  // A returning owner's teammates come back with them.
  if (record.status) await syncTeamStatus(ref.id, record.status);

  // The application they came through is now a membership — its history
  // shows "Paid", and its payment-link control goes away.
  if (applicationId) {
    await getAdminDb()
      .collection(COLLECTIONS.applications)
      .doc(applicationId)
      .set({ paidAt: Timestamp.now() }, { merge: true })
      .catch((e) => console.error("[stripe] couldn't mark application paid", applicationId, e));
  }

  // THE END OF THE APPLICATION WORKFLOW, in the activity log beside the
  // decisions that led here. Once: Stripe redelivers events, so only when
  // this application wasn't already paid, or (no application) this is a
  // new member. "Stripe" is the actor — no staff member did this.
  if ((application && !application.paidAt) || (!application && !existing)) {
    await logActivity(
      { email: "stripe", name: "Stripe" },
      {
        area: "members",
        action: "confirmed a payment from",
        label: `${record.name}${plan ? ` (${plan === "team" ? "Team" : plan === "enterprise" ? "Enterprise" : "Solo"})` : ""} — now a member`,
        href: applicationId ? `/portal/admin/applications/${applicationId}` : "/portal/admin/members",
      },
    );
  }

  // Welcome mail only on the first checkout. Stripe redelivers events, and a
  // member should not get "Welcome to Geekdom" twice.
  if (!existing && email) {
    // The branded welcome: sign in, fill in your profile, find your people.
    const mail = memberWelcomeEmail({ name });
    await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  }
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { ref, existing } = await findMember(customerId);

  // No member doc means checkout.session.completed hasn't landed yet — Stripe
  // does not guarantee event ordering. Creating a stub here would produce a
  // roster row with no name or email, so let the checkout handler create it
  // and have Stripe RETRY this one: throwing makes it a 500, and Stripe
  // redelivers with backoff. (It used to return quietly — a 200, so Stripe
  // never retried and the update was lost.)
  //
  // Only for OUR subscriptions (checkout stamps `plan` in their metadata) and
  // never for one that has ended: a subscription from another app on the
  // same Stripe account, or a deleted customer's, would otherwise be retried
  // for days. Those are acknowledged and skipped.
  if (!existing) {
    const ours = Boolean(subscription.metadata?.plan);
    if (ours && subscription.status !== "canceled") {
      throw new Error(`subscription event before checkout for customer ${customerId}`);
    }
    return null;
  }

  const status = toMemberStatus(subscription.status);
  await ref.set(
    {
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodEnd: toTimestamp(periodEnd(subscription)),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: Timestamp.now(),
    },
    { merge: true },
  );
  // The owner's status is the team's: past due, canceled or paused, the
  // teammates follow (lib/team.ts).
  await syncTeamStatus(ref.id, status);
  return { ...(existing.data() as MemberDoc), id: ref.id };
}

/*
  THE BILLING EMAILS (lib/email/member-templates.ts — Geekdom's brand, not
  Stripe's). Each fires on the change, not the state: "cancel at period
  end" switching ON sends the confirmation, switching OFF the welcome
  back, the subscription ending the goodbye. `previous_attributes` is how
  an updated event says what changed.
*/
const longDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(d) : "";
const usd = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

async function subscriptionEmails(event: Stripe.Event, member: MemberDoc & { id: string }, sub: Stripe.Subscription) {
  if (!member.email) return;
  const send = (m: { subject: string; html: string; text: string }) => sendSafely({ to: member.email, subject: m.subject, html: m.html, text: m.text });

  if (event.type === "customer.subscription.deleted") {
    await send(membershipEndedEmail({ name: member.name }));
    return;
  }
  if (event.type !== "customer.subscription.updated") return;
  const before = (event.data.previous_attributes ?? {}) as Partial<Stripe.Subscription>;
  if (!("cancel_at_period_end" in before) || before.cancel_at_period_end === sub.cancel_at_period_end) return;
  const end = longDate(periodEnd(sub));
  await send(sub.cancel_at_period_end ? cancellationConfirmedEmail({ name: member.name, endDate: end }) : welcomeBackEmail({ name: member.name, nextPayment: end }));
}

const customerOf = (inv: Stripe.Invoice) => (typeof inv.customer === "string" ? inv.customer : inv.customer?.id) ?? "";

/** The card an invoice was charged to (or tried), as "Visa •••• 4242". */
async function invoiceCard(inv: Stripe.Invoice): Promise<string> {
  try {
    const payments = await getStripe().invoicePayments.list({ invoice: inv.id!, limit: 1, expand: ["data.payment.payment_intent.payment_method"] });
    const pi = payments.data[0]?.payment?.payment_intent;
    const pm = pi && typeof pi !== "string" ? (pi.payment_method as Stripe.PaymentMethod | string | null) : null;
    const c = cardOf(pm);
    return c ? `${c.brand} •••• ${c.last4}` : "your card";
  } catch {
    return "your card";
  }
}

async function invoicePaid(inv: Stripe.Invoice) {
  if (!inv.amount_paid) return; // a $0 invoice (a trial, a full coupon) isn't a payment
  const { ref, existing } = await findMember(customerOf(inv));
  if (!existing) return; // checkout's own handler welcomes them; the receipt follows on the next one
  const m = existing.data() as MemberDoc;
  await ref.set({ lastPaymentAt: Timestamp.now(), lastPaymentCents: inv.amount_paid, updatedAt: Timestamp.now() }, { merge: true });
  if (!m.email) return;
  const mail = receiptEmail({
    name: m.name,
    amount: usd(inv.amount_paid, inv.currency),
    date: longDate(new Date(((inv.status_transitions?.paid_at ?? inv.created) || 0) * 1000)),
    card: await invoiceCard(inv),
    invoiceNumber: inv.number ?? "",
  });
  await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text });
}

async function invoiceFailed(inv: Stripe.Invoice) {
  const { existing } = await findMember(customerOf(inv));
  if (!existing) return;
  const m = existing.data() as MemberDoc;
  if (!m.email) return;
  // The subscription's own update event moves them to past due; this is the email.
  const mail = paymentFailedEmail({ name: m.name, amount: usd(inv.amount_due, inv.currency), card: await invoiceCard(inv) });
  await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text });
}

function toTimestamp(date: Date | null): Timestamp | null {
  return date ? Timestamp.fromDate(date) : null;
}

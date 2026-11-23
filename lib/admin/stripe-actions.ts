"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { EXIT_NOTE_MAX, EXIT_REASON_IDS, exitReasonLabel, type Cancellation, type ExitReason } from "@/lib/membership-exit";
import { adminAllowed, requireAdmin } from "@/lib/auth/session";
import { MANAGEMENT_ONLY_MESSAGE } from "@/lib/auth/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { logActivity } from "@/lib/admin/activity";
import { getStripe, periodEnd, toMemberStatus } from "@/lib/stripe/server";
import { cardOf, getBilling, type BillingView } from "@/lib/stripe/billing";
import { findBestCustomer, linkMember, summarize } from "@/lib/stripe/link";
import { compActive } from "@/lib/perks";
import { env } from "@/lib/env";
import { planOf } from "@/lib/membership";

/*
  STAFF'S STRIPE CONTROLS in a member's slide-out (ADMIN ONLY):

    · stripeSnapshot   what Stripe has for them — linked customer, card on
                       file, Club subscription, any other active plan
                       (Coworks' Community Membership) — read when the
                       slide-out opens
    · memberBilling    their BILLING HISTORY — the same Stripe read as the
                       member's own Manage billing (getBilling), so staff and
                       member see the same invoices: upcoming, paid, due,
                       void, with Stripe's PDF and receipt. READ ONLY, every
                       admin (staff see billing read-only); nothing here can
                       charge, refund or pay.
    · linkStripe       link by EMAIL or customer id (cus_…) — for members
                       whose Stripe email differs from their Club one
    · startClubBilling the Club subscription on the card already on file,
                       TODAY or ON A DATE (Stripe's trial_end — nothing is
                       charged before it). Staff handle the switch from
                       Coworks: pick the day their Coworks plan ends, then
                       end that plan in Coworks. A complimentary member's
                       billing can't start before their period ends.
    · cancelClubBilling CANCEL a Stripe-billed membership from here (it was
                       a trip to Stripe's dashboard): at the END OF THE PAID
                       PERIOD (they keep access until then; undo with
                       keepClubBilling) or TODAY (access ends now, no
                       refund). The webhook then sends the member the same
                       emails as their own cancel, and records the status.
                       The reason is the exit survey's list, from staff.

  Every write is logged. Members are never charged without a card they
  saved themselves (Checkout, the billing drawer, or Coworks before).
*/

export interface StripeSnapshot {
  configured: boolean;
  customerId: string | null;
  card: string | null;
  club: { status: string; price: string; next: string | null; canceling: boolean } | null;
  other: string[];
}

async function member(id: string) {
  const ref = getAdminDb().collection(COLLECTIONS.members).doc(id);
  const m = (await ref.get()).data() as MemberDoc | undefined;
  if (!m) throw new Error("That member no longer exists.");
  return { ref, m };
}

export async function stripeSnapshot(memberId: string): Promise<StripeSnapshot> {
  await requireAdmin();
  const configured = Boolean(env(process.env.STRIPE_SECRET_KEY));
  const { m } = await member(memberId);
  if (!configured || !m.stripeCustomerId) return { configured, customerId: m.stripeCustomerId ?? null, card: null, club: null, other: [] };
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(m.stripeCustomerId, { expand: ["invoice_settings.default_payment_method"] });
  if (customer.deleted) return { configured, customerId: null, card: null, club: null, other: [] };
  const s = await summarize(customer);
  let card = cardOf(customer.invoice_settings?.default_payment_method as never);
  if (!card) card = cardOf((await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 })).data[0]);
  const item = s.club?.items.data[0];
  return {
    configured,
    customerId: customer.id,
    card: card ? `${card.brand} •••• ${card.last4} · expires ${card.exp}` : null,
    club: s.club
      ? {
          status: s.club.status,
          price: item?.price.unit_amount != null ? `$${item.price.unit_amount / 100}/${item.price.recurring?.interval ?? "month"}` : "",
          next: periodEnd(s.club)?.toISOString() ?? null,
          canceling: s.club.cancel_at_period_end,
        }
      : null,
    other: s.activeOther,
  };
}

export async function memberBilling(memberId: string): Promise<BillingView | null> {
  await requireAdmin();
  const { m } = await member(memberId);
  return getBilling(m);
}

export async function linkStripe(memberId: string, query: string): Promise<{ ok: boolean; message: string }> {
  const admin = await adminAllowed("members.money");
  if (!admin) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (!env(process.env.STRIPE_SECRET_KEY)) return { ok: false, message: "Stripe isn't connected on this copy of the site." };
  const q = String(query ?? "").trim();
  if (!q) return { ok: false, message: "Enter their Stripe email or customer id (cus_…)." };
  try {
    const { m } = await member(memberId);
    let found;
    if (q.startsWith("cus_")) {
      const c = await getStripe().customers.retrieve(q);
      if (c.deleted) return { ok: false, message: "That Stripe customer was deleted." };
      found = await summarize(c);
    } else {
      found = await findBestCustomer(q);
    }
    if (!found) return { ok: false, message: `No Stripe customer found for ${q}.` };
    // One customer, one member.
    const clash = await getAdminDb().collection(COLLECTIONS.members).where("stripeCustomerId", "==", found.id).limit(1).get();
    if (!clash.empty && clash.docs[0].id !== memberId) return { ok: false, message: `That customer is already linked to ${clash.docs[0].data().name}.` };
    await linkMember(memberId, found);
    await logActivity(admin, { area: "members", action: "linked Stripe billing for", label: m.name, href: "/portal/admin/members" });
    revalidatePath("/portal/admin/members");
    return { ok: true, message: found.club ? "Linked — they're on the Club plan." : "Linked to their Stripe customer." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't link them." };
  }
}

/** startOn: "now" or an ISO date (the day billing begins). */
export async function startClubBilling(memberId: string, startOn: string): Promise<{ ok: boolean; message: string }> {
  const admin = await adminAllowed("members.money");
  if (!admin) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (!env(process.env.STRIPE_SECRET_KEY)) return { ok: false, message: "Stripe isn't connected on this copy of the site." };
  try {
    const { ref, m } = await member(memberId);
    if (!m.stripeCustomerId) return { ok: false, message: "Link them to a Stripe customer first." };
    if (m.teamOwnerId) return { ok: false, message: "Teammates are billed through their team's owner." };
    const plan = planOf(m.plan);
    const price = plan.id === "team" ? env(process.env.STRIPE_PRICE_TEAM) : plan.id === "solo" ? env(process.env.STRIPE_PRICE_SOLO) ?? env(process.env.STRIPE_MEMBERSHIP_PRICE_ID) : undefined;
    if (!price) return { ok: false, message: plan.id === "enterprise" ? "Enterprise is billed by agreement, not here." : `There's no Stripe price for the ${plan.name} plan.` };

    const stripe = getStripe();
    const customer = await stripe.customers.retrieve(m.stripeCustomerId, { expand: ["invoice_settings.default_payment_method"] });
    if (customer.deleted) return { ok: false, message: "Their Stripe customer was deleted." };
    const s = await summarize(customer);
    if (s.club) return { ok: false, message: "They already have a Club subscription." };
    const pm =
      (customer.invoice_settings?.default_payment_method as { id?: string } | null)?.id ??
      (await stripe.paymentMethods.list({ customer: customer.id, type: "card", limit: 1 })).data[0]?.id;
    if (!pm) return { ok: false, message: "There's no card on file. Ask them to add one in the portal (Profile → Manage billing)." };

    // When billing starts: the chosen day — and never inside a complimentary period.
    let start = startOn === "now" ? null : new Date(startOn);
    if (start && Number.isNaN(start.getTime())) return { ok: false, message: "Pick a start date." };
    if (compActive(m.comp) && m.comp.until) {
      const compEnd = new Date(m.comp.until);
      if (!start || start < compEnd) start = compEnd;
    }
    if (start && start.getTime() < Date.now() + 3600_000) start = null; // "today" really means now

    const sub = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price }],
      default_payment_method: pm,
      ...(start ? { trial_end: Math.floor(start.getTime() / 1000) } : {}),
      metadata: { plan: plan.id, name: m.name, memberId, startedBy: admin.email },
    });
    const end = periodEnd(sub);
    await ref.set(
      {
        stripeSubscriptionId: sub.id,
        status: toMemberStatus(sub.status),
        currentPeriodEnd: end ? Timestamp.fromDate(end) : null,
        cancelAtPeriodEnd: false,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
    const when = start ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(start) : "today";
    await logActivity(admin, { area: "members", action: `started Club billing (from ${when}) for`, label: m.name, href: "/portal/admin/members" });
    revalidatePath("/portal/admin/members");
    return {
      ok: true,
      message: start
        ? `Club billing starts ${when} on their card on file — nothing is charged before then.${s.activeOther.length ? " Now end their Coworks plan in Coworks for the same day." : ""}`
        : `Club billing started today — the first payment is on their card on file.${s.activeOther.length ? " Now end their Coworks plan in Coworks." : ""}`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't start billing." };
  }
}

/** The member's Club subscription, for cancel/keep — refused for a teammate (the owner pays). */
async function clubOf(memberId: string) {
  const { ref, m } = await member(memberId);
  if (m.teamOwnerId) throw new Error("Teammates are on their team owner's billing — cancel the owner's, or remove them from the team.");
  if (!m.stripeSubscriptionId) throw new Error("They have no Club subscription. Set their status instead.");
  const sub = await getStripe().subscriptions.retrieve(m.stripeSubscriptionId);
  if (sub.status === "canceled" || sub.status === "incomplete_expired") throw new Error("Their subscription has already ended.");
  return { ref, m, sub };
}

const dateOf = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(d) : "the end of this period";

export async function cancelClubBilling(
  memberId: string,
  when: "end_of_period" | "now",
  survey?: { reason?: string | null; note?: string },
): Promise<{ ok: boolean; message: string }> {
  const admin = await adminAllowed("members.money");
  if (!admin) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (!env(process.env.STRIPE_SECRET_KEY)) return { ok: false, message: "Stripe isn't connected on this copy of the site." };
  if (when !== "end_of_period" && when !== "now") return { ok: false, message: "Pick when it ends." };
  try {
    const { ref, m, sub } = await clubOf(memberId);
    const reason = EXIT_REASON_IDS.includes(survey?.reason as ExitReason) ? (survey!.reason as ExitReason) : null;
    const note = typeof survey?.note === "string" ? survey.note.trim().slice(0, EXIT_NOTE_MAX) : "";
    const cancellation: Cancellation = { by: admin.name || admin.email, how: when, reason, note, at: new Date().toISOString() };
    const stripe = getStripe();
    let message: string;
    if (when === "now") {
      // The webhook (customer.subscription.deleted) marks them canceled, ends the team, and sends "has ended".
      await stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
      await ref.set({ cancellation, status: "canceled", cancelAtPeriodEnd: false, updatedAt: Timestamp.now() }, { merge: true });
      message = `${m.name}'s membership has ended. We've emailed them.`;
    } else {
      const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      await ref.set({ cancellation, cancelAtPeriodEnd: true, updatedAt: Timestamp.now() }, { merge: true });
      message = `${m.name}'s membership ends ${dateOf(periodEnd(updated))} — they keep access until then. We've emailed them.`;
    }
    await logActivity(admin, {
      area: "members",
      action: `cancelled the membership (${when === "now" ? "today" : "at period end"}${reason ? `, ${exitReasonLabel(reason)}` : ""}) of`,
      label: m.name,
      href: "/portal/admin/members",
    });
    revalidatePath("/portal/admin/members");
    return { ok: true, message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't cancel the membership." };
  }
}

/** Undo a cancel at period end — they stay, and get the "continues" email. */
export async function keepClubBilling(memberId: string): Promise<{ ok: boolean; message: string }> {
  const admin = await adminAllowed("members.money");
  if (!admin) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (!env(process.env.STRIPE_SECRET_KEY)) return { ok: false, message: "Stripe isn't connected on this copy of the site." };
  try {
    const { ref, m, sub } = await clubOf(memberId);
    if (!sub.cancel_at_period_end) return { ok: false, message: "Their membership isn't set to end." };
    await getStripe().subscriptions.update(sub.id, { cancel_at_period_end: false });
    await ref.set({ cancellation: FieldValue.delete(), cancelAtPeriodEnd: false, updatedAt: Timestamp.now() }, { merge: true });
    await logActivity(admin, { area: "members", action: "undid the cancellation of", label: m.name, href: "/portal/admin/members" });
    revalidatePath("/portal/admin/members");
    return { ok: true, message: `${m.name}'s membership continues. We've emailed them.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't keep the membership." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { EXIT_NOTE_MAX, EXIT_REASON_IDS, exitReasonLabel, type Cancellation, type ExitReason } from "@/lib/membership-exit";
import { logActivity } from "@/lib/admin/activity";
import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getStripe } from "@/lib/stripe/server";
import { stripeConfigured } from "@/lib/stripe/billing";

/*
  A MEMBER'S BILLING ACTIONS — the drawer's writes (Geekdom decided members
  manage all billing in the portal and never see Stripe's hosted pages).

  WHO: always the SESSION's member, looked up by their email — never an id
  from the browser — and only the one who PAYS: a teammate on someone else's
  Team membership has no billing (the owner holds it). Card numbers never
  reach these: the browser sends them straight to Stripe (a SetupIntent);
  this only ever sees the SetupIntent's id.

  Stripe stays the source of truth. Each action also writes what it changed
  onto the member's record at once (so the page reads right immediately);
  the webhook writes the same thing when Stripe's event arrives.
*/

export interface BillingResult {
  ok: boolean;
  message: string;
}

async function payer() {
  const user = await requireMember();
  if (!stripeConfigured()) throw new Error("Billing isn't connected yet.");
  const member = await getMemberByEmail(user.email);
  if (!member?.stripeCustomerId) throw new Error("There's no billing on this account.");
  if (member.teamOwnerId) throw new Error("Your team's owner handles the billing.");
  return member;
}

/** Create the member's Stripe customer if they have none. */
async function ensureCustomer() {
  const user = await requireMember();
  if (!stripeConfigured()) throw new Error("Billing isn't connected yet.");
  const member = await getMemberByEmail(user.email);
  if (!member || member.stripeCustomerId || member.teamOwnerId) return;
  const c = await getStripe().customers.create({ email: member.email, name: member.name, metadata: { memberId: member.id, app: "next-geekdom" } });
  await getAdminDb().collection(COLLECTIONS.members).doc(member.id).set({ stripeCustomerId: c.id, updatedAt: Timestamp.now() }, { merge: true });
}

const fail = (e: unknown): BillingResult => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong. Try again." });

function refresh() {
  revalidatePath("/portal/profile");
  revalidatePath("/portal");
}

/**
 * Step 1 of a new card: a SetupIntent the browser confirms with Stripe directly.
 * A member with no Stripe customer yet (the welcome flow's "Add a card") gets
 * one here — after the welcome page's auto-link found none for their email.
 */
export async function startCardUpdate(): Promise<BillingResult & { clientSecret?: string }> {
  try {
    await ensureCustomer();
    const m = await payer();
    const si = await getStripe().setupIntents.create({
      customer: m.stripeCustomerId!,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: { memberId: m.id, app: "next-geekdom" },
    });
    return { ok: true, message: "", clientSecret: si.client_secret ?? undefined };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Step 2: the browser confirmed the card with Stripe. Make it the card every
 * payment uses — and if something's owed, pay it with the new card now.
 */
export async function finishCardUpdate(setupIntentId: string): Promise<BillingResult> {
  try {
    const m = await payer();
    if (typeof setupIntentId !== "string" || !setupIntentId.startsWith("seti_")) throw new Error("That didn't come through. Try again.");
    const stripe = getStripe();
    const si = await stripe.setupIntents.retrieve(setupIntentId);
    const customer = typeof si.customer === "string" ? si.customer : si.customer?.id;
    // The SetupIntent must be THIS member's, and done.
    if (customer !== m.stripeCustomerId || si.status !== "succeeded") throw new Error("That card couldn't be saved. Try again.");
    const pm = typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id;
    if (!pm) throw new Error("That card couldn't be saved. Try again.");

    const hadCard = Boolean((await stripe.customers.retrieve(m.stripeCustomerId!).then((c) => (c.deleted ? null : c.invoice_settings?.default_payment_method)).catch(() => null)));
    await stripe.customers.update(m.stripeCustomerId!, { invoice_settings: { default_payment_method: pm } });
    if (m.stripeSubscriptionId) await stripe.subscriptions.update(m.stripeSubscriptionId, { default_payment_method: pm });

    // Anything owed? Pay it with the new card straight away.
    const open = await stripe.invoices.list({ customer: m.stripeCustomerId!, status: "open", limit: 5 });
    let paid = 0;
    for (const inv of open.data) {
      if (!inv.id || inv.amount_due <= 0) continue;
      try {
        await stripe.invoices.pay(inv.id, { payment_method: pm });
        paid += inv.amount_due;
      } catch {
        refresh();
        return { ok: false, message: "Your new card is saved, but the payment didn't go through. Try another card, or contact your bank." };
      }
    }
    refresh();
    return {
      ok: true,
      message: paid
        ? `Card updated, and your ${usd(paid)} payment went through — you're all set.`
        : hadCard
          ? "Card updated. Future payments use the new card."
          : "Card saved.",
    };
  } catch (e) {
    return fail(e);
  }
}

/** Past due: retry what's owed on the card on file. */
export async function payNow(): Promise<BillingResult> {
  try {
    const m = await payer();
    const stripe = getStripe();
    const open = await stripe.invoices.list({ customer: m.stripeCustomerId!, status: "open", limit: 5 });
    const due = open.data.filter((i) => i.id && i.amount_due > 0);
    if (!due.length) return { ok: true, message: "Nothing's owed — you're all set." };
    let paid = 0;
    for (const inv of due) {
      try {
        await stripe.invoices.pay(inv.id!);
        paid += inv.amount_due;
      } catch {
        refresh();
        return { ok: false, message: "That card was declined again. Use a different card." };
      }
    }
    refresh();
    return { ok: true, message: `Paid ${usd(paid)}. Thanks — you're all set.` };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Cancel at the end of the paid period — or, with `cancel` false, keep the
 * membership after all. `survey` is the exit survey (lib/membership-exit.ts):
 * optional, both parts; stored on the member for staff, cleared on undo.
 */
export async function setCancelAtPeriodEnd(cancel: boolean, survey?: { reason?: string | null; note?: string }): Promise<BillingResult> {
  try {
    const m = await payer();
    if (!m.stripeSubscriptionId) throw new Error("There's no subscription on this account.");
    const sub = await getStripe().subscriptions.update(m.stripeSubscriptionId, { cancel_at_period_end: Boolean(cancel) });
    const reason = EXIT_REASON_IDS.includes(survey?.reason as ExitReason) ? (survey!.reason as ExitReason) : null;
    const note = typeof survey?.note === "string" ? survey.note.trim().slice(0, EXIT_NOTE_MAX) : "";
    const cancellation: Cancellation = { by: "member", how: "end_of_period", reason, note, at: new Date().toISOString() };
    await getAdminDb()
      .collection(COLLECTIONS.members)
      .doc(m.id)
      .set(
        { cancelAtPeriodEnd: sub.cancel_at_period_end, cancellation: sub.cancel_at_period_end ? cancellation : FieldValue.delete(), updatedAt: Timestamp.now() },
        { merge: true },
      );
    // In the activity log so staff see it — the member is the actor.
    await logActivity(
      { email: m.email, name: m.name },
      {
        area: "members",
        // Reads "Dana Ruiz cancelled their membership — I'm moving away".
        action: sub.cancel_at_period_end ? "cancelled their membership —" : "undid their cancellation —",
        label: sub.cancel_at_period_end ? (exitReasonLabel(reason) ?? "no reason given") : "they're staying",
        href: "/portal/admin/members",
      },
    );
    refresh();
    const end = sub.items.data[0]?.current_period_end;
    const date = end
      ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", day: "numeric", year: "numeric" }).format(new Date(end * 1000))
      : "the end of this period";
    return {
      ok: true,
      message: cancel ? `Your membership will end on ${date}. You keep full access until then.` : "Welcome back — your membership continues.",
    };
  } catch (e) {
    return fail(e);
  }
}

const usd = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

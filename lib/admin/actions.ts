"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import {
  COLLECTIONS,
  normalizeApplicationStatus,
  type ApplicationDecision,
  type ApplicationDoc,
  type ApplicationStatus,
  type MemberDoc,
} from "@/lib/firebase/collections";
import { canCheckout, createCheckoutSession } from "@/lib/stripe/server";
import { sendSafely, TEAM_NOTIFY_TO } from "@/lib/email/resend";
import {
  applicationApprovedEmail,
  applicationDeclinedEmail,
  paymentLinkEmail,
  teamReviewEmail,
} from "@/lib/email/application-templates";
import { planOf } from "@/lib/membership";
import { logActivity } from "@/lib/admin/activity";
import { ensureLogin } from "@/lib/admin/member-logins";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/*
  THE APPLICATION WORKFLOW — Geekdom's two-step review, every step a staff
  decision with its email:

    initial_review ──advance──▶ team_review ──approve──▶ approved
          └──decline──▶ declined ◀──decline──┘
    ban: from anywhere, no email · reopen: declined/banned → initial_review

  ONE TRANSITION TABLE, CHECKED IN A TRANSACTION. Each action names the
  statuses it may start from; the transaction re-reads the application and
  refuses if someone else moved it first, so two staff (or a double click)
  can never send two emails. Side effects — email, Stripe, creating a
  member — run AFTER the status is committed, and never undo it: a mail
  outage leaves the decision made and says so.

  `requireAdmin()` on every action: server actions are reachable by direct
  POST and never run a layout.
*/

type Move = "advance" | "approve" | "decline" | "ban" | "reopen";

const MOVES: Record<Move, { from: ApplicationStatus[]; to: ApplicationStatus; label: string }> = {
  advance: { from: ["initial_review"], to: "team_review", label: "sent to team review" },
  approve: { from: ["team_review"], to: "approved", label: "approved" },
  decline: { from: ["initial_review", "team_review"], to: "declined", label: "declined" },
  ban: { from: ["initial_review", "team_review", "approved", "declined"], to: "banned", label: "banned" },
  reopen: { from: ["declined", "banned"], to: "initial_review", label: "reopened" },
};

const stageOf = (s: ApplicationStatus): ApplicationDecision["stage"] =>
  s === "initial_review" ? "initial" : s === "team_review" ? "team" : "staff";

function refresh(id: string) {
  revalidatePath("/portal/admin/applications");
  revalidatePath(`/portal/admin/applications/${id}`);
  revalidatePath("/portal/admin");
}

export async function moveApplication(id: string, move: Move, note?: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const rule = MOVES[move];
  if (typeof id !== "string" || !id || !rule) return { ok: false, message: "That didn't come through. Refresh and try again." };
  const by = admin.name || admin.email;
  const cleanNote = typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : undefined;

  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  let application: ApplicationDoc;
  try {
    application = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Application not found.");
      const a = snap.data() as ApplicationDoc;
      const current = normalizeApplicationStatus(a.status);
      if (!rule.from.includes(current)) {
        throw new Error(`This application is ${current.replace("_", " ")} now — someone may have moved it. Refresh the page.`);
      }
      const decision: ApplicationDecision = {
        stage: stageOf(current),
        outcome: rule.label,
        by,
        at: Timestamp.now(),
        ...(cleanNote ? { note: cleanNote } : {}),
      };
      tx.update(ref, {
        status: rule.to,
        reviewedBy: admin.email,
        reviewedAt: FieldValue.serverTimestamp(),
        decisions: FieldValue.arrayUnion(decision),
      });
      return a;
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't update the application." };
  }

  await logActivity(admin, { area: "applications", action: rule.label, label: application.name, href: `/portal/admin/applications/${id}` });
  const message = await afterMove(id, move, application, by);
  refresh(id);
  return { ok: true, message };
}

/** The email (and, on approval, the payment link or the new member) a move implies. */
async function afterMove(id: string, move: Move, a: ApplicationDoc, by: string): Promise<string> {
  const plan = planOf(a.plan);

  if (move === "advance") {
    const mail = teamReviewEmail({
      id,
      name: a.name,
      email: a.email,
      company: a.company,
      plan: plan.id,
      city: a.city,
      describes: a.describes ?? [],
      brag: a.brag,
      building: a.building,
      by,
    });
    const sent = TEAM_NOTIFY_TO.length ? await sendSafely({ to: TEAM_NOTIFY_TO, subject: mail.subject, html: mail.html, text: mail.text }) : false;
    return sent ? "Sent to team review. The team has been emailed." : "Sent to team review. (The team email didn't send — tell them directly.)";
  }

  if (move === "decline") {
    const mail = applicationDeclinedEmail({ name: a.name });
    const sent = await sendSafely({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
    return sent ? "Declined. They've been emailed." : "Declined, but the email didn't send — let them know directly.";
  }

  if (move === "ban") return "Banned. No email was sent; if they apply again, it's marked banned automatically.";
  if (move === "reopen") return "Reopened for initial review. No email was sent.";

  // approve
  if (plan.id === "enterprise") {
    const member = await addEnterpriseMember(id, a);
    const mail = applicationApprovedEmail({ name: a.name, plan: plan.id, checkoutUrl: null });
    const sent = await sendSafely({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
    return [
      member ? "Approved and added as an Enterprise member." : "Approved, but their member record couldn't be created — add them on Members.",
      sent ? "The congratulations email went out." : "The congratulations email didn't send.",
    ].join(" ");
  }

  const checkoutUrl = await checkoutFor(id, a);
  const mail = applicationApprovedEmail({ name: a.name, plan: plan.id, checkoutUrl });
  const sent = await sendSafely({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
  if (sent && checkoutUrl) await getAdminDb().collection(COLLECTIONS.applications).doc(id).update({ invitedAt: Timestamp.now() });
  if (!sent) return "Approved, but the congratulations email didn't send. Use “Send payment link” to try again.";
  return checkoutUrl
    ? "Approved. The congratulations email went out with their payment link."
    : "Approved. The congratulations email went out; their payment link follows once Stripe is connected — use “Send payment link”.";
}

/** A checkout link for a paid plan, or null while Stripe isn't connected (or fails). */
async function checkoutFor(id: string, a: ApplicationDoc): Promise<string | null> {
  const plan = planOf(a.plan);
  if (!canCheckout(plan.id)) return null;
  try {
    const session = await createCheckoutSession({ email: a.email, name: a.name, applicationId: id, plan: plan.id });
    return session.url ?? null;
  } catch (error) {
    console.error("[applications] checkout failed", error);
    return null;
  }
}

/**
 * ENTERPRISE IS A MEMBER AT APPROVAL — its terms are agreed off the site,
 * so there's no checkout to wait for. Reuses an existing record for the
 * same email (one person, one membership) and creates their login so the
 * congratulations email's sign-in link works.
 */
async function addEnterpriseMember(applicationId: string, a: ApplicationDoc): Promise<boolean> {
  try {
    const col = getAdminDb().collection(COLLECTIONS.members);
    const email = a.email.trim().toLowerCase();
    const existing = await col.where("email", "==", email).limit(1).get();
    const now = Timestamp.now();
    if (existing.empty) {
      const doc: Partial<MemberDoc> = {
        name: a.name,
        email,
        applicationId,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        joinedAt: now,
        updatedAt: now,
        source: "application",
        plan: "enterprise",
        ...(a.company ? { company: a.company } : {}),
      };
      await col.add(doc);
    } else {
      await existing.docs[0].ref.set(
        { status: "active", plan: "enterprise", applicationId, ...(a.company ? { company: a.company } : {}), updatedAt: now },
        { merge: true },
      );
    }
    const login = await ensureLogin(email, a.name);
    return login.ok;
  } catch (error) {
    console.error("[applications] enterprise member failed", error);
    return false;
  }
}

/** Save staff notes without changing the application's status. */
export async function saveNotes(id: string, notes: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing application." };
  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  const before = (await ref.get()).data() as ApplicationDoc | undefined;
  if (!before) return { ok: false, message: "Application not found." };
  const next = String(notes ?? "").slice(0, 4000);
  if ((before.notes ?? "") === next) return { ok: true, message: "No changes to save." };
  await ref.update({ notes: next });
  // THAT the notes changed, never what they say: notes about an applicant
  // stay on the application, not copied into a second place.
  await logActivity(admin, { area: "applications", action: "updated the staff notes on", label: before.name, href: `/portal/admin/applications/${id}` });
  revalidatePath(`/portal/admin/applications/${id}`);
  return { ok: true, message: "Notes saved." };
}

/**
 * Send (or re-send) the payment link to an approved Solo or Team applicant
 * who hasn't paid — a lost email, an expired checkout, or the first send
 * once Stripe is connected. An explicit staff act, separate from approval,
 * so approving twice can never mail two links.
 */
export async function sendPaymentLink(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, message: "Application not found." };
  const a = snap.data() as ApplicationDoc;
  const plan = planOf(a.plan);
  if (normalizeApplicationStatus(a.status) !== "approved") return { ok: false, message: "Approve the application first." };
  if (plan.id === "enterprise") return { ok: false, message: "Enterprise has no payment link — terms are agreed directly." };
  if (a.paidAt) return { ok: false, message: "They've already paid — they're a member." };
  if (!canCheckout(plan.id)) return { ok: false, message: `Stripe isn't connected for the ${plan.name} plan yet.` };

  const checkoutUrl = await checkoutFor(id, a);
  if (!checkoutUrl) return { ok: false, message: "Couldn't create a payment link. Check the Stripe configuration." };
  const mail = paymentLinkEmail({ name: a.name, plan: plan.id, checkoutUrl });
  const sent = await sendSafely({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
  if (!sent) return { ok: false, message: "The email didn't send." };

  await ref.update({
    invitedAt: Timestamp.now(),
    decisions: FieldValue.arrayUnion({ stage: "staff", outcome: "sent the payment link", by: admin.name || admin.email, at: Timestamp.now() } satisfies ApplicationDecision),
  });
  await logActivity(admin, { area: "applications", action: "sent the payment link to", label: a.name, href: `/portal/admin/applications/${id}` });
  refresh(id);
  return { ok: true, message: "Payment link sent." };
}

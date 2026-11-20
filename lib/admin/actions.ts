"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { can, MANAGEMENT_ONLY_MESSAGE } from "@/lib/auth/roles";
import {
  COLLECTIONS,
  normalizeApplicationStatus,
  type ApplicationDecision,
  type ApplicationDoc,
  type ApplicationStatus,
  type MemberDoc,
} from "@/lib/firebase/collections";
import { hasWriting, MIN_DECLINE_REASON, RECOMMENDATIONS, RECOMMENDATION_LABELS, type ResearchRecommendation } from "@/lib/application-research";
import { cleanDoc } from "@/lib/field-notes/schemas";
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
  THE APPLICATION WORKFLOW — research, then the team's decision:

    initial_review ──advance──▶ team_review ──approve──▶ approved
     (Research)  └──decline──▶ declined ◀──decline──┘
    ban: from anywhere, no email · reopen: declined/banned → initial_review

  RESEARCH IS NOT THE DECISION (Geekdom, November 2026). Monica looks the
  applicant up and writes it up (`saveResearch`); "advance" sends that to
  the team, who decide in a meeting of three or four. So advance REQUIRES a
  saved write-up and a recommendation. She can still stop an obvious no —
  but a decline from research REQUIRES a written reason, kept in the
  history as the record the team can check later.

  ONE TRANSITION TABLE, CHECKED IN A TRANSACTION. Each action names the
  statuses it may start from; the transaction re-reads the application and
  refuses if someone else moved it first, so two staff (or a double click)
  can never send two emails. Side effects — email, Stripe, creating a
  member — run AFTER the status is committed, and never undo it: a mail
  outage leaves the decision made and says so.

  `requireAdmin()` on every action: server actions are reachable by direct
  POST and never run a layout.

  WHO MAY MOVE IT (lib/auth/roles.ts): research is Staff's — the write-up,
  sending it to the team, declining an obvious no. The TEAM'S DECISION
  (approve, decline from team review), ban and reopen are Management's
  (`applications.decide`): they email the applicant, send a payment link
  and make members. Checked inside the transaction, against the status it
  actually has.
*/

type Move = "advance" | "approve" | "decline" | "ban" | "reopen";

const MOVES: Record<Move, { from: ApplicationStatus[]; to: ApplicationStatus; label: string }> = {
  advance: { from: ["initial_review"], to: "team_review", label: "sent to team review" },
  approve: { from: ["team_review"], to: "approved", label: "approved" },
  decline: { from: ["initial_review", "team_review"], to: "declined", label: "declined" },
  ban: { from: ["initial_review", "team_review", "approved", "declined"], to: "banned", label: "banned" },
  reopen: { from: ["declined", "banned"], to: "initial_review", label: "reopened" },
};

const STAGE_NAMES: Record<ApplicationStatus, string> = {
  initial_review: "in research",
  team_review: "with the team",
  approved: "approved",
  declined: "declined",
  banned: "banned",
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
        throw new Error(`This application is ${STAGE_NAMES[current]} now — someone may have moved it. Refresh the page.`);
      }
      const decides = move === "approve" || move === "ban" || move === "reopen" || (move === "decline" && current === "team_review");
      if (decides && !can(admin.role, "applications.decide")) throw new Error(MANAGEMENT_ONLY_MESSAGE);
      let outcome = rule.label;
      if (move === "advance") {
        const r = a.research;
        if (!r || !hasWriting(safeDoc(r.doc))) throw new Error("Write up the research before sending it to the team.");
        if (!r?.recommendation) throw new Error("Pick a recommendation before sending it to the team.");
        outcome = `sent the research to the team — recommends ${RECOMMENDATION_LABELS[r.recommendation].split(" ")[0].toLowerCase()}`;
      }
      if (move === "decline" && current === "initial_review" && (cleanNote?.length ?? 0) < MIN_DECLINE_REASON) {
        throw new Error("Write the reason for declining in the note — it's kept for the team.");
      }
      const decision: ApplicationDecision = {
        stage: stageOf(current),
        outcome: move === "decline" && current === "initial_review" ? "declined at research" : outcome,
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

  await logActivity(admin, { area: "applications", action: move === "advance" ? "sent to the team" : rule.label, label: application.name, href: `/portal/admin/applications/${id}` });
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
      recommendation: a.research?.recommendation ?? null,
    });
    const sent = TEAM_NOTIFY_TO.length ? await sendSafely({ to: TEAM_NOTIFY_TO, subject: mail.subject, html: mail.html, text: mail.text }) : false;
    return sent ? "Sent to the team, with your research. They've been emailed a link." : "Sent to the team, with your research. (The team email didn't send — tell them directly.)";
  }

  if (move === "decline") {
    const mail = applicationDeclinedEmail({ name: a.name });
    const sent = await sendSafely({ to: a.email, subject: mail.subject, html: mail.html, text: mail.text });
    return sent ? "Declined. They've been emailed." : "Declined, but the email didn't send — let them know directly.";
  }

  if (move === "ban") return "Banned. No email was sent; if they apply again, it's marked banned automatically.";
  if (move === "reopen") return "Reopened for research. No email was sent.";

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

/** A stored write-up, parsed and rebuilt from the allowlist — never trusted as stored. */
function safeDoc(json: string | undefined) {
  try {
    return cleanDoc(JSON.parse(json ?? ""));
  } catch {
    return cleanDoc(null);
  }
}

const MAX_RESEARCH = 60_000; // characters of JSON — pages of notes, not a book

/**
 * Save the research write-up and recommendation. Open while the
 * application is in research or with the team (Monica fixes a typo, or
 * adds what came up in the meeting); closed once it's decided, so the
 * write-up stays what the decision was made on. Logged as THAT it changed,
 * never what it says — the same rule as staff notes.
 */
export async function saveResearch(id: string, doc: unknown, recommendation: unknown): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing application." };
  const clean = cleanDoc(doc);
  const json = JSON.stringify(clean);
  if (json.length > MAX_RESEARCH) return { ok: false, message: "That write-up is too long to save. Trim it, or move detail into links." };
  const rec = RECOMMENDATIONS.includes(recommendation as ResearchRecommendation) ? (recommendation as ResearchRecommendation) : null;

  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  let name = "";
  try {
    const changed = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Application not found.");
      const a = snap.data() as ApplicationDoc;
      name = a.name;
      const status = normalizeApplicationStatus(a.status);
      if (status !== "initial_review" && status !== "team_review") {
        throw new Error("This application has been decided, so the research is closed.");
      }
      const same = a.research && JSON.stringify(safeDoc(a.research.doc)) === json && (a.research.recommendation ?? null) === rec;
      if (same) return false;
      tx.update(ref, {
        research: { doc: json, recommendation: rec, by: admin.name || admin.email, byEmail: admin.email, updatedAt: Timestamp.now() },
      });
      return true;
    });
    if (!changed) return { ok: true, message: "No changes to save." };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't save the research." };
  }
  await logActivity(admin, { area: "applications", action: "updated the research on", label: name, href: `/portal/admin/applications/${id}` });
  revalidatePath(`/portal/admin/applications/${id}`);
  revalidatePath("/portal/admin/applications");
  return { ok: true, message: "Research saved." };
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

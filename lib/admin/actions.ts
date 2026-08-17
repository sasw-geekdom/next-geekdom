"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import {
  COLLECTIONS,
  type ApplicationDoc,
  type ApplicationStatus,
} from "@/lib/firebase/collections";
import { createCheckoutSession } from "@/lib/stripe/server";
import { sendSafely } from "@/lib/email/resend";
import { decisionEmail, inviteEmail } from "@/lib/email/templates";
import { priceLabel } from "@/lib/membership";

export interface ActionResult {
  ok: boolean;
  message: string;
}

/**
 * Move an application through review, sending whatever email that implies.
 *
 * `requireAdmin()` is called here and not left to the layout: server actions
 * are reachable by direct POST from anywhere and never run a layout. Skipping
 * it would let an unauthenticated request approve applications and mail out
 * checkout links.
 */
export async function decideApplication(
  id: string,
  status: ApplicationStatus,
  notes?: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, message: "Application not found." };

  const application = snap.data() as ApplicationDoc;

  await ref.update({
    status,
    ...(notes !== undefined ? { notes } : {}),
    reviewedBy: admin.email,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  let message = `Marked ${status}.`;

  if (status === "approved") {
    // Idempotency guard. Approving an already-approved application — a double
    // click, or a second pass through the queue — must not mint a second
    // checkout session and mail a second link to the same person.
    if (application.invitedAt) {
      message = "Already approved; invitation was sent earlier.";
    } else {
      try {
        const session = await createCheckoutSession({
          email: application.email,
          name: application.name,
          applicationId: id,
        });

        if (!session.url) throw new Error("Stripe returned no checkout URL.");

        const email = inviteEmail({
          name: application.name,
          checkoutUrl: session.url,
          priceLabel: priceLabel(),
        });

        const sent = await sendSafely({
          to: application.email,
          subject: email.subject,
          html: email.html,
        });

        // Only stamp invitedAt once the mail actually went out. Stamping on
        // the Stripe call alone would lock the applicant out of ever getting
        // their link if Resend happened to be down at that moment.
        if (sent) {
          await ref.update({ invitedAt: Timestamp.now() });
          message = "Approved — invitation sent.";
        } else {
          message =
            "Approved, but the invitation email failed to send. Use Resend invite.";
        }
      } catch (error) {
        console.error("[admin] invite failed", error);
        message =
          "Approved, but the checkout link could not be created. Check the Stripe configuration.";
      }
    }
  }

  if (status === "declined" || status === "waitlisted") {
    const email = decisionEmail({
      name: application.name,
      waitlisted: status === "waitlisted",
    });
    await sendSafely({
      to: application.email,
      subject: email.subject,
      html: email.html,
    });
    message =
      status === "waitlisted" ? "Waitlisted — notified." : "Declined — notified.";
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin");

  return { ok: true, message };
}

/** Save staff notes without changing the application's status. */
export async function saveNotes(
  id: string,
  notes: string,
): Promise<ActionResult> {
  await requireAdmin();

  await getAdminDb()
    .collection(COLLECTIONS.applications)
    .doc(id)
    .update({ notes: notes.slice(0, 4000) });

  revalidatePath(`/admin/applications/${id}`);
  return { ok: true, message: "Notes saved." };
}

/**
 * Re-send the checkout link for an already-approved application.
 *
 * Deliberately separate from `decideApplication` so the idempotency guard there
 * stays absolute: resending is an explicit act by staff, not something a stray
 * second click can trigger.
 */
export async function resendInvite(id: string): Promise<ActionResult> {
  await requireAdmin();

  const ref = getAdminDb().collection(COLLECTIONS.applications).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { ok: false, message: "Application not found." };

  const application = snap.data() as ApplicationDoc;
  if (application.status !== "approved") {
    return { ok: false, message: "Approve the application first." };
  }

  try {
    const session = await createCheckoutSession({
      email: application.email,
      name: application.name,
      applicationId: id,
    });
    if (!session.url) throw new Error("Stripe returned no checkout URL.");

    const email = inviteEmail({
      name: application.name,
      checkoutUrl: session.url,
      priceLabel: priceLabel(),
    });
    const sent = await sendSafely({
      to: application.email,
      subject: email.subject,
      html: email.html,
    });

    if (!sent) return { ok: false, message: "Email failed to send." };

    await ref.update({ invitedAt: Timestamp.now() });
    revalidatePath(`/admin/applications/${id}`);
    return { ok: true, message: "Fresh invitation sent." };
  } catch (error) {
    console.error("[admin] resend failed", error);
    return { ok: false, message: "Could not create a new checkout link." };
  }
}

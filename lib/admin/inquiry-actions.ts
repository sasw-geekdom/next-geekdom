"use server";

import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { COLLECTIONS, type InquiryDoc } from "@/lib/firebase/collections";
import { sendSafely } from "@/lib/email/resend";
import { inquiryAcceptedEmail, inquiryDeclinedEmail } from "@/lib/email/inquiry-templates";
import { logActivity } from "@/lib/admin/activity";
import type { InquiryStatus } from "@/lib/inquiries";

/*
  THE INQUIRY REVIEW — one step: new → accepted | declined, each emailing
  the requester; reopen moves a decline back to new, quietly. Same
  discipline as applications (lib/admin/actions.ts): the move is checked
  against its allowed starting statuses in a transaction, so a double click
  or two staff can't send two emails, and the email runs after the commit.
*/

type Move = "accept" | "decline" | "reopen";
const MOVES: Record<Move, { from: InquiryStatus[]; to: InquiryStatus; label: string }> = {
  accept: { from: ["new"], to: "accepted", label: "accepted" },
  decline: { from: ["new"], to: "declined", label: "declined" },
  reopen: { from: ["declined", "accepted"], to: "new", label: "reopened" },
};

export interface InquiryActionResult {
  ok: boolean;
  message: string;
}

function refresh(id: string) {
  revalidatePath("/portal/admin/requests");
  revalidatePath(`/portal/admin/requests/${id}`);
  revalidatePath("/portal/admin");
}

export async function moveInquiry(id: string, move: Move, note?: string): Promise<InquiryActionResult> {
  const admin = await requireAdmin();
  const rule = MOVES[move];
  if (typeof id !== "string" || !id || !rule) return { ok: false, message: "That didn't come through. Refresh and try again." };
  const by = admin.name || admin.email;
  const cleanNote = typeof note === "string" && note.trim() ? note.trim().slice(0, 2000) : undefined;
  const ref = getAdminDb().collection(COLLECTIONS.inquiries).doc(id);

  let inquiry: InquiryDoc;
  try {
    inquiry = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Inquiry not found.");
      const d = snap.data() as InquiryDoc;
      if (!rule.from.includes(d.status)) throw new Error(`This is ${d.status} now — someone may have moved it. Refresh the page.`);
      tx.update(ref, {
        status: rule.to,
        decisions: FieldValue.arrayUnion({ outcome: rule.label, by, at: Timestamp.now(), ...(cleanNote ? { note: cleanNote } : {}) }),
      });
      return d;
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't update it." };
  }

  await logActivity(admin, { area: "inquiries", action: rule.label, label: `${inquiry.company} (${inquiry.kind === "event" ? "event request" : "Studio partner"})`, href: `/portal/admin/requests/${id}` });

  let message = "Reopened. No email was sent.";
  if (move !== "reopen") {
    const mail = (move === "accept" ? inquiryAcceptedEmail : inquiryDeclinedEmail)(inquiry.kind, inquiry);
    const sent = await sendSafely({ to: inquiry.email, subject: mail.subject, html: mail.html, text: mail.text });
    message = `${move === "accept" ? "Accepted" : "Declined"}. ${sent ? `${inquiry.name} has been emailed.` : "The email didn't send — let them know directly."}`;
  }
  refresh(id);
  return { ok: true, message };
}

export async function saveInquiryNotes(id: string, notes: string): Promise<InquiryActionResult> {
  const admin = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, message: "Missing inquiry." };
  const ref = getAdminDb().collection(COLLECTIONS.inquiries).doc(id);
  const before = (await ref.get()).data() as InquiryDoc | undefined;
  if (!before) return { ok: false, message: "Request not found." };
  const next = String(notes ?? "").slice(0, 4000);
  if ((before.notes ?? "") === next) return { ok: true, message: "No changes to save." };
  await ref.update({ notes: next });
  // That they changed, never what they say (see saveNotes in ./actions.ts).
  await logActivity(admin, {
    area: "inquiries",
    action: "updated the staff notes on",
    label: `${before.company} (${before.kind === "event" ? "event request" : "Studio partner"})`,
    href: `/portal/admin/requests/${id}`,
  });
  revalidatePath(`/portal/admin/requests/${id}`);
  return { ok: true, message: "Notes saved." };
}

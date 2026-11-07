"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { loginStates } from "@/lib/admin/member-logins";
import { sendSafely } from "@/lib/email/resend";
import { portalInviteEmail } from "@/lib/email/member-templates";
import { logActivity } from "@/lib/admin/activity";
import { INVITES_LIVE, WAVE_LIMIT } from "@/lib/invitations";

/*
  SENDING THE LAUNCH INVITATIONS (lib/invitations.ts).

  A WAVE is refused while INVITES_LIVE is false, whatever the request says:
  the lock is here on the server, not only on the button. Live, it sends at
  most WAVE_LIMIT per call, one at a time (Resend's rate limit), skipping
  anyone who has already signed in or already been invited, and stamps
  `portalInvitedAt` on each member it reached.
*/

export interface InviteResult {
  ok: boolean;
  message: string;
}

export async function sendInvitations(memberIds: string[]): Promise<InviteResult> {
  const admin = await requireAdmin();
  if (!INVITES_LIVE) {
    return { ok: false, message: "Invitations are locked until launch — only previews can be sent. Nothing went out." };
  }
  if (!Array.isArray(memberIds) || !memberIds.length) return { ok: false, message: "Pick who this wave goes to." };

  const logins = await loginStates().catch(() => new Map());
  const col = getAdminDb().collection(COLLECTIONS.members);
  let sent = 0;
  let skipped = 0;
  for (const id of memberIds.slice(0, WAVE_LIMIT)) {
    if (typeof id !== "string") continue;
    const ref = col.doc(id);
    const m = (await ref.get()).data() as MemberDoc | undefined;
    const signedIn = m && logins.get(m.email)?.state === "active";
    if (!m || m.portalInvitedAt || signedIn || !["active", "trialing", "past_due"].includes(m.status)) {
      skipped++;
      continue;
    }
    const mail = portalInviteEmail({ name: m.name });
    if (await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text })) {
      await ref.update({ portalInvitedAt: Timestamp.now() });
      sent++;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  await logActivity(admin, { area: "members", action: "sent an invitation wave to", label: `${sent} members`, href: "/portal/admin/members/invitations" });
  revalidatePath("/portal/admin/members/invitations");
  revalidatePath("/portal/admin/members");
  const more = memberIds.length > WAVE_LIMIT ? ` Send again for the next ${Math.min(WAVE_LIMIT, memberIds.length - WAVE_LIMIT)}.` : "";
  return { ok: true, message: `Sent to ${sent}.${skipped ? ` Skipped ${skipped} (already invited, already signed in, or not current).` : ""}${more}` };
}

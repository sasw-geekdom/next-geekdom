import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { sendSafely } from "@/lib/email/resend";
import {
  teammateBackEmail,
  teammateContinuesEmail,
  teammateEndedEmail,
  teammateEndingEmail,
  teammatePausedEmail,
} from "@/lib/email/member-templates";

/*
  TELLING A TEAM'S PEOPLE when the team's membership changes (Jesse,
  November 2026). The owner's status is the team's (lib/team.ts
  syncTeamStatus), so a canceled or paused owner took every teammate's
  access with them without a word. Called where the team's status
  already changes:

    ending     the owner cancels at period end      webhook (cancel_at_period_end → true)
    continues  …and changes their mind              webhook (→ false)
    ended      the subscription ends                webhook (deleted); staff set Canceled
    paused     staff pause the owner                saveMember
    back       staff reactivate the owner           saveMember

  NEVER for past due: teammates keep access while the owner fixes a card,
  and an email would expose the owner's billing. Sends to everyone
  currently on the team (`teamOwnerId`), one at a time; a failure is
  logged, never thrown — the status change already happened.
*/

export type TeamChange = "ending" | "continues" | "ended" | "paused" | "back";

export async function notifyTeammates(ownerId: string, change: TeamChange, endDate?: string): Promise<number> {
  try {
    const col = getAdminDb().collection(COLLECTIONS.members);
    const owner = (await col.doc(ownerId).get()).data() as MemberDoc | undefined;
    if (!owner) return 0;
    const team = owner.company?.trim() || `${owner.name}'s team`;
    const snap = await col.where("teamOwnerId", "==", ownerId).get();
    let sent = 0;
    for (const d of snap.docs) {
      const m = d.data() as MemberDoc;
      if (!m.email) continue;
      const mail =
        change === "ending"
          ? teammateEndingEmail({ name: m.name, team, endDate: endDate || "the end of this billing period" })
          : change === "continues"
            ? teammateContinuesEmail({ name: m.name, team })
            : change === "ended"
              ? teammateEndedEmail({ name: m.name, team })
              : change === "paused"
                ? teammatePausedEmail({ name: m.name, team })
                : teammateBackEmail({ name: m.name, team });
      if (await sendSafely({ to: m.email, subject: mail.subject, html: mail.html, text: mail.text })) sent++;
    }
    return sent;
  } catch (e) {
    console.error("[team-notify] couldn't email the team", ownerId, change, e);
    return 0;
  }
}

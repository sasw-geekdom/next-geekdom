"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import { requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMemberByEmail } from "@/lib/admin/queries";
import { TERMS_VERSION, termsCurrent } from "@/lib/terms";

/**
 * Record that the signed-in member agrees to the CURRENT Terms of
 * Membership (lib/terms.ts). The member is resolved from the SESSION,
 * never from the request. Agreeing again to the same version keeps the
 * first date — it's when they agreed, not when they last saved.
 */
export async function acceptTerms(): Promise<{ ok: boolean; message: string }> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  if (!me) return { ok: false, message: "There's no membership on this account." };
  if (termsCurrent(me.terms)) return { ok: true, message: "Already agreed." };
  await getAdminDb()
    .collection(COLLECTIONS.members)
    .doc(me.id)
    .update({ terms: { version: TERMS_VERSION, acceptedAt: Timestamp.now() }, updatedAt: Timestamp.now() });
  revalidatePath("/portal", "layout");
  return { ok: true, message: "Thanks — you've agreed to the Terms of Membership." };
}

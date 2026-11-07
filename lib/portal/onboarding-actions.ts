"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMemberByEmail } from "@/lib/admin/queries";
import { ONBOARDING_STEPS, type OnboardingStep } from "@/lib/onboarding";

/*
  ONBOARDING PROGRESS — the member is the SESSION's, never an id from the
  request. Marking a step is idempotent (arrayUnion), so a double click or
  a step opened twice can't double-count.
*/

async function myRef() {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  return me ? getAdminDb().collection(COLLECTIONS.members).doc(me.id) : null;
}

export async function markOnboardingStep(step: OnboardingStep): Promise<void> {
  if (!ONBOARDING_STEPS.includes(step)) return;
  const ref = await myRef();
  if (!ref) return;
  await ref.set({ onboarding: { done: FieldValue.arrayUnion(step) } }, { merge: true });
  revalidatePath("/portal");
}

/** "Not now" (fold to one line) or "Resume" (open it again). */
export async function setOnboardingDismissed(dismissed: boolean): Promise<void> {
  const ref = await myRef();
  if (!ref) return;
  await ref.set({ onboarding: { dismissed } }, { merge: true });
  revalidatePath("/portal");
}

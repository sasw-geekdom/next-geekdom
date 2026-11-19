"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMemberByEmail } from "@/lib/admin/queries";
import { cookies } from "next/headers";
import { ONBOARDING_STEPS, WELCOME_SEEN_COOKIE, type OnboardingStep } from "@/lib/onboarding";

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

/**
 * The welcome flow (/portal/welcome) is done — or put off. Marks this
 * SIGN-IN as having seen it (the cookie; signing in clears it — see
 * WELCOME_EVERY_SIGN_IN) and, for a member, records it for good and ticks
 * "Check your profile". Staff (a preview) get the cookie only.
 */
export async function finishWelcome(): Promise<void> {
  const user = await requireMember();
  const store = await cookies();
  // 30 days — outlives a browser restart; signing in again resets it (app/api/auth/session).
  store.set(WELCOME_SEEN_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 30 * 86_400 });
  const me = await getMemberByEmail(user.email);
  if (me) {
    await getAdminDb()
      .collection(COLLECTIONS.members)
      .doc(me.id)
      .set({ onboarding: { welcomedAt: new Date(), done: FieldValue.arrayUnion("profile") } }, { merge: true });
  }
  revalidatePath("/portal");
}

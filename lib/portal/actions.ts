"use server";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { createPortalSession } from "@/lib/stripe/server";

/**
 * "Manage billing" on /portal/profile → Stripe's hosted customer portal.
 *
 * The member is resolved from the SESSION, never from the form — a server
 * action is a public POST endpoint, and a customer id in a hidden field
 * would let anyone open anyone's billing. Same idea as /account's emailed
 * link, minus the email: being signed in is the proof.
 */
export async function openBillingPortal(): Promise<void> {
  const user = await requireMember();
  const member = await getMemberByEmail(user.email);
  if (!member?.stripeCustomerId) redirect("/portal/profile?billing=none");

  let url: string;
  try {
    url = (await createPortalSession(member.stripeCustomerId, "/portal/profile")).url;
  } catch {
    redirect("/portal/profile?billing=error");
  }
  redirect(url);
}

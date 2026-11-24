import "server-only";

import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/roles";
import { getMemberByEmail } from "@/lib/admin/queries";
import { termsCurrent } from "@/lib/terms";

/**
 * THE MEMBER PORTAL'S PAGE GATE — every member-portal page but the welcome
 * page calls this instead of requireMember().
 *
 * A member who hasn't agreed to the CURRENT Terms of Membership (lib/terms.ts)
 * is sent to /portal/welcome, where agreeing sits on the profile step. This
 * is the real check: proxy.ts only sees the welcome cookie, which a person
 * can set by hand. Staff without a membership pass — they have no terms to
 * agree to (they see the welcome flow as a preview).
 */
export async function requirePortalMember(): Promise<SessionUser> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email).catch(() => null);
  if (me && !termsCurrent(me.terms)) redirect("/portal/welcome");
  return user;
}

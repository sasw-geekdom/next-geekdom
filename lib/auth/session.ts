import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberStatus } from "@/lib/firebase/collections";
import {
  isAdmin,
  resolveAdminRole,
  type AdminUser,
  type Role,
  type SessionUser,
} from "@/lib/auth/roles";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

/** Where a signed-out visitor is sent. Staff and members share one door. */
export const SIGN_IN_PATH = "/sign-in";
/** The member portal's home, and where a member lands on an admin URL. */
export const PORTAL_PATH = "/portal";
/** The admin layer, behind the Admin switch. */
export const ADMIN_PATH = "/portal/admin";

/**
 * A membership that still opens the door. `past_due` is in on purpose: a card
 * that failed yesterday shouldn't lock someone out of the portal where they
 * would go to fix it.
 */
const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];

/**
 * The full role for an email: admin rules first (no I/O), then a member
 * lookup. Admin wins, so a Geekdom employee who is also a member sees both.
 */
async function resolveRole(email: string | undefined | null): Promise<Role | null> {
  const admin = resolveAdminRole(email);
  if (admin) return admin;
  if (!email) return null;

  const snap = await getAdminDb()
    .collection(COLLECTIONS.members)
    .where("email", "==", email.trim().toLowerCase())
    .where("status", "in", CURRENT)
    .limit(1)
    .get();
  return snap.empty ? null : "member";
}

/*
  ONLY VERIFIED EMAILS.

  Every role is decided from the token's email — so the email has to be
  proven. Google and email-link sign-ins always are; a password account
  isn't, and its email is whatever was typed at sign-up. Firebase's self
  sign-up is off today, which is the only thing that stops someone making
  `anything@geekdom.com` with a password and being treated as staff: one
  console toggle from a hole. This closes it here regardless of that
  setting. Checked on the session cookie too, not just at sign-in.

  NOT A PASSWORD CHECK, and that was tried: `firebase.sign_in_provider` is
  "password" for EMAIL-LINK sign-ins as well (both are Firebase's email
  provider), so refusing it locked out every member. Passwords are off the
  form instead, and no login this app creates has one.
*/
function trusted(decoded: { email_verified?: boolean }) {
  return decoded.email_verified === true;
}

/**
 * Exchange a Firebase ID token for a server-verified session cookie.
 * Rejects any account that doesn't resolve to a role.
 * Returns the cookie string + maxAge on success, or null if not permitted.
 */
export async function createSession(
  idToken: string,
): Promise<{ cookie: string; maxAge: number; user: SessionUser } | null> {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  if (!trusted(decoded)) return null;
  const role = await resolveRole(decoded.email);
  if (!role) return null;

  const cookie = await getAdminAuth().createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN_MS,
  });

  return {
    cookie,
    maxAge: EXPIRES_IN_MS / 1000,
    user: {
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      role,
    },
  };
}

/**
 * Read + verify the current session. Returns the user or null, never throws.
 *
 * The role is resolved on EVERY call, not baked into the cookie: a member
 * whose membership lapses, or an employee who leaves the domain, loses access
 * on their next request rather than when the 5-day cookie expires.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    // checkRevoked = true — a disabled or rotated account loses access on its
    // next request rather than when the 5-day cookie happens to expire.
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    if (!trusted(decoded)) return null;
    const role = await resolveRole(decoded.email);
    if (!role) return null;

    return {
      uid: decoded.uid,
      email: decoded.email!,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      role,
    };
  } catch {
    return null;
  }
}

/** Guard for the member portal: any signed-in role. */
export async function requireMember(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(SIGN_IN_PATH);
  return user;
}

/**
 * Guard for server components, route handlers, and server actions in the
 * admin layer.
 *
 * Call this at the top of EVERY admin entry point, not just the layout —
 * route handlers and server actions are reachable by direct POST and don't
 * run layouts. proxy.ts only checks that a cookie exists. A signed-in MEMBER
 * is sent to the portal home rather than the sign-in page: they are signed
 * in, just not allowed here.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect(SIGN_IN_PATH);
  if (!isAdmin(user)) redirect(PORTAL_PATH);
  return user;
}

/** Guard that additionally requires the superadmin role. */
export async function requireRole(role: "superadmin"): Promise<AdminUser> {
  const user = await requireAdmin();
  if (role === "superadmin" && user.role !== "superadmin") {
    redirect(ADMIN_PATH);
  }
  return user;
}

/**
 * Guard for route handlers, which should return a 401 rather than a redirect —
 * `fetch` follows a 303 to the sign-in page and hands the caller an HTML body
 * where it expected JSON. Null for anyone who isn't staff, members included.
 */
export async function requireAdminApi(): Promise<AdminUser | null> {
  const user = await getSessionUser();
  return isAdmin(user) ? user : null;
}

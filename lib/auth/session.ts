import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/firebase/admin";
import { resolveRole, type AdminUser, type Role } from "@/lib/auth/roles";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export { SESSION_COOKIE };
const EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000; // 5 days

/**
 * Exchange a Firebase ID token for a server-verified session cookie.
 * Rejects any account that doesn't resolve to a role (domain gate + superadmin).
 * Returns the cookie string + maxAge on success, or null if not permitted.
 */
export async function createSession(
  idToken: string,
): Promise<{ cookie: string; maxAge: number; user: AdminUser } | null> {
  const decoded = await getAdminAuth().verifyIdToken(idToken, true);
  const role = resolveRole(decoded.email);
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

/** Read + verify the current session. Returns the admin user or null. */
export async function getSessionUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const session = store.get(SESSION_COOKIE)?.value;
  if (!session) return null;

  try {
    // checkRevoked = true — a disabled or rotated account loses access on its
    // next request rather than when the 5-day cookie happens to expire.
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    const role = resolveRole(decoded.email);
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

/**
 * Guard for server components, route handlers, and server actions.
 *
 * Call this at the top of EVERY admin entry point, not just the layout —
 * route handlers and server actions are reachable by direct POST and don't
 * run layouts. proxy.ts only checks that a cookie exists.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Guard that additionally requires the superadmin role. */
export async function requireRole(role: Role): Promise<AdminUser> {
  const user = await requireAdmin();
  if (role === "superadmin" && user.role !== "superadmin") {
    redirect("/admin");
  }
  return user;
}

/**
 * Guard for route handlers, which should return a 401 rather than a redirect —
 * `fetch` follows a 303 to the login page and hands the caller an HTML body
 * where it expected JSON.
 */
export async function requireAdminApi(): Promise<AdminUser | null> {
  return getSessionUser();
}

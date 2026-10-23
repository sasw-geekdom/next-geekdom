/**
 * Who may sign in, and as what.
 *
 * Three tiers:
 *   superadmin — full access, including approving applications and refunds.
 *                Listed explicitly, so it works for accounts outside the
 *                Workspace domain (contractors, the person who set this up).
 *   staff      — full admin. Any @geekdom.com Workspace account.
 *   member     — the member portal only. Not decided here: a member is an
 *                email with a current `members` doc, which takes a Firestore
 *                read, so that lookup lives in lib/auth/session.ts. This file
 *                stays dependency-free because client components import its
 *                types.
 *
 * Admin wins: a Geekdom employee who is also a member signs in as staff and
 * sees both the portal and the Admin switch.
 */
import { envOr } from "@/lib/env";

export type Role = "superadmin" | "staff" | "member";
export type AdminRole = Exclude<Role, "member">;

export interface SessionUser {
  uid: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: Role;
}

function superAdminEmails(): string[] {
  return envOr(process.env.SUPER_ADMIN_EMAILS, "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function allowedDomain(): string {
  return envOr(process.env.ALLOWED_WORKSPACE_DOMAIN, "geekdom.com").toLowerCase();
}

/** A signed-in user known to be staff or superadmin. */
export type AdminUser = SessionUser & { role: AdminRole };

export function isAdmin(user: SessionUser | null | undefined): user is AdminUser {
  return user?.role === "superadmin" || user?.role === "staff";
}

/**
 * The ADMIN role for an email, or null. Single source of truth for staff
 * access — every guard funnels through here. Members are resolved separately
 * (lib/auth/session.ts) because that needs Firestore.
 */
export function resolveAdminRole(email: string | undefined | null): AdminRole | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();

  if (superAdminEmails().includes(normalized)) return "superadmin";
  if (normalized.endsWith(`@${allowedDomain()}`)) return "staff";
  return null;
}

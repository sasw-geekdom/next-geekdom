/**
 * Who may enter the admin portal.
 *
 * Two tiers:
 *   superadmin — full access, including approving applications and refunds.
 *                Listed explicitly, so it works for accounts outside the
 *                Workspace domain (contractors, the person who set this up).
 *   staff      — full admin. Any @geekdom.com Workspace account.
 *
 * There is no "member" role here. Members never sign in to this app — they
 * manage billing through a Stripe portal link emailed to them on request
 * (see app/api/billing/portal). Keeping members out of Firebase Auth entirely
 * means the only accounts that exist are staff accounts.
 */
import { envOr } from "@/lib/env";

export type Role = "superadmin" | "staff";

export interface AdminUser {
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

/**
 * Resolve a role from an email, or null if the account is not permitted.
 * Single source of truth — every guard funnels through here.
 */
export function resolveRole(email: string | undefined | null): Role | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();

  if (superAdminEmails().includes(normalized)) return "superadmin";
  if (normalized.endsWith(`@${allowedDomain()}`)) return "staff";
  return null;
}

export function isAllowed(email: string | undefined | null): boolean {
  return resolveRole(email) !== null;
}

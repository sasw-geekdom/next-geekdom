/**
 * Who may sign in, and as what (Jesse, November 2026):
 *
 *   developer  — whoever built and maintains the site. Everything
 *                Management can do. Set by SUPER_ADMIN_EMAILS in the
 *                hosting settings, so it can't be removed from the admin and
 *                Geekdom can never lock itself out.
 *   management — Geekdom's leadership. Everything: the decisions that admit
 *                people, move money or speak for Geekdom in public, plus who
 *                has admin access. Given on the Admin access screen
 *                (lib/auth/admin-access.ts) by a Developer or Management.
 *   staff      — the daily work: research, requests, members' records,
 *                rooms, events, Field Notes. Any verified @geekdom.com
 *                address, or anyone added on the Admin access screen.
 *   member     — the member portal only. Not decided here: a member is an
 *                email with a current `members` doc, which takes a Firestore
 *                read, so that lookup lives in lib/auth/session.ts. This file
 *                stays dependency-free because client components import its
 *                types.
 *
 * WHAT EACH CAN DO IS `can(role, permission)`, below — one table. Every
 * server action checks it; the sidebar and buttons read it too, but hiding
 * a button is UX, never the gate.
 *
 * Admin wins: a Geekdom employee who is also a member signs in as staff and
 * sees both the portal and the Admin switch.
 */
import { envOr } from "@/lib/env";

export type Role = "developer" | "management" | "staff" | "member";
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

/** A signed-in user known to have an admin role. */
export type AdminUser = SessionUser & { role: AdminRole };

export function isAdmin(user: SessionUser | null | undefined): user is AdminUser {
  return user?.role === "developer" || user?.role === "management" || user?.role === "staff";
}

/** On screen. The code's names are never shown. */
export const ROLE_LABELS: Record<AdminRole, string> = {
  developer: "Developer",
  management: "Management",
  staff: "Staff",
};

/*
  WHAT ONLY MANAGEMENT (AND THE DEVELOPER) CAN DO. Everything not listed
  here is open to every admin role. The rule: Staff do the daily work;
  Management makes the calls that admit people, move money, or speak for
  Geekdom in public.
*/
export type Permission =
  /** Admin access: give and remove access, and Management. */
  | "access.manage"
  /** Tags & perks: create and change what a tag does. */
  | "tags.define"
  /** The team's decision on an application (approve, decline at team review), ban, reopen. */
  | "applications.decide"
  /** A member's money and standing: Stripe linking, starting billing, complimentary tags, pausing or canceling, the launch invitations. */
  | "members.money"
  /** CSV exports — the one action that takes personal details off the site. */
  | "data.export"
  /** The rooms themselves and the booking rules. */
  | "rooms.configure"
  /** Geekdom's public claims: Site copy, Portfolio, the Photo archive sync. */
  | "site.claims";

const MANAGEMENT_ONLY: readonly Permission[] = [
  "access.manage",
  "tags.define",
  "applications.decide",
  "members.money",
  "data.export",
  "rooms.configure",
  "site.claims",
];

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (role === "developer" || role === "management") return true;
  if (role === "staff") return !MANAGEMENT_ONLY.includes(permission);
  return false;
}

/** What a Staff user is told when they try one of the above. */
export const MANAGEMENT_ONLY_MESSAGE = "Only Geekdom management can do that.";

/**
 * The admin role from the HOSTING SETTINGS alone (Developer, or Staff by
 * domain). Call adminRoleFor() in lib/auth/admin-access.ts instead — it
 * adds the Admin access screen's list (Management, added, removed). Members are resolved separately
 * (lib/auth/session.ts) because that needs Firestore.
 */
export function resolveAdminRole(email: string | undefined | null): AdminRole | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();

  // Management is given on the Admin access screen, not here (adminRoleFor).
  if (superAdminEmails().includes(normalized)) return "developer";
  if (normalized.endsWith(`@${allowedDomain()}`)) return "staff";
  return null;
}

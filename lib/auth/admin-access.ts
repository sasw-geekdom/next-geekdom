import "server-only";

import { unstable_cache } from "next/cache";
import { dataKey, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { resolveAdminRole, type AdminRole } from "@/lib/auth/roles";

/*
  WHO HAS ADMIN ACCESS, beyond the two rules in lib/auth/roles.ts
  (SUPER_ADMIN_EMAILS from the hosting settings, and any verified
  @geekdom.com address). Managed by owners (the "superadmin" role) at /portal/admin/team —
  the scope of work's "manage administrative user access" (November 2026).

  One doc, `settings/adminAccess`:
    added    people outside @geekdom.com given staff access (a contractor,
             a Studio partner) — anyone at all, by email;
    removed  @geekdom.com addresses whose access is switched off without
             deleting their Workspace account (someone who left, a shared
             mailbox that shouldn't sign in).

  Owners are NOT in here and can't be removed from the screen: they
  come from the hosting settings, so nobody can lock the last one out.

  READ ON EVERY REQUEST (getSessionUser resolves the role each time), so it
  is cached — 30 seconds, tagged, and the change action clears the tag, so
  on the copy of the site where access changes it takes effect at once.
  Fails CLOSED for added people (an unreadable list adds no one) and OPEN
  for removed (an unreadable list removes no one) — with the database down,
  the admin is down anyway.
*/

export const ADMIN_ACCESS_TAG = "admin-access";
export const ADMIN_ACCESS_DOC = "adminAccess";

export interface AccessEntry {
  email: string;
  name: string;
  by: string;
  at: string; // ISO
}

export interface AdminAccess {
  added: AccessEntry[];
  removed: AccessEntry[];
}

export const adminAccessRef = () => getAdminDb().collection(COLLECTIONS.settings).doc(ADMIN_ACCESS_DOC);

const norm = (e: string) => e.trim().toLowerCase();

/** Uncached — for the screen and the actions. */
export async function readAdminAccess(): Promise<AdminAccess> {
  const d = (await adminAccessRef().get()).data() ?? {};
  const list = (v: unknown): AccessEntry[] =>
    Array.isArray(v)
      ? v
          .filter((x) => x && typeof x.email === "string")
          .map((x) => ({ email: norm(x.email), name: String(x.name ?? ""), by: String(x.by ?? ""), at: String(x.at ?? "") }))
      : [];
  return { added: list(d.added), removed: list(d.removed) };
}

const cached = unstable_cache(readAdminAccess, [dataKey("admin-access:v1")], { tags: [ADMIN_ACCESS_TAG], revalidate: 30 });

async function access(): Promise<AdminAccess> {
  try {
    return await cached();
  } catch {
    return { added: [], removed: [] };
  }
}

/**
 * THE admin role for an email, including the access list. Every place that
 * decides "is this person staff?" goes through here: the session on every
 * request, and the sign-in link route.
 */
export async function adminRoleFor(email: string | null | undefined): Promise<AdminRole | null> {
  if (!email) return null;
  const e = norm(email);
  const base = resolveAdminRole(e);
  if (base === "superadmin") return base;
  const list = await access();
  if (list.removed.some((r) => r.email === e)) return null;
  if (base) return base;
  return list.added.some((a) => a.email === e) ? "staff" : null;
}

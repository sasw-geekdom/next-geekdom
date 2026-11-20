import "server-only";

import { unstable_cache } from "next/cache";
import { dataKey, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { resolveAdminRole, type AdminRole } from "@/lib/auth/roles";

/*
  WHO HAS ADMIN ACCESS, beyond the two rules in lib/auth/roles.ts
  (SUPER_ADMIN_EMAILS from the hosting settings → Developer, and any
  verified @geekdom.com address → Staff). Managed by Management and the
  Developer at /portal/admin/team — the scope of work's "manage
  administrative user access" (November 2026).

  One doc, `settings/adminAccess`:
    management  people given the Management role (Brooke, Leslie) — by
                email, @geekdom.com or not; the entry is their access;
    added       people outside @geekdom.com given Staff access (a
                contractor, a Studio partner) — anyone at all, by email;
    removed     @geekdom.com addresses whose access is switched off without
                deleting their Workspace account (someone who left, a
                shared mailbox that shouldn't sign in);
    names       { email: "Brooke …" } — the name the admin shows for a
                person, typed once on the screen. Email-link logins carry
                no name, so without it the history and activity log read
                "brooke@geekdom.com". Wins over the login's own name.

  The Developer is NOT in here and can't be removed from the screen: it
  comes from the hosting settings, so nobody can lock everyone out.

  READ ON EVERY REQUEST (getSessionUser resolves the role each time), so it
  is cached — 30 seconds, tagged, and the change action clears the tag, so
  on the copy of the site where access changes it takes effect at once.
  Fails CLOSED for added people and Management (an unreadable list adds
  no one and promotes no one — Management falls back to Staff) and OPEN
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
  names: Record<string, string>;
  management: AccessEntry[];
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
  const names: Record<string, string> = {};
  if (d.names && typeof d.names === "object") {
    for (const [k, v] of Object.entries(d.names as Record<string, unknown>)) if (typeof v === "string" && v.trim()) names[norm(k)] = v.trim();
  }
  return { names, management: list(d.management), added: list(d.added), removed: list(d.removed) };
}

const cached = unstable_cache(readAdminAccess, [dataKey("admin-access:v3")], { tags: [ADMIN_ACCESS_TAG], revalidate: 30 });

async function access(): Promise<AdminAccess> {
  try {
    return await cached();
  } catch {
    return { names: {}, management: [], added: [], removed: [] };
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
  if (base === "developer") return base;
  const list = await access();
  if (list.removed.some((r) => r.email === e)) return null;
  if (list.management.some((m) => m.email === e)) return "management";
  if (base) return base;
  return list.added.some((a) => a.email === e) ? "staff" : null;
}

/** The name set on the Admin access screen, if any — the session prefers it to the login's. */
export async function adminNameFor(email: string | null | undefined): Promise<string | null> {
  if (!email) return null;
  return (await access()).names[norm(email)] ?? null;
}

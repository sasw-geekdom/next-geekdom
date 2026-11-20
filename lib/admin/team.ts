import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";
import { resolveAdminRole, type AdminRole } from "@/lib/auth/roles";
import { readAdminAccess } from "@/lib/auth/admin-access";

/*
  EVERYONE WITH ADMIN ACCESS, for the Admin access screen: the Developer
  (hosting settings), Management (the access list), @geekdom.com staff who
  have a login, people added on the screen (signed in or not yet), and
  @geekdom.com people whose access was removed (so it can be given back).
  One paged listUsers, like Members.
*/

export interface AdminPerson {
  email: string;
  name: string;
  role: AdminRole;
  /** Where the access comes from: the hosting settings, the @geekdom.com domain, or this screen. */
  source: "settings" | "domain" | "added";
  removed: boolean;
  lastSignIn: string | null;
  hasLogin: boolean;
  /** Set on this screen (vs. from their login), so it can be cleared. */
  named: boolean;
  /** Who added, promoted or removed them, and when (from the access list). */
  by: string | null;
  at: string | null;
}

export async function listAdminPeople(): Promise<AdminPerson[]> {
  const access = await readAdminAccess();
  const management = new Map(access.management.map((m) => [m.email, m]));
  const added = new Map(access.added.map((a) => [a.email, a]));
  const removed = new Map(access.removed.map((r) => [r.email, r]));
  const out = new Map<string, AdminPerson>();

  const person = (email: string, name: string, login: { lastSignIn: string | null; hasLogin: boolean }): AdminPerson | null => {
    const base = resolveAdminRole(email);
    const m = management.get(email);
    const a = added.get(email);
    const r = removed.get(email);
    if (!base && !m && !a && !r) return null;
    const isRemoved = base !== "developer" && Boolean(r);
    return {
      email,
      // A login whose "name" is just its email has no name.
      name: [access.names[email], name, m?.name, a?.name].find((n) => n && n.toLowerCase() !== email) ?? "",
      role: base === "developer" ? "developer" : m ? "management" : "staff",
      source: base === "developer" ? "settings" : base === "staff" ? "domain" : "added",
      removed: isRemoved,
      named: Boolean(access.names[email]),
      ...login,
      by: (isRemoved ? r : (m ?? a))?.by ?? null,
      at: (isRemoved ? r : (m ?? a))?.at ?? null,
    };
  };

  let pageToken: string | undefined;
  do {
    const page = await getAdminAuth().listUsers(1000, pageToken);
    for (const u of page.users) {
      const email = u.email?.toLowerCase();
      if (!email) continue;
      const p = person(email, u.displayName ?? "", {
        lastSignIn: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
        hasLogin: true,
      });
      if (p) out.set(email, p);
    }
    pageToken = page.pageToken;
  } while (pageToken);

  // Given access, but no login yet — they get one the first time they ask for a link.
  for (const e of [...access.management, ...access.added]) {
    if (out.has(e.email)) continue;
    const p = person(e.email, e.name, { lastSignIn: null, hasLogin: false });
    if (p) out.set(e.email, p);
  }
  const rank: Record<AdminRole, number> = { developer: 0, management: 1, staff: 2 };
  return [...out.values()].sort(
    (x, y) => Number(x.removed) - Number(y.removed) || rank[x.role] - rank[y.role] || (x.name || x.email).localeCompare(y.name || y.email),
  );
}

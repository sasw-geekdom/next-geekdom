import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";
import { resolveAdminRole } from "@/lib/auth/roles";
import { readAdminAccess } from "@/lib/auth/admin-access";

/*
  EVERYONE WITH ADMIN ACCESS, for the Team screen: owners (hosting
  settings), @geekdom.com staff who have a login, people added on the
  screen (signed in or not yet), and @geekdom.com people whose access was
  removed (so it can be given back). One paged listUsers, like Members.
*/

export interface AdminPerson {
  email: string;
  name: string;
  /** Where the access comes from. */
  source: "super" | "domain" | "added";
  removed: boolean;
  lastSignIn: string | null;
  hasLogin: boolean;
  /** Who added or removed them, and when (from the access list). */
  by: string | null;
  at: string | null;
}

export async function listAdminPeople(): Promise<AdminPerson[]> {
  const access = await readAdminAccess();
  const added = new Map(access.added.map((a) => [a.email, a]));
  const removed = new Map(access.removed.map((r) => [r.email, r]));
  const out = new Map<string, AdminPerson>();

  let pageToken: string | undefined;
  do {
    const page = await getAdminAuth().listUsers(1000, pageToken);
    for (const u of page.users) {
      const email = u.email?.toLowerCase();
      if (!email) continue;
      const base = resolveAdminRole(email);
      const a = added.get(email);
      const r = removed.get(email);
      if (!base && !a && !r) continue;
      out.set(email, {
        email,
        name: u.displayName ?? a?.name ?? "",
        source: base === "superadmin" ? "super" : base === "staff" ? "domain" : "added",
        removed: Boolean(r) && base !== "superadmin",
        lastSignIn: u.metadata.lastSignInTime ? new Date(u.metadata.lastSignInTime).toISOString() : null,
        hasLogin: true,
        by: (r ?? a)?.by ?? null,
        at: (r ?? a)?.at ?? null,
      });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  // Added, but no login yet — they get one the first time they ask for a link.
  for (const a of access.added) {
    if (!out.has(a.email)) out.set(a.email, { email: a.email, name: a.name, source: "added", removed: false, lastSignIn: null, hasLogin: false, by: a.by, at: a.at });
  }
  const rank = { super: 0, domain: 1, added: 2 } as const;
  return [...out.values()].sort((x, y) => Number(x.removed) - Number(y.removed) || rank[x.source] - rank[y.source] || (x.name || x.email).localeCompare(y.name || y.email));
}

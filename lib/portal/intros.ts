import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";

/*
  A MEMBER'S INTROS, for Profile (Jesse, November 2026): who they asked,
  and who asked them — so an intro isn't only an email that's gone once
  it's read. From `intros` (who, whom, when — the note is never stored;
  lib/portal/intro-actions.ts). Two equality queries, sorted here: no
  composite index. Names are read live, so a renamed member reads right;
  someone who's left still shows by name, without a link.
*/

export interface IntroRow {
  direction: "sent" | "received";
  otherId: string;
  otherName: string;
  /** Still a current, listed member — their profile can be opened. */
  listed: boolean;
  at: string; // ISO
}

const CURRENT = ["active", "trialing", "past_due"];

export async function introsFor(memberId: string, limit = 10): Promise<IntroRow[]> {
  const db = getAdminDb();
  const col = db.collection(COLLECTIONS.intros);
  const [sent, received] = await Promise.all([col.where("fromId", "==", memberId).get(), col.where("toId", "==", memberId).get()]);
  const rows = [
    ...sent.docs.map((d) => ({ direction: "sent" as const, otherId: d.data().toId as string, at: d.data().at.toDate().toISOString() as string })),
    ...received.docs.map((d) => ({ direction: "received" as const, otherId: d.data().fromId as string, at: d.data().at.toDate().toISOString() as string })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, limit);
  if (!rows.length) return [];
  const ids = [...new Set(rows.map((r) => r.otherId))];
  const docs = await db.getAll(...ids.map((id) => db.collection(COLLECTIONS.members).doc(id)));
  const by = new Map(docs.map((d) => [d.id, d.data() as MemberDoc | undefined]));
  return rows.map((r) => {
    const m = by.get(r.otherId);
    return { ...r, otherName: m?.name ?? "A former member", listed: Boolean(m && CURRENT.includes(m.status) && m.profile?.listed !== false) };
  });
}

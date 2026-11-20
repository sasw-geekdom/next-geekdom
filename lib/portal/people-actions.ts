"use server";

import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { listDirectory } from "@/lib/directory";

/*
  PEOPLE TO MEET — the welcome flow's last step (Jesse, November 2026).
  Read when that step opens, AFTER step 1 saved their topics, so it uses
  what they just wrote. Up to three listed members, most topics in common
  first; with nobody sharing a topic yet (launch day), the newest members
  instead — "new to the Club too". Directory fields only, from the same
  listDirectory() the directory reads: no email, no phone.
*/

export interface PersonToMeet {
  id: string;
  name: string;
  headline: string;
  avatar: string | null;
  /** Their topics that match yours (the ones to show). Empty in the "newest" fallback. */
  shared: string[];
}

export async function peopleToMeet(): Promise<{ basis: "topics" | "newest"; people: PersonToMeet[] }> {
  const user = await requireMember();
  const [me, all] = await Promise.all([getMemberByEmail(user.email).catch(() => null), listDirectory().catch(() => [])]);
  const others = all.filter((m) => m.id !== me?.id);
  const mine = new Set((me?.profile?.askMeAbout ?? []).map((t) => t.toLowerCase()));
  const pick = (m: (typeof others)[number], shared: string[]): PersonToMeet => ({ id: m.id, name: m.name, headline: m.headline, avatar: m.avatar ?? null, shared });

  const scored = others
    .map((m) => ({ m, shared: m.askMeAbout.filter((t) => mine.has(t.toLowerCase())) }))
    .filter((x) => x.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length || b.m.memberSince.localeCompare(a.m.memberSince));
  if (scored.length) return { basis: "topics", people: scored.slice(0, 3).map((x) => pick(x.m, x.shared)) };

  const newest = [...others].sort((a, b) => b.memberSince.localeCompare(a.memberSince)).slice(0, 3);
  return { basis: "newest", people: newest.map((m) => pick(m, [])) };
}

import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc, type MemberStatus } from "@/lib/firebase/collections";
import type { Audience } from "@/lib/membership";

/*
  THE MEMBER DIRECTORY, FROM REAL MEMBERS — every CURRENT member whose
  profile isn't switched off. Listed by default (Geekdom's call); a member
  opts out at Profile → Edit. Only profile fields reach the page: no email,
  no phone, no billing. Read per request (the portal is signed-in and
  dynamic); one query, filtered here, so no composite index.
*/

const CURRENT: MemberStatus[] = ["active", "trialing", "past_due"];

export interface DirectoryMember {
  id: string;
  name: string;
  headline: string;
  role: string;
  company?: string;
  audience?: Audience;
  askMeAbout: string[];
  lookingFor?: string;
  bio: string;
  website?: string;
  linkedin?: string;
  memberSince: string; // ISO
  avatar?: string;
}

export async function listDirectory(): Promise<DirectoryMember[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.members).where("status", "in", CURRENT).get();
  return snap.docs
    .map((d) => ({ id: d.id, m: d.data() as MemberDoc }))
    .filter(({ m }) => m.profile?.listed !== false)
    .map(({ id, m }) => {
      const p = m.profile;
      return {
        id,
        name: m.name,
        headline: p?.headline ?? "",
        role: p?.role ?? "",
        company: p?.company || m.company || undefined,
        audience: (p?.audience || undefined) as Audience | undefined,
        askMeAbout: p?.askMeAbout ?? [],
        lookingFor: p?.lookingFor || undefined,
        bio: p?.bio ?? "",
        website: p?.website || undefined,
        linkedin: p?.linkedin || undefined,
        memberSince: m.joinedAt.toDate().toISOString(),
        avatar: m.photo || undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The "Ask me about" topics in use, most common first — the directory's
 * popular-topics row and the topic field's suggestions. Matched without
 * case; shown in the spelling most members used.
 */
export function topicsInUse(members: Pick<DirectoryMember, "askMeAbout">[]): { topic: string; count: number }[] {
  const by = new Map<string, Map<string, number>>();
  for (const m of members) {
    for (const t of new Set(m.askMeAbout.map((x) => x.trim()).filter(Boolean))) {
      const key = t.toLowerCase();
      const spellings = by.get(key) ?? new Map<string, number>();
      spellings.set(t, (spellings.get(t) ?? 0) + 1);
      by.set(key, spellings);
    }
  }
  return [...by.values()]
    .map((spellings) => {
      const [topic] = [...spellings.entries()].sort((a, b) => b[1] - a[1])[0];
      return { topic, count: [...spellings.values()].reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

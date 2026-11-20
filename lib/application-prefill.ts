import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type ApplicationDoc, type MemberDoc } from "@/lib/firebase/collections";

/*
  THE WELCOME FLOW STARTS FROM THEIR APPLICATION (Jesse, November 2026) —
  a draft to edit, not a blank form. The same mapping the Airtable import
  used (scripts/import-airtable.mjs):

    "In one sentence"           → Headline (cut at a word, 160 max)
    "What are you building?"    → About
    "LinkedIn or personal site" → LinkedIn or Website
    Company (Team, Enterprise)  → Company

  ONLY EMPTY FIELDS: anything the member already wrote wins. Read-only —
  nothing is saved until they press "Save and continue". The application
  itself never changes; it's staff's record of what they applied with.
*/

const headline = (s?: string) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length <= 160 ? t : `${t.slice(0, 157).replace(/\s+\S*$/, "")}…`;
};

function site(v?: string): { website: string; linkedin: string } {
  const t = (v ?? "").trim();
  if (!t) return { website: "", linkedin: "" };
  const href = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return /linkedin\.com/i.test(t) ? { website: "", linkedin: href } : { website: href, linkedin: "" };
}

/** The application they joined with: the one on their record, else their newest approved one by email. */
async function applicationOf(member: Pick<MemberDoc, "email" | "applicationId">): Promise<ApplicationDoc | null> {
  const col = getAdminDb().collection(COLLECTIONS.applications);
  if (member.applicationId) {
    const d = (await col.doc(member.applicationId).get()).data() as ApplicationDoc | undefined;
    if (d) return d;
  }
  const snap = await col.where("email", "==", member.email.trim().toLowerCase()).get();
  const apps = snap.docs.map((d) => d.data() as ApplicationDoc).filter((a) => a.status === "approved");
  apps.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return apps[0] ?? null;
}

export interface Prefill {
  headline: string;
  bio: string;
  website: string;
  linkedin: string;
  company: string;
}

/** What the application can fill in, for the fields the member left empty. Null when there's nothing to add. */
export async function prefillFromApplication(
  member: Pick<MemberDoc, "email" | "applicationId">,
  current: Prefill,
): Promise<{ fields: Prefill; used: (keyof Prefill)[] } | null> {
  const a = await applicationOf(member).catch(() => null);
  if (!a) return null;
  const links = site(a.website);
  const from: Prefill = { headline: headline(a.brag), bio: (a.building ?? "").trim(), website: links.website, linkedin: links.linkedin, company: (a.company ?? "").trim() };
  const fields = { ...current };
  const used: (keyof Prefill)[] = [];
  for (const k of Object.keys(from) as (keyof Prefill)[]) {
    if (!current[k].trim() && from[k]) {
      fields[k] = from[k];
      used.push(k);
    }
  }
  return used.length ? { fields, used } : null;
}

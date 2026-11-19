import "server-only";

import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { getStripe } from "@/lib/stripe/server";
import { env } from "@/lib/env";
import { bestPerk, compActive, type CompPeriod, type PerkTag } from "@/lib/perks";

/*
  TAGS & PERKS, ON THE SERVER (the rules are in lib/perks.ts).

  Definitions: one doc, `settings/memberTags` — `{ tags: PerkTag[] }`.
  Read uncached: the admin is the only reader, and a perk applied with a
  stale definition would give someone the wrong year.

  applyPerks() runs whenever staff save a member's tags (saveMember):
    · a perk tag ADDED, and no complimentary period running → stamp one
      on the member (`comp`), from today; if they have a Stripe
      subscription, PAUSE its billing until the period ends (Stripe
      `pause_collection`, behavior "void": no invoices are charged, and it
      resumes on its own at `resumes_at`)
    · the running period's tag REMOVED → end the period now, and resume
      billing if the site paused it
  A period already running isn't extended by adding the same tag again —
  re-tagging can't quietly hand out a second free year.
*/

const DOC = "memberTags";
const ref = () => getAdminDb().collection(COLLECTIONS.settings).doc(DOC);

export async function readPerkTags(): Promise<PerkTag[]> {
  const d = (await ref().get()).data();
  const list = Array.isArray(d?.tags) ? (d!.tags as PerkTag[]) : [];
  return list
    .filter((t) => t && typeof t.name === "string")
    .map((t) => ({
      name: t.name.toLowerCase(),
      label: t.label || t.name,
      effect: t.effect === "free_months" || t.effect === "free_forever" ? t.effect : "none",
      months: Number(t.months) || 12,
      note: t.note ?? "",
    }));
}

export const perkTagsRef = ref;

const stripeOn = () => Boolean(env(process.env.STRIPE_SECRET_KEY));

/** Pause a subscription's billing until `until` (or indefinitely). Returns whether it did. */
async function pauseBilling(subscriptionId: string, until: Date | null): Promise<boolean> {
  if (!stripeOn()) return false;
  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  if (sub.status === "canceled" || sub.status === "incomplete_expired") return false;
  await getStripe().subscriptions.update(subscriptionId, {
    pause_collection: { behavior: "void", ...(until ? { resumes_at: Math.floor(until.getTime() / 1000) } : {}) },
  });
  return true;
}

async function resumeBilling(subscriptionId: string) {
  if (!stripeOn()) return;
  await getStripe().subscriptions.update(subscriptionId, { pause_collection: "" });
}

/**
 * After a member's tags change. Returns a short note for the save message
 * ("Complimentary until … — billing paused"), or null if nothing changed.
 */
export async function applyPerks(
  memberRef: DocumentReference,
  before: MemberDoc | undefined,
  tags: string[],
  by: string,
): Promise<string | null> {
  const defs = await readPerkTags();
  const now = new Date();
  const current = (before?.comp ?? null) as CompPeriod | null;
  const running = compActive(current, now.getTime());

  // The running period's tag was taken off: end it, and resume billing we paused.
  if (running && !tags.includes(current.tag)) {
    if (current.paused && before?.stripeSubscriptionId) await resumeBilling(before.stripeSubscriptionId);
    await memberRef.set({ comp: { ...current, until: now.toISOString(), paused: false } }, { merge: true });
    return `Complimentary period ended — ${current.paused ? "billing resumed" : "no billing to resume"}.`;
  }
  if (running) return null;

  // A perk among the tags, and nothing running: start one.
  const best = bestPerk(tags, defs, now);
  if (!best) return null;
  // Only when the tag is NEW on this save — a tag that was already there and whose period ran out doesn't restart.
  if ((before?.tags ?? []).includes(best.tag.name)) return null;

  const paused = before?.stripeSubscriptionId ? await pauseBilling(before.stripeSubscriptionId, best.until).catch(() => false) : false;
  const comp: CompPeriod = {
    tag: best.tag.name,
    label: best.tag.label,
    since: now.toISOString(),
    until: best.until ? best.until.toISOString() : null,
    by,
    paused,
  };
  await memberRef.set({ comp }, { merge: true });
  return `Complimentary ${comp.until ? `for ${best.tag.effect === "free_months" ? `${best.tag.months} months` : "now"}` : "with no end date"}${paused ? " — their Stripe billing is paused until then" : ""}.`;
}

export async function membersWithTag(name: string): Promise<number> {
  const snap = await getAdminDb().collection(COLLECTIONS.members).where("tags", "array-contains", name).get();
  return snap.size;
}

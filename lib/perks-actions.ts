"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { logActivity } from "@/lib/admin/activity";
import { perkTagsRef, readPerkTags } from "@/lib/perks-server";
import { perkSummary, type PerkTag } from "@/lib/perks";

/*
  EDITING TAGS & PERKS — OWNERS ONLY (requireRole("superadmin")): a perk
  tag gives memberships away, so creating one is an owner's call; any staff
  can then apply it from a member's slide-out. One doc, saved in a
  transaction so two owners editing at once can't lose each other's change.
  Logged ("Tags & perks").

  Changing a tag's terms affects only members tagged AFTER the change —
  everyone already tagged keeps the period stamped on their record.
*/

export interface PerkResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const schema = z.object({
  /** The tag being edited (its key), or empty for a new one. */
  original: z.string().trim().toLowerCase().max(40).default(""),
  label: z.string({ error: "Name the tag." }).trim().min(2, "Name the tag.").max(40, "Keep it under 40 characters."),
  effect: z.enum(["none", "free_months", "free_forever"]),
  months: z.coerce.number().int().min(1, "At least 1 month.").max(60, "At most 60 months.").default(12),
  note: z.string().trim().max(300).default(""),
});

export async function savePerkTag(input: z.input<typeof schema>): Promise<PerkResult> {
  const me = await requireRole("superadmin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const { original, label, effect, months, note } = parsed.data;
  const tag: PerkTag = { name: label.toLowerCase(), label, effect, months, note };
  try {
    await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(perkTagsRef());
      const list = ((snap.data()?.tags as PerkTag[] | undefined) ?? []).filter((t) => t.name !== original);
      if (list.some((t) => t.name === tag.name)) throw new Error(`There's already a tag called "${label}".`);
      tx.set(perkTagsRef(), { tags: [...list, tag].sort((a, b) => a.name.localeCompare(b.name)) }, { merge: true });
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn't save the tag." };
  }
  await logActivity(me, { area: "perks", action: original ? "edited the tag" : "created the tag", label: `${label} — ${perkSummary(tag)}`, href: "/portal/admin/tags" });
  revalidatePath("/portal/admin/tags");
  revalidatePath("/portal/admin/members");
  return { ok: true, message: original ? "Tag saved. Members tagged from now on get the new terms." : "Tag created. Apply it from a member's slide-out." };
}

/** Removes the DEFINITION. Members keep the tag as a label, and any complimentary period already given. */
export async function deletePerkTag(name: string): Promise<PerkResult> {
  const me = await requireRole("superadmin");
  const key = String(name ?? "").trim().toLowerCase();
  const existing = (await readPerkTags()).find((t) => t.name === key);
  if (!existing) return { ok: false, message: "That tag no longer exists." };
  await getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(perkTagsRef());
    const list = ((snap.data()?.tags as PerkTag[] | undefined) ?? []).filter((t) => t.name !== key);
    tx.set(perkTagsRef(), { tags: list }, { merge: true });
  });
  await logActivity(me, { area: "perks", action: "deleted the tag", label: existing.label, href: "/portal/admin/tags" });
  revalidatePath("/portal/admin/tags");
  return { ok: true, message: `"${existing.label}" deleted. Members who had it keep any complimentary time already given.` };
}

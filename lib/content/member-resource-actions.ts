"use server";

import { revalidatePath, updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { fieldErrors } from "@/lib/validation/schemas";
import { logActivity } from "@/lib/admin/activity";
import {
  FAQ_GROUPS,
  MEMBER_RESOURCES_TAG,
  mergeMemberResources,
  memberResourcesRef,
  type MemberResources,
} from "@/lib/content/member-resources";
import type { ActionResult } from "@/lib/content/types";

/*
  WRITES FOR THE MEMBER PORTAL'S BASICS (lib/content/member-resources.ts).

  `requireAdmin()` → zod → a TRANSACTION over the one doc → activity →
  `updateTag` + the portal pages. A transaction because every edit rewrites
  the whole doc (the links and the FAQ are arrays): two staff saving at once
  would otherwise each write a copy missing the other's change.
*/

const LINK_RE = /^(https:\/\/|mailto:|\/)/;

const basicsSchema = z.object({
  slackInviteUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https:\/\//.test(v), "The invite link must start with https://."),
  wifiNetwork: z.string().trim().max(80),
  wifiPassword: z.string().trim().max(120),
  hours: z.string({ error: "Say when members can come in." }).trim().min(2, "Say when members can come in.").max(80),
});

const linkSchema = z.object({
  id: z.string().optional(),
  title: z.string({ error: "Give the link a title." }).trim().min(2, "Give the link a title.").max(60),
  description: z.string().trim().max(140),
  href: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || LINK_RE.test(v), "Use an https:// link, a mailto: address, or a page on this site starting with /."),
});

const faqSchema = z.object({
  id: z.string().optional(),
  group: z.enum(FAQ_GROUPS, { error: "Pick a section." }),
  q: z.string({ error: "Write the question." }).trim().min(5, "Write the question.").max(140),
  a: z.string({ error: "Write the answer." }).trim().min(5, "Write the answer.").max(1200),
  confirm: z.boolean(),
});

export type BasicsInput = z.input<typeof basicsSchema>;
export type LinkInput = z.input<typeof linkSchema>;
export type FaqInput = z.input<typeof faqSchema>;

function refresh() {
  updateTag(MEMBER_RESOURCES_TAG);
  revalidatePath("/portal");
  revalidatePath("/portal/resources");
  revalidatePath("/portal/admin/resources");
}

/** Read, change and write the doc in one transaction. */
async function update(change: (r: MemberResources) => MemberResources | string): Promise<string | null> {
  const ref = memberResourcesRef();
  return getAdminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const next = change(mergeMemberResources(snap.exists ? (snap.data() as Partial<MemberResources>) : undefined));
    if (typeof next === "string") return next; // an error message
    const { saved: _saved, ...doc } = next;
    void _saved;
    tx.set(ref, doc);
    return null;
  });
}

/** Swap with the nearest neighbor in `dir` that `same` accepts (a question's own section). */
const move = <T extends { id: string }>(list: T[], id: string, dir: -1 | 1, same: (a: T, b: T) => boolean = () => true): T[] => {
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return list;
  let j = i + dir;
  while (j >= 0 && j < list.length && !same(list[i], list[j])) j += dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export async function saveBasics(input: BasicsInput): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  await update((r) => ({ ...r, ...parsed.data }));
  await logActivity(user, { area: "member-resources", action: "edited", label: "Slack, Wi-Fi and hours", href: "/portal/admin/resources" });
  refresh();
  return { ok: true };
}

export async function saveLink(input: LinkInput): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = linkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const err = await update((r) => {
    if (id && !r.links.some((l) => l.id === id)) return "That link was removed. Refresh the page.";
    return {
      ...r,
      links: id ? r.links.map((l) => (l.id === id ? { id, ...data } : l)) : [...r.links, { id: randomUUID(), ...data }],
    };
  });
  if (err) return { ok: false, error: err };
  await logActivity(user, { area: "member-resources", action: id ? "edited" : "added", label: `The “${data.title}” link`, href: "/portal/admin/resources" });
  refresh();
  return { ok: true };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "Missing link." };
  let title = "A link";
  await update((r) => {
    title = r.links.find((l) => l.id === id)?.title ?? title;
    return { ...r, links: r.links.filter((l) => l.id !== id) };
  });
  await logActivity(user, { area: "member-resources", action: "removed", label: `The “${title}” link`, href: "/portal/admin/resources" });
  refresh();
  return { ok: true };
}

export async function saveFaq(input: FaqInput): Promise<ActionResult> {
  const user = await requireAdmin();
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { id, ...data } = parsed.data;
  const err = await update((r) => {
    if (id && !r.faq.some((f) => f.id === id)) return "That question was removed. Refresh the page.";
    return {
      ...r,
      faq: id ? r.faq.map((f) => (f.id === id ? { id, ...data } : f)) : [...r.faq, { id: randomUUID(), ...data }],
    };
  });
  if (err) return { ok: false, error: err };
  await logActivity(user, { area: "member-resources", action: id ? "edited" : "added", label: `“${data.q}”`, href: "/portal/admin/resources" });
  refresh();
  return { ok: true };
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  const user = await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "Missing question." };
  let q = "A question";
  await update((r) => {
    q = r.faq.find((f) => f.id === id)?.q ?? q;
    return { ...r, faq: r.faq.filter((f) => f.id !== id) };
  });
  await logActivity(user, { area: "member-resources", action: "removed", label: `“${q}”`, href: "/portal/admin/resources" });
  refresh();
  return { ok: true };
}

/** Move a link or a question one place up or down. Not logged: it's arrangement, not content. */
export async function moveResource(kind: "link" | "faq", id: string, dir: -1 | 1): Promise<ActionResult> {
  await requireAdmin();
  if ((kind !== "link" && kind !== "faq") || typeof id !== "string" || (dir !== -1 && dir !== 1)) {
    return { ok: false, error: "That didn't come through. Refresh and try again." };
  }
  await update((r) => (kind === "link" ? { ...r, links: move(r.links, id, dir) } : { ...r, faq: move(r.faq, id, dir, (a, b) => a.group === b.group) }));
  refresh();
  return { ok: true };
}

"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { logActivity } from "@/lib/admin/activity";
import { COPY_BY_KEY, COPY_PAGES } from "@/lib/content/site-copy-fields";
import { SITE_COPY_TAG, siteCopyRef } from "@/lib/content/site-copy";

/*
  SAVING A PIECE OF SITE COPY. requireAdmin → the field must be one we
  know, with text that fits its slot → a TRANSACTION over the one doc (two
  staff saving different fields at once would otherwise each write a copy
  missing the other's) → activity → updateTag + the page it's on.

  Saving the original text back, or resetting, REMOVES the edit, so the
  field follows the code's default again.
*/

export interface CopyResult {
  ok: boolean;
  message: string;
}

const clean = (kind: string, value: string) =>
  kind === "list"
    ? value
        .split("\n")
        .map((l) => l.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join("\n")
    : kind === "line"
      ? value.replace(/\s+/g, " ").trim()
      : value.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

async function write(key: string, next: string | null) {
  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(siteCopyRef());
    const values = { ...((snap.data()?.values ?? {}) as Record<string, string>) };
    if (next === null) delete values[key];
    else values[key] = next;
    tx.set(siteCopyRef(), { values, updatedAt: new Date() });
  });
}

function refresh(page: string) {
  updateTag(SITE_COPY_TAG);
  const path = COPY_PAGES.find((p) => p.id === page)?.path ?? "/";
  revalidatePath(path);
  revalidatePath("/portal/admin/copy");
}

export async function saveCopy(key: string, value: string): Promise<CopyResult> {
  const admin = await requireAdmin();
  const field = COPY_BY_KEY[key];
  if (!field || typeof value !== "string") return { ok: false, message: "That isn't a field we know." };
  const next = clean(field.kind, value);
  if (!next) return { ok: false, message: "It can't be empty — use “Reset to original” to go back." };
  if (next.length > field.max) return { ok: false, message: `That's ${next.length} characters; this spot holds ${field.max}.` };
  if (field.kind === "list" && next.split("\n").some((l) => l.length > 140)) return { ok: false, message: "Keep each item under 140 characters." };
  if (field.default.includes("{years}") && !next.includes("{years}")) return { ok: false, message: "Keep {years} in — it fills in the number of years." };

  // The original text saved back isn't an edit: store nothing.
  await write(key, next === field.default ? null : next);
  await logActivity(admin, { area: "site-copy", action: "edited", label: `${COPY_PAGES.find((p) => p.id === field.page)?.label} · ${field.section} · ${field.label}`, href: `/portal/admin/copy?page=${field.page}` });
  refresh(field.page);
  return { ok: true, message: "Saved. It's live on the site." };
}

export async function resetCopy(key: string): Promise<CopyResult> {
  const admin = await requireAdmin();
  const field = COPY_BY_KEY[key];
  if (!field) return { ok: false, message: "That isn't a field we know." };
  await write(key, null);
  await logActivity(admin, { area: "site-copy", action: "reset", label: `${COPY_PAGES.find((p) => p.id === field.page)?.label} · ${field.section} · ${field.label}`, href: `/portal/admin/copy?page=${field.page}` });
  refresh(field.page);
  return { ok: true, message: "Back to the original text." };
}

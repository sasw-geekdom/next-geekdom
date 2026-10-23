"use server";

import { revalidatePath, updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { fieldErrors } from "@/lib/validation/schemas";
import { companyId, PORTFOLIO_TAG, seedPortfolio } from "@/lib/content/portfolio";
import { LOGO_FILES, LOGO_HEIGHTS } from "@/lib/content/portfolio-options";
import type { ActionResult } from "@/lib/content/types";
import { isBlobLogoUrl, storeLogo, type LogoUploadResult } from "@/lib/content/logo-upload";

/*
  WRITES FOR "BUILT AT GEEKDOM". Same order as the event actions:
  requireAdmin → zod → write → updateTag + revalidatePath, here for every
  page that renders the wall (/, /studio) and /llms.txt, which lists it.
*/

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const THIS_YEAR = new Date().getFullYear();

const companySchema = z.object({
  id: z.string().optional(),
  name: z
    .string({ error: "Add the company's name." })
    .trim()
    .min(2, "Add the company's name.")
    .max(80, "Keep the name under 80 characters."),
  stage: z
    .string({ error: "Add a stage, like “Seed” or “Acquired 2022”." })
    .trim()
    .min(2, "Add a stage, like “Seed” or “Acquired 2022”.")
    .max(40, "Keep the stage under 40 characters."),
  founded: z.coerce
    .number({ error: "Add the year it started." })
    .int("Add the year it started.")
    .min(2011, "Geekdom opened in 2011.")
    .max(THIS_YEAR, `The year can't be after ${THIS_YEAR}.`),
  href: optional(300).refine((v) => !v || /^https?:\/\//.test(v), {
    message: "The link must start with http:// or https://.",
  }),
  link: z.enum(["site", "story", "video"]).optional(),
  description: optional(240),
  logo: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    // An uploaded logo (a Blob URL) or one of the files that shipped with the
    // site. Nothing else: the value lands in a CSS url() on the public wall.
    .refine((v) => !v || LOGO_FILES.includes(v) || isBlobLogoUrl(v), {
      message: "Upload the logo again.",
    }),
  logoHeight: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || LOGO_HEIGHTS.some((h) => h.value === v), {
      message: "Pick a size from the list.",
    }),
  logoMark: z.enum(["wordmark", "symbol"]).optional(),
  studio: z.boolean(),
  hidden: z.boolean(),
});

export type CompanyInput = z.input<typeof companySchema>;

function refresh() {
  updateTag(PORTFOLIO_TAG);
  revalidatePath("/");
  revalidatePath("/studio");
  revalidatePath("/llms.txt");
  revalidatePath("/portal/admin/portfolio");
}

/** Optional fields left blank are DELETED on save, not kept by the merge. */
const CLEARABLE = ["href", "link", "description", "logo", "logoHeight", "logoMark"] as const;

export async function saveCompany(input: CompanyInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const { id, ...data } = parsed.data;
  const col = getAdminDb().collection(COLLECTIONS.portfolio);
  // A new company gets a slug id; an existing one keeps its id even if
  // renamed, so a rename never leaves the old record behind.
  const docId = id || companyId(data.name);
  if (!id && (await col.doc(docId).get()).exists) {
    return { ok: false, fieldErrors: { name: "A company with this name is already on the wall." } };
  }

  const record: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  for (const [k, v] of Object.entries(data)) record[k] = v;
  // A new company joins the END of the wall; dragging moves it from there.
  if (!id) {
    const last = await col.orderBy("order", "desc").limit(1).get();
    record.order = last.empty ? 0 : ((last.docs[0].data().order as number) ?? 0) + 1;
  }
  for (const k of CLEARABLE) if (data[k] === undefined) record[k] = FieldValue.delete();

  await col.doc(docId).set(record, { merge: true });
  refresh();
  return { ok: true, id: docId };
}

const orderSchema = z
  .array(z.string().min(1).max(120), { error: "Missing the new order." })
  .min(1)
  .max(500);

/**
 * Save the wall's order after a drag: `ids` is every company, top-left to
 * bottom-right. Only `order` is written. Ids that no longer exist (deleted in
 * another tab) are skipped rather than recreated as empty records.
 */
export async function reorderPortfolio(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const parsed = orderSchema.safeParse(ids);
  if (!parsed.success || new Set(parsed.data).size !== parsed.data.length) {
    return { ok: false, error: "That order didn't come through. Refresh and try again." };
  }
  const col = getAdminDb().collection(COLLECTIONS.portfolio);
  const existing = new Set((await col.select().get()).docs.map((d) => d.id));
  const batch = getAdminDb().batch();
  parsed.data.forEach((id, i) => {
    if (existing.has(id)) batch.update(col.doc(id), { order: i });
  });
  await batch.commit();
  refresh();
  return { ok: true };
}

/**
 * Upload a logo from the drawer. Returns its URL for the preview; the
 * company record only points at it once the form is saved.
 */
export async function uploadLogo(form: FormData): Promise<LogoUploadResult> {
  await requireAdmin();
  const file = form.get("file");
  const name = String(form.get("name") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file to upload." };
  }
  return storeLogo(file, name);
}

export async function deleteCompany(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "Missing company." };
  await getAdminDb().collection(COLLECTIONS.portfolio).doc(id).delete();
  refresh();
  return { ok: true };
}

/**
 * "Copy from the current site": write PORTFOLIO into an EMPTY collection.
 * Refuses once anything is there. Ids are slugs, so even a race can only
 * overwrite a company with itself.
 */
export async function seedPortfolioFromSite(): Promise<ActionResult> {
  await requireAdmin();
  const col = getAdminDb().collection(COLLECTIONS.portfolio);
  if (!(await col.limit(1).get()).empty) {
    return { ok: false, error: "There are companies here already, so nothing was copied." };
  }
  const batch = getAdminDb().batch();
  const rows = seedPortfolio();
  for (const { id, doc } of rows) {
    batch.set(col.doc(id), { ...doc, updatedAt: FieldValue.serverTimestamp() });
  }
  await batch.commit();
  refresh();
  return { ok: true, count: rows.length };
}

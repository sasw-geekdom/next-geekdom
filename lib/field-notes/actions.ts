"use server";

import { revalidatePath, updateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type FieldNoteDoc } from "@/lib/firebase/collections";
import { fieldErrors } from "@/lib/validation/schemas";
import type { ActionResult } from "@/lib/content/types";
import { FIELD_NOTES_TAG, getNoteDoc } from "@/lib/field-notes/notes";
import { blobUrlsOf, checklist, contentSchema } from "@/lib/field-notes/schemas";
import { deleteNoteFiles, gradePhoto, prepareCard, storeCard, sweepNote, type MediaResult } from "@/lib/field-notes/media";
import { renderCard } from "@/lib/field-notes/og-card";
import type { NoteContent, NoteImage } from "@/lib/field-notes/types";

/*
  WRITES FOR FIELD NOTES. Same order as every content action here:
  `requireAdmin()` first (a server action is a public POST endpoint — the
  admin layout's check never runs for it), zod, the write, then `updateTag`
  so the cached public reads are fresh on the next request.

  A DRAFT SAVE ACCEPTS INCOMPLETE WORK. Only what's unsafe or unstorable is
  refused (contentSchema); whether the note is READY is the checklist, which
  `publishNote` enforces on the server — the admin's live checklist is the
  same function, so the two can't disagree.
*/

const col = () => getAdminDb().collection(COLLECTIONS.fieldNotes);
const validId = (id: unknown): id is string => typeof id === "string" && /^[\w-]{1,40}$/.test(id);

function refresh(id?: string) {
  updateTag(FIELD_NOTES_TAG);
  revalidatePath("/portal/admin/field-notes");
  if (id) revalidatePath(`/portal/admin/field-notes/${id}`);
  // The public side: the index, every note page (a publish can change the
  // "More Field Notes" shelf on all of them), the sitemap and llms.txt.
  revalidatePath("/field-notes");
  revalidatePath("/field-notes/[slug]", "page");
  revalidatePath("/field-notes/page/[n]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/llms.txt");
}

export async function createNote(): Promise<ActionResult> {
  const user = await requireAdmin();
  const ref = col().doc();
  const doc: Omit<FieldNoteDoc, "createdAt" | "updatedAt"> & Record<string, unknown> = {
    title: "",
    slug: "",
    dek: "",
    author: user.name ?? "",
    // A new note opens the way the reference carousels do: a cover, a
    // content frame, and a close that spotlights who wrote it.
    framesJson: JSON.stringify([
      { id: "cover", type: "cover", ground: "graphite", title: "", dek: "", layout: "full", series: "", credit: "" },
      { id: "text-1", type: "text", ground: "bone", size: "large", doc: { type: "doc", content: [{ type: "paragraph" }] } },
      { id: "author", type: "author", ground: "bone", name: user.name ?? "", role: "", company: "Geekdom", link: "" },
    ]),
    seo: { title: "", description: "" },
    status: "draft",
    createdBy: user.email,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await ref.set(doc);
  refresh();
  return { ok: true, id: ref.id };
}

function parse(content: unknown): { ok: true; data: NoteContent } | { ok: false; result: ActionResult } {
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) return { ok: false, result: { ok: false, fieldErrors: fieldErrors(parsed.error), error: "Some fields need fixing." } };
  return { ok: true, data: parsed.data as NoteContent };
}

function draftFields(c: NoteContent) {
  return {
    title: c.title,
    slug: c.slug,
    dek: c.dek,
    author: c.author,
    framesJson: JSON.stringify(c.frames),
    // `image` is optional; Firestore rejects undefined, so it's deleted.
    seo: { title: c.seo.title, description: c.seo.description, ...(c.seo.image ? { image: c.seo.image } : {}) },
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export async function saveDraft(id: string, content: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!validId(id)) return { ok: false, error: "Missing note." };
  const parsed = parse(content);
  if (!parsed.ok) return parsed.result;
  const ref = col().doc(id);
  if (!(await ref.get()).exists) return { ok: false, error: "That note no longer exists." };
  // `update`, not `set` + merge: a merge would keep a removed `seo.image`.
  await ref.update(draftFields(parsed.data));
  refresh(id);
  return { ok: true, id };
}

/** Is `slug` free — not this note's, not any other note's live or draft slug? */
async function slugTaken(id: string, slug: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    col().where("slug", "==", slug).limit(3).get(),
    col().where("publishedSlug", "==", slug).limit(3).get(),
  ]);
  return [...a.docs, ...b.docs].some((d) => d.id !== id);
}

export async function publishNote(id: string, content: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!validId(id)) return { ok: false, error: "Missing note." };
  const parsed = parse(content);
  if (!parsed.ok) return parsed.result;
  const c = parsed.data;

  const failing = checklist(c).filter((i) => !i.ok);
  if (failing.length) {
    return { ok: false, error: `Not ready to publish: ${failing.map((i) => i.label.toLowerCase()).join("; ")}.` };
  }
  if (await slugTaken(id, c.slug)) {
    return { ok: false, fieldErrors: { slug: "Another Field Note uses this slug." }, error: "That slug is taken." };
  }

  const ref = col().doc(id);
  const before = await getNoteDoc(id);
  if (!before) return { ok: false, error: "That note no longer exists." };

  let ogImage = c.seo.image;
  if (!ogImage) {
    try {
      ogImage = await storeCard(id, await renderCard(c));
    } catch (e) {
      return { ok: false, error: e instanceof Error ? `Couldn't make the share card: ${e.message}` : "Couldn't make the share card." };
    }
  }

  const movedFrom = before.publishedSlug && before.publishedSlug !== c.slug ? before.publishedSlug : null;
  await ref.update({
    ...draftFields(c),
    status: "published",
    publishedJson: JSON.stringify(c),
    publishedSlug: c.slug,
    ogImage,
    publishedUpdatedAt: FieldValue.serverTimestamp(),
    ...(before.publishedAt ? {} : { publishedAt: FieldValue.serverTimestamp() }),
    ...(movedFrom ? { previousSlugs: FieldValue.arrayUnion(movedFrom) } : {}),
  });

  // Draft and snapshot are now the same content, so `c` is everything to keep.
  await sweepNote(id, [...blobUrlsOf(c), ogImage]).catch(() => 0);
  refresh(id);
  return { ok: true, id };
}

export async function unpublishNote(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!validId(id)) return { ok: false, error: "Missing note." };
  await col().doc(id).update({
    status: "draft",
    publishedJson: FieldValue.delete(),
    publishedSlug: FieldValue.delete(),
    // An unpublished note can't stay the hero.
    featured: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  refresh(id);
  return { ok: true, id };
}

/**
 * Pin a live note as the /field-notes hero (or unpin it). One batch clears
 * every other pin, so there's never more than one.
 */
export async function setFeatured(id: string, on: boolean): Promise<ActionResult> {
  await requireAdmin();
  if (!validId(id)) return { ok: false, error: "Missing note." };
  const doc = await getNoteDoc(id);
  if (!doc) return { ok: false, error: "Missing note." };
  if (on && doc.status !== "published") return { ok: false, error: "Publish the note before featuring it." };
  const pinned = await col().where("featured", "==", true).get();
  const batch = getAdminDb().batch();
  pinned.docs.forEach((d) => d.id !== id && batch.update(d.ref, { featured: FieldValue.delete() }));
  batch.update(col().doc(id), { featured: on ? true : FieldValue.delete() });
  await batch.commit();
  refresh(id);
  return { ok: true, id };
}

export async function deleteNote(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (!validId(id)) return { ok: false, error: "Missing note." };
  await deleteNoteFiles(id).catch(() => 0);
  await col().doc(id).delete();
  refresh();
  return { ok: true };
}

/** Grade an uploaded original (or re-grade it to/from B&W). */
export async function processPhoto(
  id: string,
  originalUrl: string,
  bw: boolean,
): Promise<MediaResult<Omit<NoteImage, "alt">>> {
  await requireAdmin();
  if (!validId(id) || typeof originalUrl !== "string") return { ok: false, error: "Missing upload." };
  return gradePhoto(id, originalUrl, Boolean(bw));
}

/** Crop an uploaded share-card override to 1200×630. */
export async function processCard(id: string, originalUrl: string): Promise<MediaResult<string>> {
  await requireAdmin();
  if (!validId(id) || typeof originalUrl !== "string") return { ok: false, error: "Missing upload." };
  return prepareCard(id, originalUrl);
}

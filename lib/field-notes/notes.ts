import "server-only";

import { unstable_cache } from "next/cache";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type FieldNoteDoc } from "@/lib/firebase/collections";
import { contentSchema, fingerprint } from "@/lib/field-notes/schemas";
import type { AdminNote, NoteContent, PublishedNote } from "@/lib/field-notes/types";

/*
  FIELD NOTES READS.

  The admin reads uncached — it must see its own writes. The public reads
  (`getPublishedNote`, `listPublished`) go through `unstable_cache` tagged
  FIELD_NOTES_TAG, the same pattern as events and the portfolio; every write
  in actions.ts calls `updateTag` on it. They're here now, unused, so the
  public page is a page and nothing more when it's built.

  Content is re-parsed through `contentSchema` on the way OUT too, not just
  in: a doc edited by hand in the console can't put an unchecked link or a
  non-Blob image in front of a reader.
*/

export const FIELD_NOTES_TAG = "field-notes";

const iso = (t?: Timestamp) => (t ? t.toDate().toISOString() : null);

function parseContent(raw: unknown): NoteContent | null {
  const parsed = contentSchema.safeParse(raw);
  return parsed.success ? (parsed.data as NoteContent) : null;
}

function draftOf(d: FieldNoteDoc): NoteContent {
  let frames: unknown = [];
  try {
    frames = JSON.parse(d.framesJson || "[]");
  } catch {}
  return (
    parseContent({ title: d.title, slug: d.slug, dek: d.dek, author: d.author, frames, seo: d.seo ?? {} }) ?? {
      title: d.title ?? "",
      slug: "",
      dek: "",
      author: d.author ?? "",
      frames: [],
      seo: { title: "", description: "" },
    }
  );
}

function snapshotOf(d: FieldNoteDoc): NoteContent | null {
  if (!d.publishedJson) return null;
  try {
    return parseContent(JSON.parse(d.publishedJson));
  } catch {
    return null;
  }
}

function toAdmin(id: string, d: FieldNoteDoc): AdminNote {
  const draft = draftOf(d);
  const live = snapshotOf(d);
  return {
    id,
    ...draft,
    status: d.status === "published" && live ? "published" : "draft",
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
    publishedAt: iso(d.publishedAt),
    publishedSlug: live ? (d.publishedSlug ?? live.slug) : null,
    ogImage: d.ogImage ?? null,
    changed: live ? fingerprint(live) !== fingerprint(draft) : false,
  };
}

const notes = () => getAdminDb().collection(COLLECTIONS.fieldNotes);

/** Every note, newest edit first. Uncached — the admin's view. */
export async function listNotes(): Promise<AdminNote[]> {
  const snap = await notes().orderBy("updatedAt", "desc").get();
  return snap.docs.map((doc) => toAdmin(doc.id, doc.data() as FieldNoteDoc));
}

export async function getNote(id: string): Promise<AdminNote | null> {
  if (!/^[\w-]{1,40}$/.test(id)) return null;
  const doc = await notes().doc(id).get();
  return doc.exists ? toAdmin(doc.id, doc.data() as FieldNoteDoc) : null;
}

/** The raw doc, for actions that need fields the admin view leaves out. */
export async function getNoteDoc(id: string): Promise<FieldNoteDoc | null> {
  if (!/^[\w-]{1,40}$/.test(id)) return null;
  const doc = await notes().doc(id).get();
  return doc.exists ? (doc.data() as FieldNoteDoc) : null;
}

function toPublished(id: string, d: FieldNoteDoc): PublishedNote | null {
  const live = snapshotOf(d);
  if (d.status !== "published" || !live || !d.publishedAt || !d.ogImage) return null;
  return {
    id,
    ...live,
    publishedAt: d.publishedAt.toDate().toISOString(),
    updatedAt: (d.publishedUpdatedAt ?? d.publishedAt).toDate().toISOString(),
    ogImage: d.ogImage,
  };
}

const readPublished = unstable_cache(
  async (): Promise<PublishedNote[]> => {
    const snap = await notes().where("status", "==", "published").get();
    return snap.docs
      .map((doc) => toPublished(doc.id, doc.data() as FieldNoteDoc))
      .filter((n): n is PublishedNote => n !== null)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  },
  ["field-notes:published"],
  { tags: [FIELD_NOTES_TAG] },
);

/** Live notes, newest first. For the public index (not built yet). */
export async function listPublished(): Promise<PublishedNote[]> {
  try {
    return await readPublished();
  } catch {
    return [];
  }
}

/** One live note by its live slug. For the public page (not built yet). */
export async function getPublishedNote(slug: string): Promise<PublishedNote | null> {
  return (await listPublished()).find((n) => n.slug === slug) ?? null;
}

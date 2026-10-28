import "server-only";

import { unstable_cache } from "next/cache";
import type { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type FieldNoteDoc } from "@/lib/firebase/collections";
import { contentSchema, fingerprint } from "@/lib/field-notes/schemas";
import type { AdminNote, NoteContent, PublishedNote } from "@/lib/field-notes/types";
import { ON_LIVE_DOMAIN } from "@/lib/preview";
import { env } from "@/lib/env";
import { MOCK_FIELD_NOTES } from "@/data/mock/field-notes";

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
    featured: Boolean(live && d.featured),
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
    previousSlugs: d.previousSlugs ?? [],
    ...(d.featured ? { featured: true } : {}),
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

/** Live notes, newest first. For the public index. */
export async function listPublished(): Promise<PublishedNote[]> {
  try {
    return await readPublished();
  } catch {
    return [];
  }
}

/** One live note by its live slug. */
export async function getPublishedNote(slug: string): Promise<PublishedNote | null> {
  return (await listPublished()).find((n) => n.slug === slug) ?? null;
}

/** A note this slug USED to belong to — so an old link can redirect. */
export async function getNoteBySlugHistory(slug: string): Promise<PublishedNote | null> {
  return (await listPublished()).find((n) => n.previousSlugs.includes(slug)) ?? null;
}

/*
  WHAT READERS SEE — the live notes, plus, on REVIEW BUILDS ONLY, the six
  sample notes (data/mock/field-notes.ts) so the layout can be judged with
  something on it. Never on geekdom.com, and never in the sitemap, llms.txt
  or JSON-LD, which read `listPublished` / `getPublishedNote`: those stay
  real-only.
*/
export const SHOW_SAMPLES = !ON_LIVE_DOMAIN;

export const isSample = (n: Pick<PublishedNote, "id">) => n.id.startsWith("sample-");

/*
  SAMPLE_FIELD_NOTES_REPEAT (review builds only, server-side): repeat the six
  samples N times so the index's pagination can be seen working before there
  are 10+ real notes. Each copy gets its own id, slug (`…-2`) and a date five
  weeks further back. Capped at 20; unset or 1 is the plain six.
*/
const SAMPLES: PublishedNote[] = (() => {
  if (!SHOW_SAMPLES) return [];
  const repeat = Math.min(20, Math.max(1, Number.parseInt(env(process.env.SAMPLE_FIELD_NOTES_REPEAT) ?? "1", 10) || 1));
  const week = 7 * 24 * 60 * 60 * 1000;
  return Array.from({ length: repeat }, (_, k) =>
    MOCK_FIELD_NOTES.map((n) => {
      if (k === 0) return n;
      const at = new Date(new Date(n.publishedAt).getTime() - k * 5 * week).toISOString();
      return { ...n, id: `${n.id}-r${k + 1}`, slug: `${n.slug}-${k + 1}`, publishedAt: at, updatedAt: at, featured: false };
    }),
  ).flat();
})();

export async function listForReaders(): Promise<PublishedNote[]> {
  const live = await listPublished();
  if (!SHOW_SAMPLES) return live;
  return [...live, ...SAMPLES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * The index's order: the featured note first, then everything else newest
 * first. A REAL pinned note beats a sample's pin, so review builds show what
 * staff chose; no pin at all leaves the newest in front.
 */
export function indexOrder(all: PublishedNote[]): PublishedNote[] {
  const lead = all.find((n) => n.featured && !isSample(n)) ?? all.find((n) => n.featured) ?? all[0];
  return lead ? [lead, ...all.filter((n) => n !== lead)] : [];
}

export async function getNoteForReaders(slug: string): Promise<PublishedNote | null> {
  return (await getPublishedNote(slug)) ?? SAMPLES.find((n) => n.slug === slug) ?? null;
}

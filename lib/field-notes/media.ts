import "server-only";

import { createHash } from "node:crypto";
import { list, del, put } from "@vercel/blob";
import sharp from "sharp";
import { gradeRaw } from "@/lib/photo-grade.mjs";
import { hasEnv } from "@/lib/env";
import { isBlobUrl } from "@/lib/field-notes/schemas";
import type { NoteImage } from "@/lib/field-notes/types";

/*
  FIELD NOTES MEDIA, ON VERCEL BLOB.

  EVERYTHING A NOTE OWNS LIVES UNDER `field-notes/{noteId}/`, so deleting a
  note is one prefix sweep and two notes can never share (and so never
  co-delete) a file.

    originals/  what the browser uploaded, straight to Blob (see the upload
                route — a server action can't take a 15MB body; Vercel caps
                function requests at 4.5MB). Kept: B&W is toggled by
                re-grading the ORIGINAL, never a graded copy.
    photos/     the graded WebPs — 2400px and 1200px.
    video/      uploaded clips, as uploaded.
    cards/      share cards: generated at publish, or an uploaded override.

  EVERY PHOTOGRAPH GETS THE BRAND GRADE (AGENTS.md, Photography), through the
  same `gradeRaw` as the site's library and the /since-2011 wall. Share-card
  overrides don't: a card is a designed image, not a photograph.
*/

const LARGE = 2400;
const SMALL = 1200;
const token = () => process.env.BLOB_READ_WRITE_TOKEN;

export const notePrefix = (noteId: string) => `field-notes/${noteId}/`;

/** Is this URL one of THIS note's uploaded originals? */
function ownsOriginal(url: string, noteId: string): boolean {
  if (!isBlobUrl(url)) return false;
  const path = decodeURIComponent(new URL(url).pathname.slice(1));
  return path.startsWith(`${notePrefix(noteId)}originals/`);
}

async function fetchOriginal(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't read the upload (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

const upload = (path: string, body: Buffer, contentType: string) =>
  put(path, body, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
    // Explicit — see lib/content/logo-upload.ts (dev OIDC refusal).
    token: token(),
  });

export type MediaResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** A photograph: graded at full size, then the small copy cut from it. */
export async function gradePhoto(
  noteId: string,
  originalUrl: string,
  bw: boolean,
): Promise<MediaResult<Omit<NoteImage, "alt">>> {
  if (!hasEnv(token())) return { ok: false, error: "Uploads aren't connected (BLOB_READ_WRITE_TOKEN is missing)." };
  if (!ownsOriginal(originalUrl, noteId)) return { ok: false, error: "That upload doesn't belong to this note." };

  let source: Buffer;
  try {
    source = await fetchOriginal(originalUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't read the upload." };
  }

  let raw;
  try {
    raw = await sharp(source, { failOn: "none" })
      .rotate() // honor EXIF orientation
      .resize({ width: LARGE, withoutEnlargement: true })
      .removeAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer({ resolveWithObject: true });
  } catch {
    return { ok: false, error: "That file couldn't be read as a photo. Try a JPEG or PNG." };
  }
  const { width, height } = raw.info;
  if (Math.min(width, height) < 600) {
    return { ok: false, error: "That photo is too small — it needs to be at least 600px on its short side." };
  }

  const graded = gradeRaw(raw.data, width, height, { bw }).data;
  const rawIn = { raw: { width, height, channels: 3 as const } };
  const large = await sharp(graded, rawIn).webp({ quality: 80 }).toBuffer();
  const small = await sharp(graded, rawIn).resize({ width: SMALL, withoutEnlargement: true }).webp({ quality: 76 }).toBuffer({ resolveWithObject: true });

  const key = createHash("sha256").update(originalUrl).digest("hex").slice(0, 16) + (bw ? "-bw" : "");
  const base = `${notePrefix(noteId)}photos/${key}`;
  try {
    const [a, b] = await Promise.all([
      upload(`${base}-${LARGE}.webp`, large, "image/webp"),
      upload(`${base}-${SMALL}.webp`, small.data, "image/webp"),
    ]);
    return { ok: true, value: { src: a.url, srcSm: b.url, width, height, original: originalUrl, bw } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed." };
  }
}

/** A share-card override: at least 1200×630, cropped to exactly that. */
export async function prepareCard(noteId: string, originalUrl: string): Promise<MediaResult<string>> {
  if (!hasEnv(token())) return { ok: false, error: "Uploads aren't connected (BLOB_READ_WRITE_TOKEN is missing)." };
  if (!ownsOriginal(originalUrl, noteId)) return { ok: false, error: "That upload doesn't belong to this note." };
  let source: Buffer;
  try {
    source = await fetchOriginal(originalUrl);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't read the upload." };
  }
  const meta = await sharp(source).metadata().catch(() => null);
  if (!meta?.width || !meta.height) return { ok: false, error: "That file couldn't be read as an image." };
  if (meta.width < 1200 || meta.height < 630) {
    return { ok: false, error: `A share card needs to be at least 1200×630 — that one is ${meta.width}×${meta.height}.` };
  }
  const png = await sharp(source).rotate().resize(1200, 630, { fit: "cover" }).png().toBuffer();
  const key = createHash("sha256").update(png).digest("hex").slice(0, 16);
  const { url } = await upload(`${notePrefix(noteId)}cards/custom-${key}.png`, png, "image/png");
  return { ok: true, value: url };
}

/** Store a generated share card (lib/field-notes/og-card.tsx). */
export async function storeCard(noteId: string, png: Buffer): Promise<string> {
  const key = createHash("sha256").update(png).digest("hex").slice(0, 16);
  const { url } = await upload(`${notePrefix(noteId)}cards/card-${key}.png`, png, "image/png");
  return url;
}

async function listAll(prefix: string) {
  const out: { url: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, token: token() });
    out.push(...page.blobs.map((b) => ({ url: b.url, uploadedAt: b.uploadedAt })));
    cursor = page.cursor;
  } while (cursor);
  return out;
}

/**
 * Delete this note's files that nothing points at any more — replaced
 * photos, removed frames, old cards. Run at publish, with the draft AND the
 * new snapshot as `keep`. Anything uploaded in the last hour is spared, so a
 * photo mid-upload in another tab isn't swept out from under it.
 */
export async function sweepNote(noteId: string, keep: string[]): Promise<number> {
  if (!hasEnv(token())) return 0;
  const keepSet = new Set(keep);
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const stale = (await listAll(notePrefix(noteId)))
    .filter((b) => !keepSet.has(b.url) && b.uploadedAt.getTime() < hourAgo)
    .map((b) => b.url);
  if (stale.length) await del(stale, { token: token() });
  return stale.length;
}

/** Every file the note owns — for deleting the note. */
export async function deleteNoteFiles(noteId: string): Promise<number> {
  if (!hasEnv(token())) return 0;
  const all = (await listAll(notePrefix(noteId))).map((b) => b.url);
  if (all.length) await del(all, { token: token() });
  return all.length;
}

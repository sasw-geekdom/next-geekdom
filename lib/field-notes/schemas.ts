import * as z from "zod";
import type { Frame, FrameType, NoteContent, NoteVideo, RichDoc, RichMark, RichNode } from "@/lib/field-notes/types";

/*
  FIELD NOTES VALIDATION — pure, so the editor and the server share it: the
  checklist the admin shows is the one publish enforces.

  RICH TEXT IS AN ALLOWLIST, REBUILT. Tiptap hands the server JSON, and
  `cleanDoc` rebuilds it from scratch out of the few node and mark types the
  brand allows — anything else (an image node, a style attribute, a
  `javascript:` link) is dropped, not escaped. The reader renders that JSON
  with its own components (components/field-notes/rich-text.tsx), so there
  is no HTML anywhere and no sanitizer to keep current.
*/

export const LIMITS = {
  frames: 20,
  title: 120,
  dek: 160,
  slug: 80,
  author: 80,
  seoTitle: 60,
  seoDescriptionMin: 50,
  seoDescription: 160,
  caption: 240,
  quote: 280,
  alt: 250,
  textChars: 1200,
} as const;

export const FRAME_LABELS: Record<FrameType, string> = {
  cover: "Cover",
  text: "Text",
  image: "Photo",
  quote: "Quote",
  video: "Video",
};

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-$/, "");
}

/** Only our Blob store serves Field Notes media. */
export function isBlobUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** Links in text: https, mailto, or a path on this site. Nothing else. */
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const h = href.trim();
  if (!h || h.length > 2000) return null;
  if (/^\/(?!\/)/.test(h)) return h;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(h)) return h;
  try {
    const u = new URL(h);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export const isExternal = (href: string) => /^(https?:|mailto:)/i.test(href);

/** Any YouTube or Vimeo URL a person is likely to paste → its id. */
export function parseVideoUrl(input: string): Extract<NoteVideo, { source: "youtube" | "vimeo" }> | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const yt = /^[\w-]{11}$/;
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return yt.test(id) ? { source: "youtube", id } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && yt.test(v)) return { source: "youtube", id: v };
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    return m ? { source: "youtube", id: m[1] } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);
    return m ? { source: "vimeo", id: m[1] } : null;
  }
  return null;
}

// ─── Rich text ──────────────────────────────────────────────────────────────

const BLOCK_TYPES = new Set(["paragraph", "heading", "blockquote", "caption", "bulletList", "orderedList", "listItem"]);

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined;
  const out: RichMark[] = [];
  for (const m of marks) {
    const type = (m as { type?: unknown })?.type;
    if (type === "bold" || type === "italic") out.push({ type });
    if (type === "link") {
      const href = safeHref((m as { attrs?: { href?: unknown } }).attrs?.href);
      if (href) out.push({ type: "link", attrs: { href } });
    }
  }
  return out.length ? out : undefined;
}

function cleanNode(n: unknown, depth: number): RichNode | null {
  if (!n || typeof n !== "object" || depth > 8) return null;
  const node = n as RichNode;
  if (node.type === "text") {
    if (typeof node.text !== "string" || !node.text) return null;
    const marks = cleanMarks(node.marks);
    return { type: "text", text: node.text.slice(0, 5000), ...(marks ? { marks } : {}) };
  }
  if (node.type === "hardBreak") return { type: "hardBreak" };
  if (!BLOCK_TYPES.has(node.type)) return null;

  const content = Array.isArray(node.content)
    ? node.content.map((c) => cleanNode(c, depth + 1)).filter((c): c is RichNode => c !== null)
    : [];
  const out: RichNode = { type: node.type, ...(content.length ? { content } : {}) };
  if (node.type === "heading") {
    const level = node.attrs?.level === 3 ? 3 : 2;
    out.attrs = { level };
  }
  if (node.type === "orderedList") {
    const start = Number(node.attrs?.start);
    if (Number.isInteger(start) && start > 1 && start < 1000) out.attrs = { start };
  }
  return out;
}

export function cleanDoc(input: unknown): RichDoc {
  const content = Array.isArray((input as RichDoc)?.content)
    ? (input as RichDoc).content.map((c) => cleanNode(c, 0)).filter((c): c is RichNode => c !== null)
    : [];
  return { type: "doc", content };
}

export const EMPTY_DOC: RichDoc = { type: "doc", content: [{ type: "paragraph" }] };

/** The plain text of a doc — for counts, excerpts and the checklist. */
export function docText(doc: RichDoc): string {
  const walk = (n: RichNode): string =>
    n.type === "text" ? (n.text ?? "") : (n.content ?? []).map(walk).join(n.type === "paragraph" ? "" : " ");
  return doc.content.map(walk).join("\n").trim();
}

// ─── Frames and the note ────────────────────────────────────────────────────

const str = (max: number) => z.string().trim().max(max).catch("");
const ground = z.enum(["bone", "graphite"]).catch("bone");

const image = z.object({
  src: z.string().refine(isBlobUrl),
  srcSm: z.string().refine(isBlobUrl),
  original: z.string().refine(isBlobUrl),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().trim().max(LIMITS.alt),
  bw: z.boolean(),
});

const video = z.discriminatedUnion("source", [
  z.object({ source: z.enum(["youtube"]), id: z.string().regex(/^[\w-]{11}$/) }),
  z.object({ source: z.enum(["vimeo"]), id: z.string().regex(/^\d{6,12}$/) }),
  z.object({ source: z.literal("upload"), url: z.string().refine(isBlobUrl), loop: z.boolean() }),
]);

const id = z.string().regex(/^[\w-]{1,40}$/);

export const frameSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("cover"), ground, title: str(LIMITS.title), dek: str(LIMITS.dek), image: image.optional() }),
  z.object({ id, type: z.literal("text"), ground, doc: z.unknown().transform(cleanDoc) }),
  z.object({ id, type: z.literal("image"), image: image.optional(), caption: str(LIMITS.caption), fit: z.enum(["cover", "contain"]).catch("cover") }),
  z.object({ id, type: z.literal("quote"), ground, text: str(LIMITS.quote), attribution: str(LIMITS.author) }),
  z.object({ id, type: z.literal("video"), video: video.optional(), poster: image.optional(), caption: str(LIMITS.caption) }),
]);

/**
 * A DRAFT is allowed to be incomplete — blank title, empty frames, no slug.
 * Only what would be unsafe or unstorable is refused here; whether it's
 * READY is the checklist's job, at publish.
 */
export const contentSchema = z.object({
  title: str(LIMITS.title),
  slug: z
    .string()
    .trim()
    .max(LIMITS.slug)
    .refine((s) => s === "" || SLUG_RE.test(s), "Use lowercase letters, numbers and dashes."),
  dek: str(LIMITS.dek),
  author: str(LIMITS.author),
  frames: z.array(frameSchema).max(LIMITS.frames, `A Field Note holds up to ${LIMITS.frames} frames.`),
  seo: z.object({
    title: str(LIMITS.seoTitle),
    description: str(LIMITS.seoDescription),
    image: z.string().refine(isBlobUrl).optional(),
  }),
});

// ─── What "ready to publish" means ──────────────────────────────────────────

export const seoTitleOf = (c: Pick<NoteContent, "title" | "seo">) => c.seo.title || c.title;
export const seoDescriptionOf = (c: Pick<NoteContent, "dek" | "seo">) => c.seo.description || c.dek;

function imagesOf(f: Frame) {
  if (f.type === "cover" || f.type === "image") return f.image ? [f.image] : [];
  if (f.type === "video") return f.poster ? [f.poster] : [];
  return [];
}

export interface CheckItem {
  key: string;
  label: string;
  ok: boolean;
  /** Which frame to jump to when it fails. */
  frame?: number;
}

/**
 * The publish checklist. The admin renders it live; `publishNote` runs it
 * again on the server (plus slug uniqueness, which needs Firestore) and
 * refuses to publish while anything fails.
 */
export function checklist(c: NoteContent): CheckItem[] {
  const desc = seoDescriptionOf(c);
  const emptyFrame = c.frames.findIndex((f) => {
    if (f.type === "image") return !f.image;
    if (f.type === "video") return !f.video;
    if (f.type === "text") return !docText(f.doc);
    if (f.type === "quote") return !f.text;
    return false;
  });
  const noAlt = c.frames.findIndex((f) => imagesOf(f).some((i) => !i.alt.trim()));
  return [
    { key: "title", label: "A title", ok: c.title.trim().length >= 3 },
    { key: "slug", label: "A URL slug", ok: SLUG_RE.test(c.slug) },
    {
      key: "cover",
      label: "Opens on a cover frame with a title",
      ok: c.frames[0]?.type === "cover" && Boolean(c.frames[0].title.trim()),
      frame: 0,
    },
    { key: "frames", label: "At least one frame after the cover", ok: c.frames.length >= 2 },
    {
      key: "empty",
      label: "No empty frames",
      ok: emptyFrame === -1,
      ...(emptyFrame >= 0 ? { frame: emptyFrame } : {}),
    },
    {
      key: "alt",
      label: "Alt text on every photo",
      ok: noAlt === -1,
      ...(noAlt >= 0 ? { frame: noAlt } : {}),
    },
    {
      key: "description",
      label: `A description of ${LIMITS.seoDescriptionMin}–${LIMITS.seoDescription} characters`,
      ok: desc.length >= LIMITS.seoDescriptionMin && desc.length <= LIMITS.seoDescription,
    },
    { key: "author", label: "An author", ok: Boolean(c.author.trim()) },
  ];
}

/** Every Blob URL a note's content points at — for sweeping orphans. */
export function blobUrlsOf(c: Pick<NoteContent, "frames" | "seo">): string[] {
  const urls: string[] = [];
  for (const f of c.frames) {
    for (const i of imagesOf(f)) urls.push(i.src, i.srcSm, i.original);
    if (f.type === "video" && f.video?.source === "upload") urls.push(f.video.url);
  }
  if (c.seo.image) urls.push(c.seo.image);
  return urls;
}

/** Comparable form of the content — `changed` is draft ≠ snapshot. */
export const fingerprint = (c: NoteContent) =>
  JSON.stringify({ t: c.title, s: c.slug, d: c.dek, a: c.author, f: c.frames, o: c.seo });

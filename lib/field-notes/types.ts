/*
  FIELD NOTES — the shapes, shared by the admin, the reader and the server.

  A Field Note is a CAROUSEL OF FRAMES read sideways, Instagram-style (Jesse's
  call), not a long article. Each frame is one 4:5 panel of one kind.

  Nothing here imports server code: the admin editor, the reader component
  and the server actions all use these types.
*/

export type Ground = "bone" | "graphite";

/** A photograph, uploaded and graded (lib/field-notes/media.ts). */
export interface NoteImage {
  /** ≤2400px wide WebP, the reader's full-size copy. */
  src: string;
  /** ≤1200px wide WebP, for frames on a phone and the filmstrip. */
  srcSm: string;
  width: number;
  height: number;
  /** The camera original, kept so B&W can be toggled by re-grading from
      source — never grade a graded file (AGENTS.md, Photography). */
  original: string;
  alt: string;
  bw: boolean;
}

export type NoteVideo =
  | { source: "youtube" | "vimeo"; id: string }
  | { source: "upload"; url: string; loop: boolean };

/* Rich text: Tiptap's JSON, reduced to an allowlist (see schemas.ts). */
export type RichMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "link"; attrs: { href: string } };

export interface RichNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  text?: string;
  marks?: RichMark[];
}

export interface RichDoc {
  type: "doc";
  content: RichNode[];
}

export type Frame =
  | { id: string; type: "cover"; ground: Ground; title: string; dek: string; image?: NoteImage }
  | { id: string; type: "text"; ground: Ground; doc: RichDoc }
  | { id: string; type: "image"; image?: NoteImage; caption: string; fit: "cover" | "contain" }
  | { id: string; type: "quote"; ground: Ground; text: string; attribution: string }
  | { id: string; type: "video"; video?: NoteVideo; poster?: NoteImage; caption: string };

export type FrameType = Frame["type"];

export interface NoteSeo {
  /** Search title. Blank → the note's title. */
  title: string;
  /** Search and share description. Blank → the dek. */
  description: string;
  /** An uploaded share card that overrides the generated one. */
  image?: string;
}

/** Everything an editor changes — the draft, and the shape of a snapshot. */
export interface NoteContent {
  title: string;
  slug: string;
  dek: string;
  author: string;
  frames: Frame[];
  seo: NoteSeo;
}

/** The admin's view of one note. Dates are ISO strings (serializable). */
export interface AdminNote extends NoteContent {
  id: string;
  status: "draft" | "published";
  createdAt: string | null;
  updatedAt: string | null;
  /** First published. */
  publishedAt: string | null;
  /** The live slug, which can differ from the draft's until republished. */
  publishedSlug: string | null;
  /** The live share card (generated, or the uploaded override). */
  ogImage: string | null;
  /** The draft differs from what's live. */
  changed: boolean;
}

/** What the public page will read: the published snapshot only. */
export interface PublishedNote extends NoteContent {
  id: string;
  publishedAt: string;
  updatedAt: string;
  ogImage: string;
}

import "server-only";

import { unstable_cache } from "next/cache";
import { dataKey, getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, SITE_COPY_DOC } from "@/lib/firebase/collections";
import { COPY_BY_KEY, COPY_FIELDS, type CopyKey } from "@/lib/content/site-copy-fields";

/*
  THE PUBLIC PAGES' WORDS, as edited in the admin (Site content → Site
  copy). One doc, `settings/siteCopy`, holding ONLY the fields someone has
  changed: `{ values: { "home.hero.headline": "…" } }`. Anything absent is
  the text the page shipped with (site-copy-fields.ts), so an empty doc —
  or no database at all, as in a build without credentials — is today's
  site, word for word.

  Cached with a tag and a 60-second expiry, like member resources: a save
  clears this copy of the site at once (updateTag), and the expiry brings
  every other copy (previews, local) along within a minute. The cached read
  THROWS on error so a failure is never cached as the answer; the getter
  falls back to the defaults.
*/

export const SITE_COPY_TAG = "site-copy";

export const siteCopyRef = () => getAdminDb().collection(COLLECTIONS.settings).doc(SITE_COPY_DOC);

/** The edits only (key → text). Uncached — the admin must see its own writes. */
export async function readCopyEdits(): Promise<Record<string, string>> {
  const snap = await siteCopyRef().get();
  const values = (snap.data()?.values ?? {}) as Record<string, unknown>;
  // Only known keys with text — a stray or emptied field falls back to the default.
  return Object.fromEntries(Object.entries(values).filter(([k, v]) => COPY_BY_KEY[k] && typeof v === "string" && v.trim()) as [string, string][]);
}

const cached = unstable_cache(readCopyEdits, [dataKey("site-copy:v1")], { tags: [SITE_COPY_TAG], revalidate: 60 });

export interface SiteCopy {
  /** The text for a field — the edit if there is one, else the original. */
  (key: CopyKey): string;
  /** A list field, one item per line. */
  list: (key: CopyKey) => string[];
}

/** For the public pages: never throws, and falls back to the original text. */
export async function getSiteCopy(): Promise<SiteCopy> {
  let edits: Record<string, string> = {};
  try {
    edits = await cached();
  } catch {
    edits = {};
  }
  const get = ((key: CopyKey) => edits[key] ?? COPY_BY_KEY[key].default) as SiteCopy;
  get.list = (key: CopyKey) =>
    get(key)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  return get;
}

export { COPY_FIELDS };

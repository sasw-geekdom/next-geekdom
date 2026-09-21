import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, GALLERY_SETTINGS_DOC } from "@/lib/firebase/collections";

/**
 * The photo wall behind /since-2011.
 *
 * It reads a MANIFEST of pre-generated thumbnails rather than the originals
 * (see lib/gallery-sync.ts). Each entry is a small, CDN-hosted WebP on Vercel
 * Blob with known dimensions and a blur placeholder — so next/image renders
 * them fast, with no layout shift, and blurs up while loading. Pointing the
 * wall at fifteen years of full-resolution originals would be tens of
 * megabytes on one scroll.
 *
 * `getAdminDb()`, NOT a module-scope client. Firebase Admin throws at
 * construction when its key is missing, and Next evaluates every route module
 * while collecting page data during `next build` — a top-level client here
 * turns an unset env var into a build failure on machines that were never
 * going to call Firestore. See AGENTS.md.
 */
export interface GalleryImage {
  name: string;
  url: string;
  width: number;
  height: number;
  blurDataURL: string;
}

/** One thumbnail record as stored in the Firestore manifest. */
export interface GalleryManifestItem extends GalleryImage {
  /** MD5 of the source original — lets a re-sync skip unchanged photos. */
  md5: string;
}

const manifestDoc = () =>
  getAdminDb().collection(COLLECTIONS.settings).doc(GALLERY_SETTINGS_DOC);

/**
 * Deterministic pseudo-random key (FNV-1a) so the wall looks shuffled but
 * stays in a consistent order across reloads.
 *
 * NOT `Math.random()`, and that is load-bearing: this page is server-rendered,
 * so a random sort would produce a different order on the server than on the
 * client and React would refuse to hydrate it. Hashing the filename gives a
 * scramble that is stable per photo, survives a redeploy, and doesn't care how
 * the photos happen to be named — which matters, because an archive sorted by
 * filename is an archive sorted by camera, by shoot, and therefore by year.
 */
function shuffleKey(name: string): number {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function getGalleryManifest(): Promise<GalleryManifestItem[]> {
  try {
    const snap = await manifestDoc().get();
    const items = snap.exists ? snap.get("items") : null;
    return Array.isArray(items) ? (items as GalleryManifestItem[]) : [];
  } catch (err) {
    // A missing manifest, an unset key or a Firestore outage should cost the
    // page its gallery, never the page itself — /since-2011 renders the hero
    // alone and reads as deliberate rather than broken.
    console.error("Gallery manifest read failed:", err);
    return [];
  }
}

export async function getGalleryImages(): Promise<GalleryImage[]> {
  const items = await getGalleryManifest();
  return items
    .map(({ name, url, width, height, blurDataURL }) => ({
      name,
      url,
      width,
      height,
      blurDataURL,
    }))
    .sort((a, b) => shuffleKey(a.name) - shuffleKey(b.name));
}

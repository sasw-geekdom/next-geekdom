import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/lib/firebase/admin";
import { COLLECTIONS, GALLERY_SETTINGS_DOC } from "@/lib/firebase/collections";
import { getGalleryManifest, type GalleryManifestItem } from "@/lib/gallery";
import { gradeRaw } from "@/lib/photo-grade.mjs";

/*
  Source originals (in Firebase Storage behind deny-all, read via the Admin
  SDK) → resized WebP thumbnails on public Vercel Blob.

  WHY TWO STORES. The originals are whatever Geekdom uploads — 6MB JPEGs
  straight off a camera, HEICs off a phone — and they stay private. What the
  wall serves is a 900px WebP of each, which is the difference between a page
  that loads and a page that doesn't.

  CONTENT-ADDRESSED BY THE ORIGINAL'S MD5, which buys two things: a re-run
  skips every photo that hasn't changed, and a given photo's URL never churns,
  so the CDN keeps it cached across syncs.

  PORTED FROM THE SIBLING next-sasw REPO, where this runs the same wall for
  Startup Week. Kept close to that source on purpose — if a bug turns up in
  one, the fix should be obvious in the other.
*/
const PREFIX = "since-2011/";
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i;
const THUMB_WIDTH = 900; // display max on the masonry wall
const THUMB_QUALITY = 72;
// The photo viewer's copy — a full-screen photo on a 2x laptop. Graded at
// this size, then the thumbnail and the blur are cut from the graded pixels,
// so all three are the same grade by construction.
const LARGE_WIDTH = 1800;
const LARGE_QUALITY = 78;
const BLUR_WIDTH = 16;
const BLOB_PREFIX = "gallery/since-2011";
// Cap per run so a big first batch can't blow the request timeout — the admin
// re-runs until `remaining` hits 0. Unchanged photos don't count toward this.
const MAX_PER_RUN = 40;
const CONCURRENCY = 4;

/*
  THE BRAND GRADE, on the archive too. Every photograph on the site goes
  through it (AGENTS.md, Photography) and the wall was the exception: fifteen
  years of frames off every camera Geekdom ever had, warm, cool, and lit
  magenta. It's graded with the same function as the library
  (lib/photo-grade.mjs), at 900px after the resize — the statistics it reads
  are the same at that size, and a full-resolution grade per photo would
  blow the server action's time budget. (Graded at LARGE_WIDTH since g2 —
  about 0.6s a photo.)

  Bump GRADE_KEY when lib/photo-grade.mjs changes: the key is stored with
  each thumbnail and is part of its Blob URL, so the next sync rebuilds
  every photo and the CDN can't serve an old grade.
*/
const GRADE_KEY = "g2"; // g2: graded at 1800px, with the viewer's large copy

/**
 * The guide's ~30% black and white — 77 of 256 — by its criteria:
 * spotlights, profiles, ceremonial moments, plus the stage frames lit
 * magenta, where the color fights the brand hardest. The first 14 are the
 * original 46's; the rest are the archive additions (Wayback Machine
 * recoveries, named "YYYY-NNN-…", and Geekdom's og-geekdom set). Names as
 * they sit in the since-2011/ folder. A name added or removed here rebuilds
 * that photo, and only that photo. Keep it near 30% as the wall grows.
 */
const BLACK_AND_WHITE = new Set([
  "geekdom34.jpeg", // headphones profile; already B&W at source
  "geekdom49.jpeg", // KSAT spotlight
  "geekdom28.jpeg", // interview, mic in hand
  "geekdom87.jpg", // speaker on stage
  "geekdom83.jpg", // ribbon cutting
  "geekdom85.JPG", // the check
  "geekdom5.jpeg", // group lineup
  "geekdom74.jpeg", // team lineup
  "geekdom43.jpeg", // the whole room at once
  "geekdom10.jpeg", // panel
  "geekdom81.jpeg", // Startup Grind fireside
  "geekdom89.jpg", // fireside on stage
  "geekdom82.jpg", // Startup Week stage
  "geekdom88.jpg", // Startup Week panel
  // Archive additions — spotlights — speakers on stage, firesides.
  "og-geekdom2.jpeg",
  "og-geekdom13.jpeg",
  "og-geekdom7.jpeg",
  "2015-069-oca-1.jpg",
  "2015-076-11.jpg",
  "2018-154-hero-min.jpg",
  "2020-176-DSC003581-2048x1365.jpg",
  "2020-178-Net-Zero-1024x680.png",
  "2021-184-WCML8800-scaled.jpg",
  "2021-191-IMG_5561-1-scaled.jpg",
  "2021-201-Cynthia-P-Success-Quote.png",
  "2021-211-Why-Geekdom-2.jpg",
  "2022-240-Christian-Garcia-works-on-his-pitch-at-Geekdom-courtesy-photo-e1669837122545.jpg",
  "2023-253-4N2A9757-scaled.jpg",
  "2023-254-4N2A6601-scaled.jpg",
  "2023-258-4N2A6601-scaled-Custom.jpg",
  "2023-259-IMG_5561-1-scaled-Custom.jpg",
  "2023-273-untitled-80.jpg",
  "2023-274-WCML9910-scaled.jpg",
  "2023-275-IMG_1214.jpg",
  "2023-276-mentorship.jpg",
  // Archive additions — ceremonial — lineups, checks, the room cheering.
  "og-geekdom4.jpeg",
  "og-geekdom5.jpeg",
  "og-geekdom10.jpeg",
  "og-geekdom14.jpeg",
  "2014-032-5.jpg",
  "2015-047-06.jpg",
  "2015-070-techstars-2015-02.jpg",
  "2015-091-ts-rock-paper-scissors.jpg",
  "2016-107-the-boys.jpg",
  "2016-111-wp-engine.jpg",
  "2016-119-IMG_7160.jpg",
  "2016-123-grok_4-16-0033.jpg",
  "2016-124-DSC00809.jpg",
  "2016-127-DCI-Apprentices.jpg",
  "2017-133-22886361721_08ebc6518b_o.jpg",
  "2017-136-meetup.jpg",
  "2018-151-29025909_1717387268284019_469162028183846912_o.jpg",
  "2018-153-Braustin-benefits-of-coworking-1024x768.jpg",
  "2021-187-Q1-2023-COMM-FUND-CHECK-scaled.jpg",
  "2021-188-DSC01377-scaled.jpg",
  "2021-200-Geekdom-PreAccelerator2021-1-scaled.jpg",
  "2022-231-Incubator-Blog-Post-FEAT-IMG.jpg",
  "2023-260-Q1-2023-COMM-FUND-CHECK-scaled-Custom.jpg",
  "2023-270-4N2A9639.jpg",
  "2023-272-DSC09582-scaled.jpeg",
  "2023-277-2023Pre-acc-Group-Photo.jpg",
  "2023-288-Screenshot-2023-10-23-at-3.58.27_E2_80_AFPM.png",
  "2024-290-https___cdn.evbuc_.com_images_676066289_31650558815_1_original-2.jpg",
  "2024-292-WFN-site.jpg",
  "2024-295-Q3-Cohort.png",
  "2025-297-about-hero.jpg",
  // Archive additions — profiles.
  "og-geekdom23.jpeg",
  "2013-007-MonksToolbox3.jpg",
  "2013-019-people-wide.png",
  "2015-044-12.jpg",
  "2020-165-geekdom-mentoring-.jpg",
  "2020-172-pinch_winner_sml.jpg",
  "2021-197-woman-at-her-workplace-in-startup-business-office-PPJ7BD3.jpg",
  "2021-198-startup-team-working-in-a-coworking-space-DSQJVMZ.jpg",
  "2022-228-DANNYS-PICK-SQUARE-scaled.jpg",
  "2022-242-Screen-Shot-2022-12-21-at-1.24.17-PM.png",
  "2023-247-Startup-scaled.jpg",
]);

const gradeFor = (name: string) => `${GRADE_KEY}${BLACK_AND_WHITE.has(name) ? "-bw" : ""}`;

/*
  THE BLOB KEY IS THE MD5 IN HEX. Storage reports `md5Hash` in BASE64, whose
  alphabet includes "/" and "+" — and the key used to be that string as-is.
  One in five photos got a "/" in its path (stray folders on Blob), and one,
  whose hash STARTS with "/", made `gallery/since-2011//…`, which Blob
  refused: that photo silently never reached the wall. The same code runs in
  next-sasw. Hex is path-safe; a thumbnail whose URL isn't on this key is
  rebuilt by the next sync, and its old file deleted.
*/
const blobName = (md5: string, grade: string, size: "thumb" | "large" = "thumb") =>
  `${/^[0-9a-f]{32}$/.test(md5) ? md5 : Buffer.from(md5, "base64").toString("hex")}-${grade}${size === "large" ? "-lg" : ""}.webp`;

export interface SyncResult {
  total: number; // originals in the folder
  generated: number; // thumbnails (re)built this run
  skipped: number; // unchanged, reused
  removed: number; // manifest entries whose original is gone
  remaining: number; // still needing a thumbnail after this run
}

/** Build a WebP thumbnail + blur placeholder, upload to Blob. `name` is filled by the caller. */
async function buildThumb(
  buf: Buffer,
  md5: string,
  grade: string,
): Promise<Omit<GalleryManifestItem, "name">> {
  const raw = await sharp(buf, { failOn: "none" })
    .rotate() // honor EXIF orientation
    .resize({ width: LARGE_WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = raw.info;
  const graded = gradeRaw(raw.data, width, height, { bw: grade.endsWith("-bw") }).data;
  const rawInput = { raw: { width, height, channels: 3 as const } };

  const large = await sharp(graded, rawInput)
    .webp({ quality: LARGE_QUALITY })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(graded, rawInput)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer({ resolveWithObject: true });

  // From the graded pixels, so the placeholder is the same color as the photo.
  const blurBuf = await sharp(graded, rawInput)
    .resize({ width: BLUR_WIDTH })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${blurBuf.toString("base64")}`;

  // Stable, content-addressed key (+ grade) → same photo and grade overwrite,
  // URL never churns; a new grade is a new URL.
  const upload = (name: string, data: Buffer) =>
    put(`${BLOB_PREFIX}/${name}`, data, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: false,
      allowOverwrite: true,
      // Explicit, so a `vercel link`ed machine doesn't try OIDC — see
      // lib/content/logo-upload.ts.
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
  const [{ url }, largeBlob] = await Promise.all([
    upload(blobName(md5, grade), thumb.data),
    upload(blobName(md5, grade, "large"), large.data),
  ]);

  return {
    url,
    width: thumb.info.width,
    height: thumb.info.height,
    blurDataURL,
    md5,
    grade,
    large: { url: largeBlob.url, width: large.info.width, height: large.info.height },
  };
}

/** Map over items with bounded concurrency. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    },
  );
  await Promise.all(workers);
  return out;
}

export async function syncGalleryThumbnails(): Promise<SyncResult> {
  const [files] = await getAdminStorage().bucket().getFiles({ prefix: PREFIX });
  const originals = files.filter(
    (f) => f.name.length > PREFIX.length && IMAGE_EXT.test(f.name),
  );

  const manifest = await getGalleryManifest();
  const byName = new Map(manifest.map((m) => [m.name, m]));
  const liveNames = new Set(originals.map((f) => f.name.slice(PREFIX.length)));

  // Prune entries whose original was deleted; best-effort remove their Blob.
  const removedItems = manifest.filter((m) => !liveNames.has(m.name));
  await Promise.all(
    removedItems
      .flatMap((m) => [m.url, m.large?.url])
      .filter((u): u is string => Boolean(u))
      .map((u) => del(u, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})),
  );

  // Which originals still need a (re)build? Compare MD5 from Storage metadata.
  const pending: {
    name: string;
    md5: string;
    file: (typeof originals)[number];
  }[] = [];
  for (const file of originals) {
    const name = file.name.slice(PREFIX.length);
    const md5 = (file.metadata?.md5Hash as string | undefined) ?? "";
    const existing = byName.get(name);
    if (
      existing?.url?.endsWith(`/${blobName(md5, gradeFor(name))}`) &&
      existing.large?.url &&
      existing.md5 === md5 &&
      existing.grade === gradeFor(name)
    ) {
      continue;
    }
    pending.push({ name, md5, file });
  }

  const batch = pending.slice(0, MAX_PER_RUN);
  const built = (
    await mapLimit(batch, CONCURRENCY, async ({ name, md5, file }) => {
      try {
        const [buf] = await file.download();
        const md5Key = md5 || createHash("md5").update(buf).digest("hex");
        const item = await buildThumb(buf, md5Key, gradeFor(name));
        return { ...item, name };
      } catch (err) {
        // One unreadable file (e.g. a corrupt HEIC) shouldn't kill the run;
        // it's simply retried next sync since it never lands in the manifest.
        console.error(`Thumbnail failed for ${name}:`, err);
        return null;
      }
    })
  ).filter((b): b is GalleryManifestItem => b !== null);

  // A rebuild under a new grade has new URLs; the old files are now orphaned.
  const keep = new Set(built.flatMap((b) => [b.url, b.large?.url]));
  await Promise.all(
    built
      .flatMap((b) => [byName.get(b.name)?.url, byName.get(b.name)?.large?.url])
      .filter((u): u is string => Boolean(u) && !keep.has(u))
      .map((u) => del(u, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {})),
  );

  // Merge: keep unchanged live entries + freshly built ones; drop removed.
  const builtByName = new Map(built.map((b) => [b.name, b]));
  const next: GalleryManifestItem[] = [];
  for (const name of liveNames) {
    next.push(builtByName.get(name) ?? byName.get(name)!);
  }
  const items = next.filter(Boolean);

  await getAdminDb()
    .collection(COLLECTIONS.settings)
    .doc(GALLERY_SETTINGS_DOC)
    .set({ items, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  return {
    total: originals.length,
    generated: built.length,
    skipped: originals.length - pending.length,
    removed: removedItems.length,
    remaining: Math.max(0, pending.length - batch.length),
  };
}

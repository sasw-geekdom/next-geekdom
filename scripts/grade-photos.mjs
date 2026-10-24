/**
 * THE BRAND GRADE. Reads every original in photos/originals/, writes the
 * graded file the site serves to public/photos/ under the same name.
 *
 *   npm run photos:grade            grade everything
 *   npm run photos:grade -- a.jpg   grade just these
 *
 * Geekdom asked that every photograph "run through the same treatment for
 * cohesion based on the Photography section of the brand guide" (2026 guide,
 * section 06). What that section specifies, and where each line lands here:
 *
 *   Slightly warm (+200 to +400K)       → WARMTH_TARGET
 *   Slightly desaturated (-10 to -15)   → DESATURATE, plus SATURATION_CEILING
 *   Bone tones preserved in highlights  → the white point maps to Bone
 *   Graphite depth preserved in shadows → the black point maps to Graphite
 *   ~30% of the library black and white,
 *   high contrast, midtones intact      → BLACK_AND_WHITE, gentle S-curve
 *
 * WHY PER-PHOTOGRAPH, NOT ONE FIXED FILTER. Measured before this existed, the
 * library's mean saturation ranged 7x (0.07 to 0.51), warmth from cool to very
 * warm, highlights from 174 to 254 and shadows from 0 to 24. A fixed "-13%,
 * +300K" keeps every one of those gaps — the too-warm frame stays too warm
 * relative to the cool one. Cohesion means pulling each frame TOWARD one
 * target: the white and black points are measured and mapped, warmth is
 * measured and corrected toward a shared value, and saturation above a
 * ceiling is brought down harder than saturation below it.
 *
 * ORIGINALS ARE NEVER WRITTEN. They live outside public/ so they are not
 * served, and re-running this is always from source — change a constant and
 * re-grade the whole library, never a grade applied on top of a grade.
 * A new photograph: drop it in photos/originals/, run this, import it from
 * public/photos/ in lib/photos.ts as usual.
 *
 * The grade itself lives in lib/photo-grade.mjs, shared with the
 * /since-2011 wall's sync; this file is the library's I/O and its B&W list.
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { gradeRaw } from "../lib/photo-grade.mjs";

const SRC = "photos/originals";
const OUT = "public/photos";

/**
 * Editorial gravity, per the guide: spotlights, ceremonial moments, profiles.
 * 9 of 31 at the time of writing — 29% against the guide's ~30%.
 */
const BLACK_AND_WHITE = new Set([
  "conversation.jpg", // homepage hero; already B&W at source
  "graham-nick-2011.jpg", // the 2011 origin — ceremonial, and vintage
  "brian-sierakowski.jpg", // EIR profile portrait
  "franklin-morris.jpg", // founder spotlight
  "openlane-team.jpg", // founder spotlight, /studio hero
  "fireside.jpg", // a fireside chat
  "the-crowd.jpg", // the whole room at once
  // /about's archive: Geekdom's history in black and white, beside the 2011
  // photograph; the page's present-day frames stay in color.
  "about-2013-whiteboard.jpg",
  "about-2014-stage.jpg",
]);

async function grade(file) {
  const { data, info } = await sharp(path.join(SRC, file))
    .rotate() // honor EXIF orientation before the tag is dropped
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: out, report } = gradeRaw(data, info.width, info.height, {
    bw: BLACK_AND_WHITE.has(file),
  });
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(OUT, file));
  return { file, ...report };
}

const only = process.argv.slice(2);
const files = (await readdir(SRC))
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .filter((f) => only.length === 0 || only.includes(f))
  .sort();
await mkdir(OUT, { recursive: true });

for (const file of files) {
  const r = await grade(file);
  const bits = [
    r.bw ? "B&W  " : "color",
    `sat ${r.saturation[0].toFixed(2)} x${r.saturation[1].toFixed(2)}`,
    r.warmth ? `warmth ${r.warmth[0].toFixed(0).padStart(3)} ${r.warmth[1] >= 0 ? "+" : ""}${r.warmth[1].toFixed(0)}` : "",
    `tone ${Math.round(r.tone[0])}–${Math.round(r.tone[1])}`,
  ];
  console.log(`${file.padEnd(26)} ${bits.filter(Boolean).join("  ")}`);
}
console.log(`\n${files.length} graded → ${OUT}/`);

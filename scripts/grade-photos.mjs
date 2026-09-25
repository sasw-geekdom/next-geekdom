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
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "photos/originals";
const OUT = "public/photos";

/** Brand grounds, from app/globals.css. */
const BONE = [0xf4, 0xf1, 0xeb];
const GRAPHITE = [0x1b, 0x1b, 0x1b];

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

/** The guide's "-10 to -15", applied to every color frame. */
const DESATURATE = 0.87;
/**
 * Mean HSV saturation above which a frame is pulled down further, so the
 * library converges. Below it, only DESATURATE applies — a muted frame is
 * never flattened to match.
 */
const SATURATION_CEILING = 0.26;
/**
 * Floor on the combined saturation factor. 0.55 was tried first and drained
 * the most saturated frames — skin went grey on speaking.jpg — which is not
 * the guide's "slightly". Outliers still converge; they just stop short.
 */
const MIN_SATURATION_FACTOR = 0.68;

/**
 * Shared warmth, as mean(R) - mean(B) after grading. Roughly what +300K does
 * to a neutral interior. Each frame is corrected toward it, by at most
 * MAX_WARMTH_SHIFT levels, so a badly mixed-light frame is improved rather
 * than re-lit.
 */
const WARMTH_TARGET = 14;
const MAX_WARMTH_SHIFT = 22;

/**
 * Tone mapping: the 0.5th and 99.5th luminance percentiles land on Graphite
 * and Bone. Percentiles rather than min/max so a specular glint or one dead
 * pixel doesn't set the scale. The stretch is capped so a flat, dim frame is
 * lifted without its noise being amplified into grain.
 */
const LOW_PCT = 0.005;
const HIGH_PCT = 0.995;
const MAX_STRETCH = 1.35;

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function hsvSat(r, g, b) {
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
}

/** A gentle S-curve for B&W: contrast through the middle, ends left alone. */
function sCurve(t) {
  // Blend of identity and smoothstep; 0.35 keeps midtone detail intact.
  const s = t * t * (3 - 2 * t);
  return t + 0.35 * (s - t);
}

async function grade(file) {
  const { data, info } = await sharp(path.join(SRC, file))
    .rotate() // honor EXIF orientation before the tag is dropped
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  const px = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) px[i] = data[i];

  const bw = BLACK_AND_WHITE.has(file);
  const report = { file, bw };

  // ── 1. Saturation ────────────────────────────────────────────────────────
  let satSum = 0;
  for (let i = 0; i < n * 3; i += 3) satSum += hsvSat(px[i], px[i + 1], px[i + 2]);
  const meanSat = satSum / n;
  const satFactor = bw
    ? 0
    : Math.max(
        MIN_SATURATION_FACTOR,
        DESATURATE * Math.min(1, SATURATION_CEILING / Math.max(meanSat, 1e-6)),
      );
  for (let i = 0; i < n * 3; i += 3) {
    const y = luma(px[i], px[i + 1], px[i + 2]);
    px[i] = y + satFactor * (px[i] - y);
    px[i + 1] = y + satFactor * (px[i + 1] - y);
    px[i + 2] = y + satFactor * (px[i + 2] - y);
  }
  report.saturation = [meanSat, satFactor];

  // ── 2. Warmth (color only) ───────────────────────────────────────────────
  // Applied as a gain weighted by luminance, so it warms the light and leaves
  // the shadows at a neutral Graphite rather than tinting them.
  if (!bw) {
    let rs = 0;
    let bs = 0;
    for (let i = 0; i < n * 3; i += 3) {
      rs += px[i];
      bs += px[i + 2];
    }
    const warmth = (rs - bs) / n;
    const shift = Math.max(-MAX_WARMTH_SHIFT, Math.min(MAX_WARMTH_SHIFT, WARMTH_TARGET - warmth));
    for (let i = 0; i < n * 3; i += 3) {
      const w = luma(px[i], px[i + 1], px[i + 2]) / 255;
      px[i] += (shift / 2) * w;
      px[i + 2] -= (shift / 2) * w;
    }
    report.warmth = [warmth, shift];
  }

  // ── 3. Tone: black point → Graphite, white point → Bone ──────────────────
  const hist = new Uint32Array(256);
  for (let i = 0; i < n * 3; i += 3) hist[clamp(Math.round(luma(px[i], px[i + 1], px[i + 2])))]++;
  const pct = (p) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) if ((acc += hist[v]) >= p * n) return v;
    return 255;
  };
  let lo = pct(LOW_PCT);
  let hi = pct(HIGH_PCT);
  // Neutral targets for B&W — Bone's luminance without its warmth, so a
  // black-and-white frame stays black and white.
  const top = bw ? Array(3).fill(luma(...BONE)) : BONE;
  const bottom = GRAPHITE;
  // Cap the stretch by widening the source range symmetrically.
  const wantSpan = luma(...top) - luma(...bottom);
  if (wantSpan / Math.max(hi - lo, 1) > MAX_STRETCH) {
    const mid = (hi + lo) / 2;
    const half = wantSpan / MAX_STRETCH / 2;
    lo = mid - half;
    hi = mid + half;
  }
  for (let i = 0; i < n * 3; i += 3) {
    for (let c = 0; c < 3; c++) {
      let t = (px[i + c] - lo) / (hi - lo);
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      if (bw) t = sCurve(t);
      px[i + c] = bottom[c] + t * (top[c] - bottom[c]);
    }
  }
  report.tone = [lo, hi];

  const out = Buffer.alloc(n * 3);
  for (let i = 0; i < n * 3; i++) out[i] = clamp(Math.round(px[i]));
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(OUT, file));
  return report;
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

/**
 * THE BRAND GRADE, as one function — shared by scripts/grade-photos.mjs (the
 * site's library, graded at build time from photos/originals/) and
 * lib/gallery-sync.ts (the /since-2011 wall, graded as each photo is
 * synced). One implementation, so the archive and the library get the same
 * treatment and a constant tuned here moves both. The guide line behind each
 * constant is in the script's header.
 *
 * Plain .mjs on purpose: the script runs under bare `node`, and TypeScript
 * imports it through `allowJs`. No I/O here — RGB in, RGB out.
 *
 * @param {Buffer} data  raw sRGB, 3 channels, no alpha
 * @param {number} width
 * @param {number} height
 * @param {{ bw?: boolean }} [options]
 * @returns {{ data: Buffer, report: { bw: boolean, saturation?: number[], warmth?: number[], tone?: number[] } }}
 */
/** Brand grounds, from app/globals.css. */
export const BONE = [0xf4, 0xf1, 0xeb];
export const GRAPHITE = [0x1b, 0x1b, 0x1b];

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

export function gradeRaw(data, width, height, { bw = false } = {}) {
  const n = width * height;
  const px = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) px[i] = data[i];

  const report = { bw };

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
  return { data: out, report };
}


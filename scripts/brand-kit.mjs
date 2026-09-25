/**
 * THE PRESS BRAND KIT. `npm run brand:kit` writes public/brand/kit/:
 *
 *   geekdom-{wordmark,g-mark,crown}-{red,graphite,bone}.{svg,png}
 *   geekdom-brand-kit.zip   (all eighteen)
 *
 * `Source Copy v1` promises /media "Full wordmark (SVG, PNG — Graphite, Bone,
 * and Red variants), G mark (all variants), Crown mark (all variants)" and a
 * brand-kit ZIP. The files Geekdom supplied are two-tone — Geekdom Red plus a
 * darker #AA2D29 shading the crown — and the 2026 guide says the marks
 * "appear only in Geekdom Red, Graphite, or Bone". Single-color variants are
 * unambiguously inside that rule, so that is what the kit ships.
 *
 * SOURCE: the flattened single-shape outlines in public/brand/*-mask.svg —
 * the official artwork with its fills resolved to one color, the same shapes
 * every mark on this site is drawn from. Only the fill changes here; nothing
 * is redrawn, so nothing is "altered, rotated, or stretched".
 *
 * PNGs are transparent and sized for print-ish use: the wordmark 2400px wide,
 * the G mark 1200px tall, the crown 1200px wide — all far past the guide's
 * digital minimums (80px / 32px / 24px).
 *
 * Replace with Geekdom's own brand-kit files if they send single-color ones.
 */
import sharp from "sharp";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const OUT = "public/brand/kit";
const MARKS = {
  wordmark: { src: "public/brand/geekdom-mask.svg", size: { width: 2400 } },
  "g-mark": { src: "public/brand/g-mark-mask.svg", size: { height: 1200 } },
  crown: { src: "public/brand/crown-mask.svg", size: { width: 1200 } },
};
/** The guide's three approved colors for the marks, from app/globals.css. */
const COLORS = { red: "#CA3625", graphite: "#1B1B1B", bone: "#F4F1EB" };

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const written = [];

for (const [mark, { src, size }] of Object.entries(MARKS)) {
  const raw = await readFile(src, "utf8");
  const viewBox = raw.match(/viewBox="([^"]+)"/)[1];
  const paths = [...raw.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  for (const [name, hex] of Object.entries(COLORS)) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="Geekdom">` +
      `<title>Geekdom</title>` +
      paths.map((d) => `<path fill="${hex}" d="${d}"/>`).join("") +
      `</svg>\n`;
    const base = `geekdom-${mark}-${name}`;
    await writeFile(path.join(OUT, `${base}.svg`), svg);
    await sharp(Buffer.from(svg), { density: 1200 })
      .resize({ ...size, fit: "inside" })
      .png()
      .toFile(path.join(OUT, `${base}.png`));
    written.push(`${base}.svg`, `${base}.png`);
  }
}

execFileSync("zip", ["-q", "-X", "geekdom-brand-kit.zip", ...written], { cwd: OUT });
console.log(`${written.length} files + geekdom-brand-kit.zip → ${OUT}/`);

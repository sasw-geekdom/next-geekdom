#!/usr/bin/env node
/**
 * Renders the share cards to PNG.  `npm run og`
 *
 * WHY A SCRIPT AND NOT next/og. The visual on every card is the pigment crown —
 * a live WebGL shader masked to the brand mark. Satori, which is what
 * `next/og` runs, has no canvas and no GL context; it lays out flexbox and
 * draws text and SVG, and that is all. It cannot produce this picture at any
 * price. The only renderer that can is a browser, so a browser is what makes
 * them, once, ahead of time.
 *
 * The output goes to `opengraph-image.png` inside each route's own folder,
 * which is a Next file convention: it is picked up per segment and emits
 * og:image, twitter:image and the dimensions with no metadata code at all.
 * Paths and copy both live in lib/og.ts.
 *
 * DETERMINISTIC. Each card names the second of the shader's clock it freezes
 * at (`seed`), so re-running this writes byte-identical files rather than seven
 * binary diffs against art nobody touched. Re-run it when the card copy in
 * lib/og.ts changes, when the price changes, or when the crown does.
 *
 * 1200×630 at 1x, not 2x. This is the size every scraper expects, feeds render
 * it at half that or less, and a 2400-wide supersample of a soft gradient costs
 * megabytes per file in a git repo to sharpen type nobody sees at full size.
 */

import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 3000;
const ORIGIN = `http://localhost:${PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const path of CHROME_CANDIDATES) {
    try {
      statSync(path);
      return path;
    } catch {
      /* next candidate */
    }
  }
  throw new Error(
    "No Chrome found. Set CHROME_PATH to a Chrome or Chromium binary.",
  );
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  throw new Error(`Dev server never answered on ${url}`);
}

async function main() {
  const chrome = findChrome();

  /*
    The cards render on a dev-only route, so this needs `next dev` — a
    production build 404s it on purpose.

    REUSE A RUNNING SERVER IF THERE IS ONE. Next 16 allows exactly one dev
    server per directory and refuses the second outright ("Another next dev
    server is already running"), so a script that unconditionally starts its own
    fails for anyone who happens to have `npm run dev` open — which is everyone,
    most of the time. Probe first, start only if nothing answers, and kill only
    what this script started.
  */
  const probe = `${ORIGIN}/og-preview/home`;
  const alreadyUp = await fetch(probe)
    .then((r) => r.ok)
    .catch(() => false);

  let dev = null;
  if (alreadyUp) {
    console.log(`· using the dev server already on ${PORT}`);
  } else {
    console.log(`· starting next dev on ${PORT}`);
    dev = spawn("npx", ["next", "dev", "--port", String(PORT)], {
      cwd: ROOT,
      stdio: "ignore",
    });
  }

  try {
    await waitForServer(probe);

    /*
      The card list comes back OVER HTTP, from a route that imports lib/og.ts
      directly, rather than being imported here. Node 20 cannot load a
      TypeScript module — this repo pins Node 20 because firebase-admin v12
      does — and the alternatives are a build step for one script or a second
      copy of the copy. Asking the server that is already running is neither.
    */
    const { cards, size } = await fetch(`${ORIGIN}/og-preview/manifest`).then(
      (r) => r.json(),
    );

    for (const [slug, card] of Object.entries(cards)) {
      const out = join(ROOT, card.out);
      mkdirSync(dirname(out), { recursive: true });

      /*
        The viewport IS the card. The preview page centres a 1200×630 element
        in the window, so a window of exactly that size crops to the artwork
        with no bezel to trim — which is why there is no element-clipping step
        here.

        `--virtual-time-budget` is what waits for the shader: the card draws its
        single frame in an effect after hydration, and the flag lets the browser
        run the clock forward and only then photograph.
      */
      const res = spawnSync(
        chrome,
        [
          "--headless",
          // WebGL, in software. Headless has no GPU, and recent Chrome refuses
          // the SwiftShader fallback unless asked — without this every card
          // renders with a hole where the crown goes.
          "--enable-unsafe-swiftshader",
          "--hide-scrollbars",
          "--force-device-scale-factor=1",
          `--window-size=${size.width},${size.height}`,
          "--virtual-time-budget=8000",
          `--screenshot=${out}`,
          `${ORIGIN}/og-preview/${slug}`,
        ],
        { encoding: "utf8" },
      );

      if (res.status !== 0) {
        throw new Error(`chrome failed on ${slug}:\n${res.stderr}`);
      }

      // The sidecar Next turns into og:image:alt. Written alongside rather than
      // set in metadata so the image and its description move together.
      // No trailing newline — Next drops the file's contents straight into the
      // og:image:alt attribute, and a newline in there is a line break in the
      // middle of the <head>.
      writeFileSync(out.replace(/\.png$/, ".alt.txt"), card.alt);

      const kb = Math.round(statSync(out).size / 1024);
      console.log(`✓ ${slug.padEnd(16)} ${String(kb).padStart(4)} KB  ${card.out}`);
    }
  } finally {
    dev?.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

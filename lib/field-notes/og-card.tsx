import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import type { NoteContent } from "@/lib/field-notes/types";

/*
  A FIELD NOTE'S SHARE CARD — generated, 1200×630.

  The site's other cards are static PNGs photographed from /og-preview by
  `npm run og` (scripts/og.mjs), because Satori can't use next/font or the
  CSS tokens. A Field Note is written in the admin, after any deploy, so its
  card has to be made at runtime — with `next/og` (Satori) and the brand's
  faces committed as STATIC TTFs in assets/fonts/ (Satori takes neither
  woff2 nor the variable Rubik the site serves). next.config.ts traces them
  into the routes that render this.

  Same rules as the static cards (AGENTS.md, Share cards): Bone, type-led,
  the flat Geekdom Red wordmark the only mark, no crown, no shader. The
  cover photograph sits on the right when the note has one — already graded,
  so it's on-brand by construction.

  Rendered here and stored to Blob at publish (lib/field-notes/media.ts), so
  the public page will read one stable URL rather than render per request.
*/

export const CARD = { width: 1200, height: 630 } as const;

const BONE = "#F4F1EB";
const GRAPHITE = "#1B1B1B";
const CONCRETE = "#6B6B6B";
const CLAY = "#C8623D";

let fonts: Promise<{ name: string; data: Buffer; weight: 400 | 500; style: "normal" }[]> | null = null;
function loadFonts() {
  fonts ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Rubik-400.ttf")).then((data) => ({ name: "Rubik", data, weight: 400 as const, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/fonts/Rubik-500.ttf")).then((data) => ({ name: "Rubik", data, weight: 500 as const, style: "normal" as const })),
    readFile(join(process.cwd(), "assets/fonts/IBMPlexMono-400.ttf")).then((data) => ({ name: "Plex Mono", data, weight: 400 as const, style: "normal" as const })),
  ]);
  return fonts;
}

let wordmark: Promise<string> | null = null;
function loadWordmark() {
  wordmark ??= readFile(join(process.cwd(), "public/brand/kit/geekdom-wordmark-red.svg"), "base64").then(
    (b64) => `data:image/svg+xml;base64,${b64}`,
  );
  return wordmark;
}

/** The note's lead photograph, as a JPEG data URL (Satori can't read WebP). */
async function leadPhoto(c: NoteContent): Promise<string | null> {
  const first = c.frames.find((f) => (f.type === "cover" || f.type === "image") && f.image);
  const img = first && (first.type === "cover" || first.type === "image") ? first.image : undefined;
  if (!img) return null;
  try {
    const res = await fetch(img.srcSm);
    if (!res.ok) return null;
    const jpg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(560, 630, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Title size steps down with length, so the longest still fits three lines. */
function titleSize(title: string, narrow: boolean): number {
  const n = title.length;
  const base = narrow ? 62 : 72;
  if (n <= 40) return base;
  if (n <= 70) return base - 10;
  return base - 20;
}

export async function renderCard(c: NoteContent): Promise<Buffer> {
  const [fontData, mark, photo] = await Promise.all([loadFonts(), loadWordmark(), leadPhoto(c)]);
  const title = (c.frames[0]?.type === "cover" && c.frames[0].title) || c.title || "Field Notes";
  const narrow = Boolean(photo);

  const response = new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: BONE, fontFamily: "Rubik" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            padding: "64px 64px 56px 72px",
            borderLeft: `8px solid ${CLAY}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Plex Mono", fontSize: 22, letterSpacing: 4, color: CONCRETE }}>FIELD NOTES</div>
            <div
              style={{
                marginTop: 28,
                fontSize: titleSize(title, narrow),
                fontWeight: 500,
                lineHeight: 1.04,
                letterSpacing: -1.5,
                color: GRAPHITE,
                display: "flex",
              }}
            >
              {title}
            </div>
            {c.author && (
              <div style={{ marginTop: 24, fontSize: 28, color: CONCRETE, display: "flex" }}>By {c.author}</div>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- Satori renders <img>, not next/image */}
          <img src={mark} width={190} height={72} alt="" />
        </div>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} width={560} height={630} alt="" style={{ objectFit: "cover" }} />
        )}
      </div>
    ),
    { ...CARD, fonts: await fontData },
  );
  return Buffer.from(await response.arrayBuffer());
}

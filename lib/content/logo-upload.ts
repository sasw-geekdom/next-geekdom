import "server-only";

import { createHash } from "node:crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { hasEnv } from "@/lib/env";

/*
  A PORTFOLIO LOGO, CHECKED AND STORED IN VERCEL BLOB.

  The wall paints every logo as a CSS MASK (components/site/portfolio-wall.tsx):
  only the file's transparency is used, and the color is the wall's. So the
  one thing a logo file must have is a transparent background — a JPEG, or a
  PNG with a white box behind the mark, renders as a solid rectangle. That is
  checked here, on the server, rather than left to the preview:

    · PNG / WebP — must have an alpha channel that is actually used (some
      pixels transparent). Wider than 1200px is scaled down; the wall never
      draws one larger than 160px.
    · SVG — transparent by nature. Rejected if it carries script, event
      handlers, foreignObject or external references: it's served from a
      public URL, and a hostile SVG opened directly is a script.

  Blob, not Firebase Storage: CSS masks are fetched with CORS, and Blob's
  public URLs allow it out of the box. Keys are content-addressed, so the same
  file uploaded twice is one object and its URL never churns.
*/

export const LOGO_MAX_BYTES = 512 * 1024;
const RASTER_MAX_WIDTH = 1200;
const PREFIX = "portfolio-logos";

const TYPES: Record<string, "svg" | "png" | "webp"> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/webp": "webp",
};

/** A Blob URL is the only remote logo the wall accepts. */
export function isBlobLogoUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export type LogoUploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function storeLogo(file: File, name: string): Promise<LogoUploadResult> {
  if (!hasEnv(process.env.BLOB_READ_WRITE_TOKEN)) {
    return { ok: false, error: "Logo uploads aren't connected (BLOB_READ_WRITE_TOKEN is missing)." };
  }
  const kind = TYPES[file.type];
  if (!kind) {
    return { ok: false, error: "Upload an SVG, PNG or WebP with a transparent background. JPEGs can't be transparent." };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: "That file is over 512 KB. Export it smaller — the wall draws logos at most 160px wide." };
  }

  let body = Buffer.from(await file.arrayBuffer());

  if (kind === "svg") {
    const text = body.toString("utf8");
    if (!/<svg[\s>]/i.test(text)) return { ok: false, error: "That file isn't a valid SVG." };
    if (/<script|\son\w+\s*=|<foreignObject|xlink:href\s*=\s*["']\s*(?:https?:|javascript:)|href\s*=\s*["']\s*(?:https?:|javascript:)/i.test(text)) {
      return {
        ok: false,
        error: "That SVG has scripts or external links in it. Re-export it as a plain vector file.",
      };
    }
  } else {
    let meta;
    try {
      meta = await sharp(body).metadata();
    } catch {
      return { ok: false, error: "That image couldn't be read. Try exporting it again." };
    }
    if (!meta.hasAlpha) {
      return {
        ok: false,
        error: "That image has a solid background, so it would show as a block on the wall. Upload a version with a transparent background.",
      };
    }
    const stats = await sharp(body).stats();
    const alpha = stats.channels[3];
    if (!alpha || alpha.min > 250) {
      return {
        ok: false,
        error: "That image has no transparent pixels, so it would show as a block on the wall. Upload a version with a transparent background.",
      };
    }
    if ((meta.width ?? 0) > RASTER_MAX_WIDTH) {
      body = await sharp(body).resize({ width: RASTER_MAX_WIDTH }).toFormat(kind).toBuffer();
    }
  }

  const hash = createHash("sha256").update(body).digest("hex").slice(0, 16);
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "logo";

  try {
    const { url } = await put(`${PREFIX}/${slug}-${hash}.${kind}`, body, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      allowOverwrite: true,
      // EXPLICIT, on purpose. Without it the SDK prefers a Vercel OIDC
      // credential when it can find one — and on a machine where the repo is
      // `vercel link`ed it finds one, which this store refuses outside
      // Production/Preview ("OIDC is enabled for this project, but not for
      // the development environment"). The read-write token works everywhere.
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? `Upload failed: ${e.message}` : "Upload failed." };
  }
}

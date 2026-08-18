import { notFound } from "next/navigation";
import { OG_CARDS, OG_SIZE } from "@/lib/og";

/**
 * The card list, for scripts/og.mjs.
 *
 * Exists because the generator runs on Node 20 — pinned, because firebase-admin
 * v12 is — and Node 20 cannot import a TypeScript module. Rather than add a
 * build step for one script, or keep a second copy of the copy in JavaScript,
 * the script asks the dev server it has already started.
 *
 * DEVELOPMENT ONLY, same as the preview page it serves. There is nothing secret
 * in here, but a route with no consumer in production is a route that shouldn't
 * be in production.
 */
export function GET() {
  if (process.env.NODE_ENV === "production") notFound();

  return Response.json({ cards: OG_CARDS, size: OG_SIZE });
}

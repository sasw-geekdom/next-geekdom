import "server-only";

import { env } from "@/lib/env";

/*
  FETCHING ONE OF OUR OWN BLOB FILES ON THE SERVER — the one way server code
  downloads a URL that came from stored content (a Field Note's photo).
  GitHub CodeQL flagged both places that did it as server-side request
  forgery (November 2026): they fetched a URL from the note after checking
  only that it was "some" Vercel Blob address.

  Now, before any request:
    · the host must be OUR store's exact host — derived from
      BLOB_READ_WRITE_TOKEN (vercel_blob_rw_<storeId>_<secret>), so no other
      config is needed and another store's files are refused;
    · the request URL is REBUILT from that fixed origin and the path alone,
      so nothing in the input chooses where the server connects;
    · the path is plain file characters, with no "..";
    · redirects are refused, and there's a time and size limit.
*/

const STORE_ID = /^[A-Za-z0-9]{8,64}$/;
const PATH = /^\/[A-Za-z0-9._~%\-/]+$/;

/** https://<our store>.public.blob.vercel-storage.com, or null without a token. */
export function ownBlobOrigin(): string | null {
  const token = env(process.env.BLOB_READ_WRITE_TOKEN);
  const storeId = token?.split("_")[3];
  if (!storeId || !STORE_ID.test(storeId)) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com`;
}

/** The file's path if `raw` is a URL on our own Blob store, else null. */
export function ownBlobPath(raw: string): string | null {
  const origin = ownBlobOrigin();
  if (!origin) return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.origin !== origin || u.username || u.password) return null;
  if (!PATH.test(u.pathname) || u.pathname.split("/").includes("..")) return null;
  return u.pathname;
}

export async function fetchOwnBlob(raw: string, opts: { maxBytes: number; timeoutMs?: number }): Promise<Buffer> {
  const origin = ownBlobOrigin();
  const path = ownBlobPath(raw);
  if (!origin || !path) throw new Error("That file isn't in this site's storage.");
  // Rebuilt: our fixed origin + the checked path. The input never picks the host.
  const res = await fetch(new URL(path, origin), {
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
  });
  if (!res.ok) throw new Error(`Couldn't read the file (${res.status}).`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > opts.maxBytes) throw new Error("That file is too large.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > opts.maxBytes) throw new Error("That file is too large.");
  return buf;
}

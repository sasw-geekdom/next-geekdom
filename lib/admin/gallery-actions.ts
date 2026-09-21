"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { syncGalleryThumbnails, type SyncResult } from "@/lib/gallery-sync";

export type GallerySyncResult =
  | { ok: true; result: SyncResult }
  | { ok: false; error: string };

/**
 * Rebuild the /since-2011 thumbnails from whatever is in the Storage folder.
 *
 * `requireAdmin()` FIRST, and not because the proxy already checked. The proxy
 * only verifies that a session cookie EXISTS, never that it is valid — every
 * admin route handler and every server action re-verifies for itself. See
 * AGENTS.md.
 *
 * Errors are returned rather than thrown: a sync that fails halfway through a
 * 400-photo archive should tell the person which file broke it, not replace
 * the admin page with an error boundary.
 */
export async function syncGallery(): Promise<GallerySyncResult> {
  await requireAdmin();
  try {
    const result = await syncGalleryThumbnails();
    revalidatePath("/admin/gallery");
    revalidatePath("/since-2011");
    return { ok: true, result };
  } catch (err) {
    console.error("Gallery sync failed:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Sync failed.",
    };
  }
}

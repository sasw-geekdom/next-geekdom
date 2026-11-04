"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { syncGalleryThumbnails, type SyncResult } from "@/lib/gallery-sync";
import { logActivity } from "@/lib/admin/activity";
import { ON_PREVIEW_DATA } from "@/lib/firebase/admin";

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
  const user = await requireAdmin();
  /*
    NOT ON PREVIEW DATA. The wall's files live in the one Blob store every
    deployment shares, and a sync deletes the files its manifest no longer
    needs — a preview syncing under a changed grade would delete the files
    the LIVE wall still points at.
  */
  if (ON_PREVIEW_DATA) {
    return { ok: false, error: "The photo wall syncs from the live site only — this preview's files are shared with it." };
  }
  try {
    const result = await syncGalleryThumbnails();
    if (result.generated || result.removed) {
      await logActivity(user, {
        area: "photo-wall",
        action: "synced",
        label: `${result.generated} photos built, ${result.removed} removed`,
        href: "/portal/admin/gallery",
      });
    }
    revalidatePath("/portal/admin/gallery");
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

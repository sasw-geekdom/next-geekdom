import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAdminApi } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

/*
  FIELD NOTES UPLOADS — the browser sends the file STRAIGHT TO BLOB; this
  route only hands out a short-lived token for it.

  Why not a server action, like the portfolio's logos: Vercel caps a
  function's request body at 4.5MB, and Field Notes takes camera photos
  (up to 25MB) and video (up to 200MB). With `@vercel/blob/client`'s
  `upload()` the bytes never pass through a function at all.

  The token is the gate, so this re-checks everything a layout would:
    · the session is STAFF (`requireAdminApi`, not merely signed in);
    · the path is inside one existing note's folder —
      `field-notes/{noteId}/originals/…` for photos and cards,
      `field-notes/{noteId}/video/…` for clips — so an upload can't land
      anywhere else in the store or in another note;
    · the type and size are per kind.
  Photos are graded afterwards by `processPhoto` (lib/field-notes/actions.ts),
  which only accepts originals from the same note's folder.
*/

const KINDS = {
  originals: {
    allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
    maximumSizeInBytes: 25 * 1024 * 1024,
  },
  video: {
    allowedContentTypes: ["video/mp4", "video/webm"],
    maximumSizeInBytes: 200 * 1024 * 1024,
  },
} as const;

const PATH = /^field-notes\/([\w-]{1,40})\/(originals|video)\/[\w.-]{1,120}$/;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        const user = await requireAdminApi();
        if (!user) throw new Error("Unauthorized.");
        const m = pathname.match(PATH);
        if (!m) throw new Error("That upload path isn't allowed.");
        const [, noteId, kind] = m;
        const note = await getAdminDb().collection(COLLECTIONS.fieldNotes).doc(noteId).get();
        if (!note.exists) throw new Error("That note doesn't exist.");
        const limits = KINDS[kind as keyof typeof KINDS];
        return {
          allowedContentTypes: [...limits.allowedContentTypes],
          maximumSizeInBytes: limits.maximumSizeInBytes,
          // Two uploads of "IMG_0001.jpg" mustn't overwrite each other.
          addRandomSuffix: true,
        };
      },
      // No onUploadCompleted: the editor saves the URL itself, and providing
      // one makes Blob call this route back after every upload.
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized." ? 401 : 400 });
  }
}

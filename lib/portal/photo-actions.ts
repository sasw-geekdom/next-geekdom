"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { del, put } from "@vercel/blob";
import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

/*
  A MEMBER'S PROFILE PHOTO — shown in the directory, on the dashboard's
  "New in the Club" and on their profile card (initials stand in without).

  The browser shrinks the picture first (components/portal/photo-field.tsx
  — a phone photo is 4–8MB; a server action takes 1MB), then this
  RE-ENCODES it with sharp: square, 512px, EXIF rotation applied and every
  bit of metadata (GPS included) dropped, WebP. Only that file is stored, on
  Vercel Blob under `members/{id}/`, content-addressed; the old one is
  deleted. The member is the SESSION's, never an id from the form.

  Not run through the brand grade (lib/photo-grade.mjs): that's for
  Geekdom's photography. This is a person's own picture of themselves.

  Stored on the member record as `photo` — NOT inside `profile`, which
  saveMyProfile replaces whole on every save.
*/

const MAX_BYTES = 1_500_000;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadMyPhoto(form: FormData): Promise<{ ok: boolean; message: string; url?: string }> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  if (!me) return { ok: false, message: "There's no membership on this account." };
  const file = form.get("photo");
  if (!(file instanceof File) || !file.size) return { ok: false, message: "Choose a photo." };
  if (!TYPES.has(file.type)) return { ok: false, message: "Use a JPEG, PNG or WebP photo." };
  if (file.size > MAX_BYTES) return { ok: false, message: "That photo is too large. Try another." };

  let out: Buffer;
  try {
    out = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(512, 512, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return { ok: false, message: "That file doesn't look like a photo. Try another." };
  }

  const hash = createHash("sha256").update(out).digest("hex").slice(0, 16);
  const blob = await put(`members/${me.id}/photo-${hash}.webp`, out, {
    access: "public",
    contentType: "image/webp",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  const before = (await getAdminDb().collection(COLLECTIONS.members).doc(me.id).get()).data()?.photo as string | undefined;
  await getAdminDb().collection(COLLECTIONS.members).doc(me.id).set({ photo: blob.url, updatedAt: new Date() }, { merge: true });
  if (before && before !== blob.url) await del(before, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
  refresh();
  return { ok: true, message: "Photo saved.", url: blob.url };
}

export async function removeMyPhoto(): Promise<{ ok: boolean; message: string }> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  if (!me) return { ok: false, message: "There's no membership on this account." };
  const ref = getAdminDb().collection(COLLECTIONS.members).doc(me.id);
  const before = (await ref.get()).data()?.photo as string | undefined;
  await ref.set({ photo: null, updatedAt: new Date() }, { merge: true });
  if (before) await del(before, { token: process.env.BLOB_READ_WRITE_TOKEN }).catch(() => {});
  refresh();
  return { ok: true, message: "Photo removed." };
}

function refresh() {
  revalidatePath("/portal/profile");
  revalidatePath("/portal/directory");
  revalidatePath("/portal/welcome");
  revalidatePath("/portal");
}

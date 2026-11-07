"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { requireMember } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { getMemberByEmail } from "@/lib/admin/queries";
import { AUDIENCES } from "@/lib/membership";

/*
  A MEMBER SAVES THEIR DIRECTORY PROFILE (Profile → Edit). The member is the
  SESSION's — never an id from the form. Links must be http(s); "listed"
  off takes them out of the directory on the next request.
*/

const url = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v && !/^https?:\/\//i.test(v) ? `https://${v}` : v))
  .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), "Use a full web address.");

const profileSchema = z.object({
  name: z.string({ error: "Add your name." }).trim().min(2, "Add your name.").max(120),
  headline: z.string().trim().max(160),
  role: z.string().trim().max(80),
  company: z.string().trim().max(120),
  audience: z.union([z.enum(AUDIENCES), z.literal("")]).default(""),
  askMeAbout: z.array(z.string().trim().min(1).max(40)).max(6),
  lookingFor: z.string().trim().max(300),
  bio: z.string().trim().max(2000),
  website: url,
  linkedin: url,
  listed: z.boolean(),
});

export type ProfileInput = z.input<typeof profileSchema>;

export async function saveMyProfile(input: ProfileInput): Promise<{ ok: boolean; message: string }> {
  const user = await requireMember();
  const me = await getMemberByEmail(user.email);
  if (!me) return { ok: false, message: "There's no membership on this account to save a profile to." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your profile and try again." };
  const { name, ...profile } = parsed.data;
  await getAdminDb()
    .collection(COLLECTIONS.members)
    .doc(me.id)
    // Saving the profile also ticks off onboarding's "Check your profile".
    .update({ name, profile, updatedAt: new Date(), "onboarding.done": FieldValue.arrayUnion("profile") });
  revalidatePath("/portal/profile");
  revalidatePath("/portal/directory");
  revalidatePath("/portal");
  return { ok: true, message: profile.listed ? "Saved. Your profile is in the directory." : "Saved. You're hidden from the directory." };
}

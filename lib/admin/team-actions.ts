"use server";

import { revalidatePath, updateTag } from "next/cache";
import * as z from "zod";
import { requireRole } from "@/lib/auth/session";
import { resolveAdminRole } from "@/lib/auth/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { logActivity } from "@/lib/admin/activity";
import { sendSafely } from "@/lib/email/resend";
import { adminAccessEmail } from "@/lib/email/member-templates";
import { ADMIN_ACCESS_TAG, adminAccessRef, type AccessEntry } from "@/lib/auth/admin-access";

/*
  GIVING AND REMOVING ADMIN ACCESS — owners only (requireRole("superadmin")), each
  a transaction over the one access doc (lib/auth/admin-access.ts), then the
  activity log and the cache tag, so the change is live on this copy of the
  site at once (others within 30 seconds).

  Guard rails: owners come from the hosting settings and can't be
  removed here; nobody removes their own access; an address that already
  has access isn't added twice.
*/

export interface TeamResult {
  ok: boolean;
  message: string;
}

const norm = (e: string) => e.trim().toLowerCase();

async function update(fn: (added: AccessEntry[], removed: AccessEntry[]) => { added: AccessEntry[]; removed: AccessEntry[] }) {
  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(adminAccessRef())).data() ?? {};
    const next = fn((d.added as AccessEntry[] | undefined) ?? [], (d.removed as AccessEntry[] | undefined) ?? []);
    tx.set(adminAccessRef(), { ...next, updatedAt: new Date() });
  });
}

function refresh() {
  updateTag(ADMIN_ACCESS_TAG);
  revalidatePath("/portal/admin/team");
}

const addSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  name: z.string().trim().max(120).default(""),
});

export async function addAdmin(input: z.input<typeof addSchema>): Promise<TeamResult> {
  const me = await requireRole("superadmin");
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the email address." };
  const { email, name } = parsed.data;
  const base = resolveAdminRole(email);
  let restored = false;
  let already = false;
  await update((added, removed) => {
    if (removed.some((r) => r.email === email)) {
      restored = true;
      return { added, removed: removed.filter((r) => r.email !== email) };
    }
    if (base || added.some((a) => a.email === email)) {
      already = true;
      return { added, removed };
    }
    return { added: [...added, { email, name, by: me.name || me.email, at: new Date().toISOString() }], removed };
  });
  if (already) return { ok: false, message: base === "superadmin" ? "They're an owner already." : "They already have access." };

  await logActivity(me, { area: "team", action: restored ? "gave back admin access to" : "gave admin access to", label: name ? `${name} (${email})` : email, href: "/portal/admin/team" });
  const mail = adminAccessEmail({ name: name || email, by: me.name || "The Geekdom team" });
  const sent = await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  refresh();
  return { ok: true, message: `${name || email} has admin access.${sent ? " We've emailed them how to sign in." : " The email didn't send — tell them to sign in at /sign-in."}` };
}

export async function removeAdmin(rawEmail: string): Promise<TeamResult> {
  const me = await requireRole("superadmin");
  if (typeof rawEmail !== "string" || !rawEmail.trim()) return { ok: false, message: "Missing email." };
  const email = norm(rawEmail);
  if (email === norm(me.email)) return { ok: false, message: "You can't remove your own access." };
  const base = resolveAdminRole(email);
  if (base === "superadmin") return { ok: false, message: "Owners are set in the hosting settings, not here." };
  let changed = false;
  await update((added, removed) => {
    if (added.some((a) => a.email === email)) {
      changed = true;
      return { added: added.filter((a) => a.email !== email), removed };
    }
    if (base === "staff" && !removed.some((r) => r.email === email)) {
      changed = true;
      return { added, removed: [...removed, { email, name: "", by: me.name || me.email, at: new Date().toISOString() }] };
    }
    return { added, removed };
  });
  if (!changed) return { ok: false, message: "They don't have access to remove." };
  await logActivity(me, { area: "team", action: "removed admin access from", label: email, href: "/portal/admin/team" });
  refresh();
  return { ok: true, message: `${email} no longer has admin access.` };
}

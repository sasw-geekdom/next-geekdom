"use server";

import { revalidatePath, updateTag } from "next/cache";
import * as z from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { adminAllowed } from "@/lib/auth/session";
import { MANAGEMENT_ONLY_MESSAGE, resolveAdminRole, ROLE_LABELS } from "@/lib/auth/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { logActivity } from "@/lib/admin/activity";
import { sendSafely } from "@/lib/email/resend";
import { adminAccessEmail } from "@/lib/email/member-templates";
import { ADMIN_ACCESS_TAG, adminAccessRef, type AccessEntry } from "@/lib/auth/admin-access";

/*
  GIVING, CHANGING AND REMOVING ADMIN ACCESS — Management and the Developer
  only (`access.manage`). Each is a transaction over the one access doc
  (lib/auth/admin-access.ts), then the activity log and the cache tag, so
  the change is live on this copy of the site at once (others within 30
  seconds).

  Guard rails: the Developer comes from the hosting settings and can't be
  changed or removed here; nobody changes or removes their OWN access (so
  the last Management user can't demote themselves out — and the Developer
  is there regardless); an address that already has access isn't added
  twice.
*/

export interface TeamResult {
  ok: boolean;
  message: string;
}

type Lists = { management: AccessEntry[]; added: AccessEntry[]; removed: AccessEntry[] };

const norm = (e: string) => e.trim().toLowerCase();
const without = (list: AccessEntry[], email: string) => list.filter((x) => x.email !== email);

async function update(fn: (lists: Lists) => Lists) {
  const db = getAdminDb();
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(adminAccessRef())).data() ?? {};
    const next = fn({
      management: (d.management as AccessEntry[] | undefined) ?? [],
      added: (d.added as AccessEntry[] | undefined) ?? [],
      removed: (d.removed as AccessEntry[] | undefined) ?? [],
    });
    // merge: the lists are replaced whole; `names` (setAdminName) is left alone.
    tx.set(adminAccessRef(), { ...next, updatedAt: new Date() }, { merge: true });
  });
}

function refresh() {
  updateTag(ADMIN_ACCESS_TAG);
  revalidatePath("/portal/admin/team");
}

const ROLE_INPUT = z.enum(["management", "staff"]);

const addSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  name: z.string().trim().max(120).default(""),
  role: ROLE_INPUT.default("staff"),
});

export async function addAdmin(input: z.input<typeof addSchema>): Promise<TeamResult> {
  const me = await adminAllowed("access.manage");
  if (!me) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the email address." };
  const { email, name, role } = parsed.data;
  const base = resolveAdminRole(email);
  if (base === "developer") return { ok: false, message: "They're the Developer already." };
  const entry: AccessEntry = { email, name, by: me.name || me.email, at: new Date().toISOString() };
  let restored = false;
  let already = false;
  await update((l) => {
    const wasRemoved = l.removed.some((r) => r.email === email);
    const has = !wasRemoved && (Boolean(base) || l.added.some((a) => a.email === email) || l.management.some((m) => m.email === email));
    if (has) {
      already = true;
      return l;
    }
    restored = wasRemoved;
    const removed = without(l.removed, email);
    if (role === "management") return { management: [...without(l.management, email), entry], added: l.added, removed };
    // Staff: @geekdom.com needs no entry; anyone else is listed as added.
    return { management: l.management, added: base ? l.added : [...without(l.added, email), entry], removed };
  });
  if (already) return { ok: false, message: "They already have access — change their role from the list." };

  const label = ROLE_LABELS[role];
  await logActivity(me, { area: "team", action: `${restored ? "gave back" : "gave"} ${label} access to`, label: name ? `${name} (${email})` : email, href: "/portal/admin/team" });
  const mail = adminAccessEmail({ name: name || email, by: me.name || "The Geekdom team", role: label });
  const sent = await sendSafely({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
  refresh();
  return { ok: true, message: `${name || email} has ${label} access.${sent ? " We've emailed them how to sign in." : " The email didn't send — tell them to sign in at /sign-in."}` };
}

/** Management ⇄ Staff for someone who already has access. */
export async function setAdminRole(rawEmail: string, rawRole: string): Promise<TeamResult> {
  const me = await adminAllowed("access.manage");
  if (!me) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  const role = ROLE_INPUT.safeParse(rawRole);
  if (typeof rawEmail !== "string" || !rawEmail.trim() || !role.success) return { ok: false, message: "That didn't come through. Refresh and try again." };
  const email = norm(rawEmail);
  if (email === norm(me.email)) return { ok: false, message: "You can't change your own role — ask someone else in Management." };
  const base = resolveAdminRole(email);
  if (base === "developer") return { ok: false, message: "The Developer is set in the hosting settings, not here." };

  let result: "changed" | "same" | "missing" = "missing";
  await update((l) => {
    if (l.removed.some((r) => r.email === email)) return l;
    const isManagement = l.management.find((m) => m.email === email);
    const isAdded = l.added.find((a) => a.email === email);
    if (!base && !isManagement && !isAdded) return l;
    if ((role.data === "management") === Boolean(isManagement)) {
      result = "same";
      return l;
    }
    result = "changed";
    const name = isManagement?.name ?? isAdded?.name ?? "";
    const entry: AccessEntry = { email, name, by: me.name || me.email, at: new Date().toISOString() };
    if (role.data === "management") return { management: [...l.management, entry], added: without(l.added, email), removed: l.removed };
    // Back to Staff. Someone outside @geekdom.com keeps access as "added".
    return { management: without(l.management, email), added: base ? l.added : [...without(l.added, email), entry], removed: l.removed };
  });
  if (result === "missing") return { ok: false, message: "They don't have access. Add them first." };
  if (result === "same") return { ok: false, message: `They're ${ROLE_LABELS[role.data]} already.` };
  const label = ROLE_LABELS[role.data];
  await logActivity(me, { area: "team", action: `changed to ${label}:`, label: email, href: "/portal/admin/team" });
  refresh();
  return { ok: true, message: `${email} is ${label} now.` };
}

export async function removeAdmin(rawEmail: string): Promise<TeamResult> {
  const me = await adminAllowed("access.manage");
  if (!me) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (typeof rawEmail !== "string" || !rawEmail.trim()) return { ok: false, message: "Missing email." };
  const email = norm(rawEmail);
  if (email === norm(me.email)) return { ok: false, message: "You can't remove your own access." };
  const base = resolveAdminRole(email);
  if (base === "developer") return { ok: false, message: "The Developer is set in the hosting settings, not here." };
  let changed = false;
  await update((l) => {
    const listed = l.management.some((m) => m.email === email) || l.added.some((a) => a.email === email);
    const domainLive = base === "staff" && !l.removed.some((r) => r.email === email);
    if (!listed && !domainLive) return l;
    changed = true;
    return {
      management: without(l.management, email),
      added: without(l.added, email),
      // An @geekdom.com address has access by domain, so it's switched off explicitly.
      removed: base === "staff" && !l.removed.some((r) => r.email === email) ? [...l.removed, { email, name: "", by: me.name || me.email, at: new Date().toISOString() }] : l.removed,
    };
  });
  if (!changed) return { ok: false, message: "They don't have access to remove." };
  await logActivity(me, { area: "team", action: "removed admin access from", label: email, href: "/portal/admin/team" });
  refresh();
  return { ok: true, message: `${email} no longer has admin access.` };
}

/**
 * The name the admin shows for someone — typed once, so "brooke@geekdom.com"
 * reads "Brooke …" in the list, the history and the activity log. Blank
 * clears it (back to their login's name). Applies on their next page load.
 */
export async function setAdminName(rawEmail: string, rawName: string): Promise<TeamResult> {
  const me = await adminAllowed("access.manage");
  if (!me) return { ok: false, message: MANAGEMENT_ONLY_MESSAGE };
  if (typeof rawEmail !== "string" || !rawEmail.trim() || typeof rawName !== "string") return { ok: false, message: "That didn't come through. Refresh and try again." };
  const email = norm(rawEmail);
  const name = rawName.trim().replace(/\s+/g, " ");
  if (name.length > 80) return { ok: false, message: "Keep the name under 80 characters." };
  // A merge write: setting a key sets it; clearing needs an explicit delete
  // (leaving the key out of a merged map leaves the old value in place).
  // set(), not update(): an email's dots would read as a field path there.
  await adminAccessRef().set({ names: { [email]: name || FieldValue.delete() }, updatedAt: new Date() }, { merge: true });
  await logActivity(me, { area: "team", action: name ? `set the admin name "${name}" for` : "cleared the admin name for", label: email, href: "/portal/admin/team" });
  refresh();
  return { ok: true, message: name ? `${email} shows as ${name} now.` : `${email}'s name is back to their login's.` };
}

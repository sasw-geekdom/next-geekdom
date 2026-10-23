"use server";

import { revalidatePath } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { fieldErrors } from "@/lib/validation/schemas";
import { fromCentral } from "@/lib/content/dates";
import { ensureLogin } from "@/lib/admin/member-logins";
import type { ActionResult } from "@/lib/content/types";

/*
  "ADD A MEMBER" AND EDITING ONE, from /portal/admin/members.

  A Geekdom membership is one person, so a member is one record and one
  Firebase account. Adding a member writes the record AND creates the login
  (no email is sent — they sign in at /sign-in with a link to this address),
  which is what lets them in once self sign-up is turned off in Firebase.

  The record's id is an auto id that never changes. Email and the Stripe
  customer id are fields, looked up by value — renaming someone or fixing a
  typo in their email can't detach their history (next-angels keys members
  by name and has to warn about exactly that).

  Deactivating is a status, not a delete: `canceled` or `inactive` removes
  portal access on the member's next request (lib/auth/session.ts resolves
  the role every time) and keeps their record, notes and history.
*/

/** The statuses staff can set. `past_due` and `trialing` only come from Stripe. */
const ADMIN_STATUSES = ["active", "inactive", "canceled"] as const;

const memberSchema = z.object({
  id: z.string().optional(),
  name: z
    .string({ error: "Add the member's name." })
    .trim()
    .min(2, "Add the member's name.")
    .max(120, "Keep the name under 120 characters."),
  email: z
    .email({ error: "Add a valid email — it's the one they'll sign in with." })
    .trim()
    .toLowerCase(),
  status: z.enum(ADMIN_STATUSES, { error: "Pick a status." }),
  year: z.string({ error: "Add the date they joined." }).regex(/^\d{4}$/, "Add the date they joined."),
  month: z.string({ error: "Add the date they joined." }).regex(/^\d{2}$/, "Add the date they joined."),
  day: z.string({ error: "Add the date they joined." }).regex(/^\d{2}$/, "Add the date they joined."),
  tags: z
    .array(z.string().trim().min(1).max(40))
    .max(20)
    .transform((t) => [...new Set(t.map((x) => x.toLowerCase()))].sort()),
  notes: z.string().trim().max(4000, "Keep notes under 4,000 characters."),
});

export type MemberInput = z.input<typeof memberSchema>;

function refresh() {
  revalidatePath("/portal/admin/members");
  revalidatePath("/portal/admin");
}

export async function saveMember(input: MemberInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = memberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  const { id, year, month, day, ...data } = parsed.data;

  // Noon Central, not midnight UTC — midnight UTC is the previous evening
  // here, and the profile would show the day before they joined.
  const joined = fromCentral(year, month, day, "12:00");
  if (!joined) return { ok: false, fieldErrors: { day: "That date doesn't exist." } };
  if (Date.parse(joined) > Date.now() + 86_400_000) {
    return { ok: false, fieldErrors: { day: "The join date can't be in the future." } };
  }

  const col = getAdminDb().collection(COLLECTIONS.members);
  const ref = id ? col.doc(id) : col.doc();
  const before = id ? ((await ref.get()).data() as MemberDoc | undefined) : undefined;
  if (id && !before) return { ok: false, error: "That member no longer exists. Refresh the page." };

  // One person, one membership: no two records may share an email.
  if (!before || before.email !== data.email) {
    const clash = await col.where("email", "==", data.email).limit(1).get();
    if (!clash.empty && clash.docs[0].id !== ref.id) {
      return {
        ok: false,
        fieldErrors: { email: `${clash.docs[0].data().name} already has a membership under this email.` },
      };
    }
  }

  // A Stripe-billed member's status is Stripe's: the webhook would overwrite
  // an edit here on the next billing event, so don't pretend otherwise.
  const status =
    before?.stripeSubscriptionId && before.status !== data.status
      ? before.status
      : data.status;

  const record: Partial<MemberDoc> = {
    name: data.name,
    email: data.email,
    status,
    tags: data.tags,
    notes: data.notes,
    joinedAt: Timestamp.fromDate(new Date(joined)),
    updatedAt: Timestamp.now(),
  };
  if (!before) {
    Object.assign(record, {
      source: "admin",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    } satisfies Partial<MemberDoc>);
  }
  await ref.set(record, { merge: true });

  // The login follows the email. Created for a new member; moved when an
  // email is corrected, so the person keeps one account.
  const login = await ensureLogin(data.email, data.name, before?.email);

  refresh();
  if (!login.ok) {
    return { ok: false, error: `Saved, but their sign-in couldn't be set up: ${login.error}` };
  }
  return { ok: true, id: ref.id };
}

/** "Create login" for a member who has none (e.g. one Stripe created before logins existed). */
export async function createMemberLogin(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "Missing member." };
  const doc = await getAdminDb().collection(COLLECTIONS.members).doc(id).get();
  const m = doc.data() as MemberDoc | undefined;
  if (!m) return { ok: false, error: "That member no longer exists." };
  const login = await ensureLogin(m.email, m.name);
  refresh();
  return login.ok ? { ok: true } : { ok: false, error: login.error };
}

"use server";

import { revalidatePath, updateTag } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as z from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";
import { fieldErrors, stripUndefined } from "@/lib/validation/schemas";
import { fromCentral } from "@/lib/content/dates";
import { EVENTS_TAG, seedEvents } from "@/lib/content/events";
import type { ActionResult } from "@/lib/content/types";

/*
  WRITES FOR "THIS MONTH IN THE CLUB".

  Every action: `requireAdmin()` first (server actions are public POST
  endpoints — the layout's check never runs for them), zod on the input
  (base-type `error`s, so a missing field says what's missing), then the
  write, then `updateTag` + `revalidatePath` so the homepage and the portal
  dashboard are fresh on the very next request. `updateTag` is the Next 16
  call for read-your-own-writes in a server action; `revalidateTag` would
  serve the stale list once more first.
*/

const two = (label: string) =>
  z.string({ error: `${label} is required.` }).regex(/^\d{2}$/, `${label} is required.`);

const eventSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string({ error: "Give the event a title." })
      .trim()
      .min(3, "Give the event a title.")
      .max(160, "Keep the title under 160 characters."),
    href: z
      .string({ error: "Add the event's link." })
      .trim()
      .regex(/^https?:\/\//, "The link must start with http:// or https://."),
    host: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v ? v : undefined)),
    year: z.string({ error: "Year is required." }).regex(/^\d{4}$/, "Year is required."),
    month: two("Month"),
    day: two("Day"),
    startTime: z.string({ error: "Start time is required." }).regex(/^\d{2}:\d{2}$/, "Start time is required."),
    endTime: z.string({ error: "End time is required." }).regex(/^\d{2}:\d{2}$/, "End time is required."),
  })
  .transform((v, ctx) => {
    const startsAt = fromCentral(v.year, v.month, v.day, v.startTime);
    const endsAt = fromCentral(v.year, v.month, v.day, v.endTime);
    if (!startsAt) {
      ctx.addIssue({ code: "custom", path: ["day"], message: "That date doesn't exist." });
      return z.NEVER;
    }
    if (!endsAt || endsAt <= startsAt) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "End time must be after the start." });
      return z.NEVER;
    }
    return { id: v.id, title: v.title, href: v.href, host: v.host, startsAt, endsAt };
  });

export type EventInput = z.input<typeof eventSchema>;

function refresh() {
  updateTag(EVENTS_TAG);
  revalidatePath("/");
  revalidatePath("/portal");
  revalidatePath("/portal/admin/events");
}

export async function saveEvent(input: EventInput): Promise<ActionResult> {
  await requireAdmin();
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };

  const { id, startsAt, endsAt, ...rest } = parsed.data;
  const col = getAdminDb().collection(COLLECTIONS.events);
  const ref = id ? col.doc(id) : col.doc();
  const record = stripUndefined({
    ...rest,
    // A cleared host must actually clear — merge would keep the old one.
    host: rest.host ?? FieldValue.delete(),
    startsAt: Timestamp.fromDate(new Date(startsAt)),
    endsAt: Timestamp.fromDate(new Date(endsAt)),
    updatedAt: FieldValue.serverTimestamp(),
    ...(id ? {} : { createdAt: FieldValue.serverTimestamp() }),
  });
  await ref.set(record, { merge: true });

  refresh();
  return { ok: true, id: ref.id };
}

export async function deleteEvent(id: string): Promise<ActionResult> {
  await requireAdmin();
  if (typeof id !== "string" || !id) return { ok: false, error: "Missing event." };
  await getAdminDb().collection(COLLECTIONS.events).doc(id).delete();
  refresh();
  return { ok: true };
}

/**
 * "Copy from the current site": write THIS_MONTH into an EMPTY collection.
 * Refuses once anything is there, so a second press can't duplicate rows.
 */
export async function seedEventsFromSite(): Promise<ActionResult> {
  await requireAdmin();
  const col = getAdminDb().collection(COLLECTIONS.events);
  if (!(await col.limit(1).get()).empty) {
    return { ok: false, error: "There are events here already, so nothing was copied." };
  }
  const batch = getAdminDb().batch();
  const rows = seedEvents();
  for (const row of rows) {
    batch.set(col.doc(), {
      ...row,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  refresh();
  return { ok: true, count: rows.length };
}

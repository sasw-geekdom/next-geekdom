import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type ActivityDoc } from "@/lib/firebase/collections";
import type { SessionUser } from "@/lib/auth/roles";

/*
  THE ADMIN'S EDIT HISTORY — one `activity` doc per staff change: who, what,
  to which thing, when. Several people publish notes and edit events; this is
  the answer to "who changed that?".

  APPENDED AFTER THE WRITE SUCCEEDS, AND NEVER ALLOWED TO FAIL IT. A log
  that can't be written is reported to the server log and the change stands
  — losing a history line is better than refusing the edit it describes.

  Not every save: a Field Note's draft autosaves every 30 seconds, and a
  line per autosave would bury everything else. Drafts appear when they are
  created, published, unpublished, featured or deleted.

  Read with one `orderBy("at")` — no composite index, so a new database
  (a preview's) works without setup. Filtering by area happens after the read.
*/

export type ActivityArea = ActivityDoc["area"];

export const AREA_LABELS: Record<ActivityArea, string> = {
  events: "This month",
  "field-notes": "Field Notes",
  portfolio: "Built at Geekdom",
  members: "Members",
  applications: "Applications",
  "photo-wall": "Photo wall",
  "member-resources": "Member resources",
  inquiries: "Requests",
  rooms: "Rooms",
};

export interface ActivityEntry {
  id: string;
  at: string; // ISO
  actor: string;
  area: ActivityArea;
  action: string;
  label: string;
  href: string | null;
}

export async function logActivity(
  user: Pick<SessionUser, "email" | "name">,
  entry: { area: ActivityArea; action: string; label: string; href?: string },
): Promise<void> {
  try {
    const doc: ActivityDoc = {
      at: Timestamp.now(),
      actor: { email: user.email, name: user.name ?? null },
      area: entry.area,
      action: entry.action,
      label: entry.label.slice(0, 200) || "Untitled",
      ...(entry.href ? { href: entry.href } : {}),
    };
    await getAdminDb().collection(COLLECTIONS.activity).add(doc);
  } catch (err) {
    console.error("[activity] couldn't record", entry.area, entry.action, err);
  }
}

/** The newest changes first. Uncached: it's the admin's own view. */
export async function listActivity(limit = 100): Promise<ActivityEntry[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.activity).orderBy("at", "desc").limit(limit).get();
  return snap.docs.map((d) => {
    const a = d.data() as ActivityDoc;
    return {
      id: d.id,
      at: a.at.toDate().toISOString(),
      actor: a.actor.name || a.actor.email,
      area: a.area,
      action: a.action,
      label: a.label,
      href: a.href ?? null,
    };
  });
}

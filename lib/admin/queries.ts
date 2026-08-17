import "server-only";

import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type ApplicationDoc,
  type ApplicationStatus,
  type MemberDoc,
} from "@/lib/firebase/collections";
import type { Application, DashboardStats, Member } from "@/lib/admin/types";

/** Timestamp → ISO string, tolerating a missing or malformed value. */
function iso(value: Timestamp | null | undefined): string | null {
  if (!value) return null;
  // Older docs written before a field existed can hold a raw value rather than
  // a Timestamp; `toDate` is the only method we rely on.
  return value instanceof Timestamp ? value.toDate().toISOString() : null;
}

function toApplication(
  id: string,
  doc: ApplicationDoc,
): Application {
  return {
    id,
    name: doc.name,
    email: doc.email,
    phone: doc.phone,
    company: doc.company,
    role: doc.role,
    website: doc.website,
    linkedin: doc.linkedin,
    audience: doc.audience,
    stage: doc.stage,
    building: doc.building,
    needs: doc.needs,
    referredBy: doc.referredBy,
    formerMember: doc.formerMember,
    status: doc.status,
    notes: doc.notes,
    reviewedBy: doc.reviewedBy ?? null,
    reviewedAt: iso(doc.reviewedAt),
    invitedAt: iso(doc.invitedAt),
    createdAt: iso(doc.createdAt) ?? new Date(0).toISOString(),
  };
}

function toMember(id: string, doc: MemberDoc): Member {
  return {
    id,
    name: doc.name,
    email: doc.email,
    applicationId: doc.applicationId ?? null,
    stripeCustomerId: doc.stripeCustomerId,
    stripeSubscriptionId: doc.stripeSubscriptionId,
    status: doc.status,
    currentPeriodEnd: iso(doc.currentPeriodEnd),
    cancelAtPeriodEnd: doc.cancelAtPeriodEnd,
    joinedAt: iso(doc.joinedAt) ?? new Date(0).toISOString(),
    updatedAt: iso(doc.updatedAt) ?? new Date(0).toISOString(),
  };
}

// ─── Applications ───────────────────────────────────────────────────────────

export async function listApplications(opts?: {
  status?: ApplicationStatus;
  limit?: number;
}): Promise<Application[]> {
  let query = getAdminDb()
    .collection(COLLECTIONS.applications)
    .orderBy("createdAt", "desc")
    .limit(opts?.limit ?? 200);

  if (opts?.status) {
    // NOTE: an equality filter plus an orderBy on a different field needs a
    // composite index (status ASC, createdAt DESC). Firestore's error message
    // includes a one-click link to create it; the unfiltered query above works
    // without one.
    query = getAdminDb()
      .collection(COLLECTIONS.applications)
      .where("status", "==", opts.status)
      .orderBy("createdAt", "desc")
      .limit(opts?.limit ?? 200);
  }

  const snap = await query.get();
  return snap.docs.map((d) => toApplication(d.id, d.data() as ApplicationDoc));
}

export async function getApplication(id: string): Promise<Application | null> {
  const doc = await getAdminDb().collection(COLLECTIONS.applications).doc(id).get();
  if (!doc.exists) return null;
  return toApplication(doc.id, doc.data() as ApplicationDoc);
}

// ─── Members ────────────────────────────────────────────────────────────────

export async function listMembers(opts?: {
  limit?: number;
}): Promise<Member[]> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.members)
    .orderBy("joinedAt", "desc")
    .limit(opts?.limit ?? 500)
    .get();

  return snap.docs.map((d) => toMember(d.id, d.data() as MemberDoc));
}

/** Look a member up by email — the key the billing portal flow uses. */
export async function getMemberByEmail(email: string): Promise<Member | null> {
  const snap = await getAdminDb()
    .collection(COLLECTIONS.members)
    .where("email", "==", email.trim().toLowerCase())
    .limit(1)
    .get();

  const doc = snap.docs[0];
  return doc ? toMember(doc.id, doc.data() as MemberDoc) : null;
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const DAYS = 14;
  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  since.setHours(0, 0, 0, 0);

  // `count()` aggregations bill one document read each instead of streaming the
  // whole collection — the roster only needs totals here.
  const [total, newCount, active, pastDue, recent] = await Promise.all([
    getAdminDb().collection(COLLECTIONS.applications).count().get(),
    getAdminDb()
      .collection(COLLECTIONS.applications)
      .where("status", "==", "new")
      .count()
      .get(),
    getAdminDb()
      .collection(COLLECTIONS.members)
      .where("status", "==", "active")
      .count()
      .get(),
    getAdminDb()
      .collection(COLLECTIONS.members)
      .where("status", "==", "past_due")
      .count()
      .get(),
    getAdminDb()
      .collection(COLLECTIONS.applications)
      .where("createdAt", ">=", Timestamp.fromDate(since))
      .get(),
  ]);

  // Seed every day in the window so the chart has no gaps — a day with no
  // applications should render as a zero, not vanish and compress the axis.
  const buckets = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const doc of recent.docs) {
    const created = (doc.data() as ApplicationDoc).createdAt;
    if (!(created instanceof Timestamp)) continue;
    const key = created.toDate().toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return {
    applicationsTotal: total.data().count,
    applicationsNew: newCount.data().count,
    membersActive: active.data().count,
    membersPastDue: pastDue.data().count,
    applicationsByDay: [...buckets].map(([date, count]) => ({ date, count })),
  };
}

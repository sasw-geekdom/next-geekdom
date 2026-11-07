import "server-only";

import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type InquiryDoc } from "@/lib/firebase/collections";
import type { InquiryKind, InquiryStatus } from "@/lib/inquiries";

/** A client-safe inquiry: Timestamps as ISO strings (see lib/admin/types.ts). */
export interface Inquiry {
  id: string;
  kind: InquiryKind;
  status: InquiryStatus;
  company: string;
  name: string;
  email: string;
  eventType: string | null;
  headcount: string | null;
  when: string | null;
  interest: string | null;
  details: string | null;
  notes: string;
  decisions: { outcome: string; by: string; at: string; note?: string }[];
  createdAt: string;
}

const iso = (t?: { toDate(): Date } | null) => (t ? t.toDate().toISOString() : "");

function toInquiry(id: string, d: InquiryDoc): Inquiry {
  return {
    id,
    kind: d.kind,
    status: d.status,
    company: d.company,
    name: d.name,
    email: d.email,
    eventType: d.eventType ?? null,
    headcount: d.headcount ?? null,
    when: d.when ?? null,
    interest: d.interest ?? null,
    details: d.details ?? null,
    notes: d.notes ?? "",
    decisions: (d.decisions ?? []).map((x) => ({ ...x, at: iso(x.at) })),
    createdAt: iso(d.createdAt),
  };
}

/** Every inquiry, newest first. Filtered by the caller — no composite index. */
export async function listInquiries(limit = 1000): Promise<Inquiry[]> {
  const snap = await getAdminDb().collection(COLLECTIONS.inquiries).orderBy("createdAt", "desc").limit(limit).get();
  return snap.docs.map((d) => toInquiry(d.id, d.data() as InquiryDoc));
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  if (!/^[\w-]{1,40}$/.test(id)) return null;
  const doc = await getAdminDb().collection(COLLECTIONS.inquiries).doc(id).get();
  return doc.exists ? toInquiry(doc.id, doc.data() as InquiryDoc) : null;
}

import "server-only";

import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/firebase/collections";
import { INQUIRY_KINDS, INQUIRY_STATUSES, type InquiryKind, type InquiryStatus } from "@/lib/inquiries";
import { planOf } from "@/lib/membership";
import type { Application } from "@/lib/admin/types";
import type { Inquiry } from "@/lib/admin/inquiries";

/*
  THE REVIEW QUEUES — the order a reviewer walks through, shared by each
  list and its detail page so Previous / Next on the detail page follows
  exactly the rows the reviewer was looking at.

  The list's tab and sort ride along in the row links (?status=&sort=&dir=
  for applications, ?kind=&status= for requests). A detail page opened
  without them (an email link) queues within its own stage, newest first.
*/

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export type SortDir = "asc" | "desc";

/** Where an item sits in its queue, and its neighbors' ids. */
export interface Position {
  index: number;
  total: number;
  prev: string | null;
  next: string | null;
}

function position(ids: string[], id: string): Position | null {
  const index = ids.indexOf(id);
  if (index < 0) return null;
  return { index, total: ids.length, prev: ids[index - 1] ?? null, next: ids[index + 1] ?? null };
}

// ─── Applications ────────────────────────────────────────────────────────────

export const APPLICATION_SORTS = ["submitted", "name", "plan", "city"] as const;
export type ApplicationSort = (typeof APPLICATION_SORTS)[number];

export interface ApplicationQueue {
  status: ApplicationStatus | "all";
  sort: ApplicationSort;
  dir: SortDir;
}

export const naturalDir = (s: ApplicationSort): SortDir => (s === "submitted" ? "desc" : "asc");

export function parseApplicationQueue(p: Params, fallback: ApplicationStatus | "all" = "initial_review"): ApplicationQueue {
  const raw = one(p.status);
  const status = raw === "all" ? "all" : APPLICATION_STATUSES.includes(raw as ApplicationStatus) ? (raw as ApplicationStatus) : fallback;
  const sort = APPLICATION_SORTS.includes(one(p.sort) as ApplicationSort) ? (one(p.sort) as ApplicationSort) : "submitted";
  const d = one(p.dir);
  return { status, sort, dir: d === "asc" || d === "desc" ? d : naturalDir(sort) };
}

/** "status=team_review" — sort and dir only when they aren't the default. */
export function applicationQuery(q: ApplicationQueue): string {
  const sp = new URLSearchParams({ status: q.status });
  if (q.sort !== "submitted" || q.dir !== naturalDir(q.sort)) {
    sp.set("sort", q.sort);
    sp.set("dir", q.dir);
  }
  return sp.toString();
}

export function orderApplications(all: Application[], q: ApplicationQueue): Application[] {
  const key = (a: Application): string =>
    q.sort === "name" ? a.name.toLowerCase() : q.sort === "plan" ? planOf(a.plan).name : q.sort === "city" ? (a.city ?? "").toLowerCase() : a.createdAt ?? "";
  return (q.status === "all" ? all : all.filter((a) => a.status === q.status)).sort((a, b) => {
    const c = key(a).localeCompare(key(b));
    return q.dir === "asc" ? c : -c;
  });
}

export const applicationPosition = (all: Application[], q: ApplicationQueue, id: string) =>
  position(orderApplications([...all], q).map((a) => a.id), id);

// ─── Requests ────────────────────────────────────────────────────────────────

export interface InquiryQueue {
  kind: InquiryKind;
  status: InquiryStatus | "all";
}

export function parseInquiryQueue(p: Params, fallback?: { kind: InquiryKind; status: InquiryStatus }): InquiryQueue {
  const k = one(p.kind);
  const s = one(p.status);
  return {
    kind: INQUIRY_KINDS.includes(k as InquiryKind) ? (k as InquiryKind) : (fallback?.kind ?? "event"),
    status: s === "all" ? "all" : INQUIRY_STATUSES.includes(s as InquiryStatus) ? (s as InquiryStatus) : (fallback?.status ?? "new"),
  };
}

export const inquiryQuery = (q: InquiryQueue) => new URLSearchParams({ kind: q.kind, status: q.status }).toString();

/** Newest first — listInquiries already reads them that way. */
export const orderInquiries = (all: Inquiry[], q: InquiryQueue) =>
  all.filter((i) => i.kind === q.kind && (q.status === "all" || i.status === q.status));

export const inquiryPosition = (all: Inquiry[], q: InquiryQueue, id: string) =>
  position(orderInquiries(all, q).map((i) => i.id), id);

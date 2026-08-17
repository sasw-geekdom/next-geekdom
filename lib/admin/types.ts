import type {
  ApplicationStatus,
  MemberStatus,
} from "@/lib/firebase/collections";

/**
 * Plain, client-safe shapes.
 *
 * Firestore hands back `Timestamp` class instances, which are not serializable
 * across the server/client boundary — passing one to a client component throws
 * at render. Every query in lib/admin converts to these before returning, so
 * the boundary is crossed exactly once, in one place. Dates are ISO strings.
 */

export interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  website?: string;
  linkedin?: string;
  audience: string;
  stage: string;
  building: string;
  needs: string;
  referredBy?: string;
  formerMember: boolean;
  status: ApplicationStatus;
  notes?: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  invitedAt: string | null;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  applicationId: string | null;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: MemberStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  joinedAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  applicationsTotal: number;
  applicationsNew: number;
  membersActive: number;
  membersPastDue: number;
  /** Applications per day for the last 14 days, oldest first. */
  applicationsByDay: { date: string; count: number }[];
}

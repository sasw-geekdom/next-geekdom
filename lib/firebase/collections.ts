import "server-only";

import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/roles";
import type { Audience, Stage } from "@/lib/membership";

// Central registry of Firestore collection names — one place to rename.
export const COLLECTIONS = {
  applications: "applications",
  members: "members",
  staff: "staff",
  settings: "settings",
} as const;

/** Doc id in `settings` holding admin-edited email copy. */
export const EMAIL_SETTINGS_DOC = "emails";

// ─── Applications ───────────────────────────────────────────────────────────

/**
 * Where an application sits in review.
 *
 * `approved` means staff said yes and an invite went out; it does NOT mean the
 * person is a member. They become one when Stripe confirms the subscription,
 * at which point a `members` doc appears. Keeping the two states in separate
 * collections is deliberate — an approved applicant who never pays should not
 * show up on the roster.
 */
export type ApplicationStatus =
  | "new"
  | "reviewing"
  | "approved"
  | "declined"
  | "waitlisted";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "new",
  "reviewing",
  "approved",
  "declined",
  "waitlisted",
];

export interface ApplicationDoc {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  website?: string;
  linkedin?: string;
  audience: Audience;
  stage: Stage;
  /** "What are you building?" — the question staff actually reads. */
  building: string;
  /** "What do you need from the room?" */
  needs: string;
  referredBy?: string;
  /** Was this person a coworking member before the transition? */
  formerMember: boolean;

  status: ApplicationStatus;
  /** Free-text staff notes, appended in the admin portal. */
  notes?: string;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;

  /**
   * Set when an invite email goes out. Also the idempotency guard — approving
   * twice must not send two checkout links.
   */
  invitedAt?: Timestamp | null;

  createdAt: Timestamp;
}

// ─── Members ────────────────────────────────────────────────────────────────

/**
 * Mirrors the Stripe subscription status we care about. Stripe has more
 * (`paused`, `incomplete_expired`, …); anything unrecognized maps to `inactive`
 * so an unknown future status can never read as an active membership.
 */
export type MemberStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "inactive";

export interface MemberDoc {
  name: string;
  email: string;
  /** Back-reference to the application they came in through, when there is one. */
  applicationId?: string | null;

  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: MemberStatus;
  /** End of the paid-through window, so staff can see who lapses when. */
  currentPeriodEnd: Timestamp | null;
  /** True when the member has asked Stripe to stop at period end. */
  cancelAtPeriodEnd: boolean;

  joinedAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export interface StaffDoc {
  email: string;
  role: Role;
  createdAt: Timestamp;
}

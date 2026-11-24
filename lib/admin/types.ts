import type {
  ApplicationStatus,
  MemberProfile,
  MemberStatus,
} from "@/lib/firebase/collections";
import type { ResearchRecommendation } from "@/lib/application-research";
import type { PlanId } from "@/lib/membership";
import type { CompPeriod } from "@/lib/perks";
import type { RichDoc } from "@/lib/field-notes/types";

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
  firstName?: string;
  lastName?: string;
  phone?: string;
  city?: string;
  company?: string;
  website?: string;
  heardAbout?: string;
  heardAboutOther?: string;
  brag?: string;
  building: string;
  shipped?: string;
  links?: string;
  describes: string[];
  describesOther?: string;
  whyGeekdom?: string;
  giveBack?: string;
  excited?: string;
  otherCommunities?: string;
  anythingElse?: string;
  formerMember: boolean;
  source: "apply" | "airtable";
  plan: PlanId;
  status: ApplicationStatus;
  notes?: string;
  /** The research write-up, already cleaned — null until someone saves one. */
  research: {
    doc: RichDoc;
    recommendation: ResearchRecommendation | null;
    by: string;
    updatedAt: string;
    /** Not saved as a write-up yet: shown from the old staff notes. */
    fromNotes?: boolean;
  } | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  /** Every step taken, oldest first. */
  decisions: { stage: string; outcome: string; by: string; at: string; note?: string }[];
  invitedAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  applicationId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: MemberStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  joinedAt: string;
  updatedAt: string;
  source: "stripe" | "admin" | "import" | "application" | "team";
  tags: string[];
  notes: string;
  plan: PlanId;
  company: string;
  /** Set on a teammate: the owner's member id. */
  teamOwnerId: string | null;
  profile: MemberProfile | null;
  onboarding: { done: string[]; dismissed: boolean; firstSeenAt: string | null; welcomedAt: string | null };
  /** A mailbox add-on, if they have one (lib/stripe/extras.ts). */
  mailbox: { since: string; separate: boolean } | null;
  /** The team or Enterprise account they're on (lib/teams.ts) — owner or teammate. */
  teamId: string | null;
  /** The Terms of Membership they agreed to (lib/terms.ts), or null. */
  terms: { version: string; acceptedAt: string } | null;
  portalInvitedAt: string | null;
  /** A complimentary period from a perk tag (lib/perks.ts), running or ended. */
  comp: CompPeriod | null;
  /** Why and how it ended or is ending (lib/membership-exit.ts). */
  cancellation: import("@/lib/membership-exit").Cancellation | null;
  photo: string | null;
}

export interface DashboardStats {
  applicationsTotal: number;
  applicationsNew: number;
  membersActive: number;
  membersPastDue: number;
  /** Applications per day for the last 14 days, oldest first. */
  applicationsByDay: { date: string; count: number }[];
}

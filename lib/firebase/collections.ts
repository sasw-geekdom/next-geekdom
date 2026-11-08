import "server-only";

import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "@/lib/auth/roles";
import type { PlanId } from "@/lib/membership";
import type { InquiryKind, InquiryStatus } from "@/lib/inquiries";

// Central registry of Firestore collection names — one place to rename.
export const COLLECTIONS = {
  applications: "applications",
  members: "members",
  staff: "staff",
  settings: "settings",
  // Site content edited from the admin — see lib/content/.
  events: "events",
  portfolio: "portfolio",
  // Field Notes, the blog — see lib/field-notes/.
  fieldNotes: "fieldNotes",
  // One doc per hashed email: when its last sign-in link went out.
  authThrottle: "authThrottle",
  // Who changed what in the admin — see lib/admin/activity.ts.
  activity: "activity",
  // Event requests and Studio partner inquiries — see lib/inquiries.ts.
  inquiries: "inquiries",
  // Conference-room booking — see lib/rooms/.
  rooms: "rooms",
  bookings: "bookings",
  /** One doc per room per 30-minute slot taken: `${roomId}_${slotIso}`. The double-booking lock. */
  roomSlots: "roomSlots",
  /** One doc per member per week: the slots they hold — the 4-hour cap and no double-booking yourself. */
  roomWeeks: "roomWeeks",
} as const;

/**
 * An event request (/club) or a Studio partner inquiry (/studio), reviewed
 * in one step at /portal/admin/requests. Kind-specific answers sit beside
 * the shared contact fields; the ones a kind doesn't ask are absent.
 */
export interface InquiryDoc {
  kind: InquiryKind;
  status: InquiryStatus;
  company: string;
  name: string;
  email: string;
  /** event */
  eventType?: string;
  headcount?: string;
  when?: string;
  /** partner */
  interest?: string;
  /** Both: the free-text "anything else" / "what should we know". */
  details?: string;
  notes?: string;
  /** Every step, oldest first — same shape as an application's. */
  decisions?: { outcome: string; by: string; at: Timestamp; note?: string }[];
  createdAt: Timestamp;
}

/**
 * A member's directory profile. LISTED BY DEFAULT (Geekdom's call): a member
 * appears in the directory unless they switch `listed` off. No email or
 * phone — the directory never shows contact details.
 */
export interface MemberProfile {
  headline: string;
  role: string;
  company: string;
  /** "You're mostly a…" — the directory's filter. Empty until they pick one. */
  audience: string;
  askMeAbout: string[];
  lookingFor: string;
  bio: string;
  website: string;
  linkedin: string;
  listed: boolean;
}

/** Doc id in `settings` holding the member portal's editable basics. */
export const MEMBER_RESOURCES_DOC = "memberResources";
/** settings/siteCopy — the public pages' edited words (lib/content/site-copy.ts). */
export const SITE_COPY_DOC = "siteCopy";

/** One staff change, appended by every admin write (lib/admin/activity.ts). */
export interface ActivityDoc {
  at: Timestamp;
  /** Who did it, as they were signed in at the time. */
  actor: { email: string; name: string | null };
  area: "events" | "field-notes" | "portfolio" | "members" | "applications" | "photo-wall" | "member-resources" | "inquiries" | "rooms" | "site-copy" | "team";
  /** Past tense, lower case: "published", "added", "deleted"… */
  action: string;
  /** What it was done to, in words: the note's title, the member's name. */
  label: string;
  /** The admin page to look at it, when there is one. */
  href?: string;
}

/**
 * One Field Note. The DRAFT is the top-level content; what's LIVE is a
 * snapshot taken at publish (`publishedJson`), so editing a live note never
 * changes the site until "Publish changes".
 *
 * FRAMES ARE A JSON STRING, not a Firestore array. Rich text is Tiptap JSON —
 * arrays of maps of arrays, nested as deep as the lists go — and Firestore
 * rejects an array directly inside an array and caps nesting at 20 levels.
 * A string sidesteps both, and the content is validated as a whole anyway
 * (lib/field-notes/schemas.ts) on the way in.
 */
export interface FieldNoteDoc {
  title: string;
  slug: string;
  dek: string;
  author: string;
  /** JSON of Frame[] (lib/field-notes/types.ts). */
  framesJson: string;
  seo: { title: string; description: string; image?: string };
  status: "draft" | "published";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  /** JSON of the published NoteContent. Absent until first publish. */
  publishedJson?: string;
  publishedSlug?: string;
  publishedAt?: Timestamp;
  publishedUpdatedAt?: Timestamp;
  /** The live share card: generated at publish, or the uploaded override. */
  ogImage?: string;
  /** Slugs this note was live under before — for redirects once it's public. */
  previousSlugs?: string[];
  /**
   * The /field-notes hero. At most one note carries it (`setFeatured` clears
   * the others in the same batch); none means the newest is the hero. Not
   * part of the snapshot — it's placement, not content, so it takes effect
   * without a publish.
   */
  featured?: boolean;
}

/** Doc id in `settings` holding admin-edited email copy. */
export const EMAIL_SETTINGS_DOC = "emails";

/**
 * The /since-2011 photo wall's thumbnail manifest, in the settings collection.
 *
 * ONE DOCUMENT, NOT A COLLECTION. The wall renders every photo at once, so a
 * per-photo collection would mean one read per image on a page that is one
 * scroll; a single array read is one read for the whole wall. See lib/gallery.ts.
 */
export const GALLERY_SETTINGS_DOC = "gallery";

// ─── Applications ───────────────────────────────────────────────────────────

/**
 * WHERE AN APPLICATION SITS — Geekdom's two-step review (November 2026,
 * replacing Typeform → Airtable):
 *
 *   initial_review → team_review → approved
 *          ↘ declined      ↘ declined          banned: anywhere, no email
 *
 * `approved` means the team said yes and the congratulations went out; it
 * does NOT mean the person is a member. Solo and Team become members when
 * Stripe confirms the subscription (the webhook writes `members`); an
 * approved Enterprise applicant is added as a member at approval, because
 * their terms are agreed off the site.
 *
 * OLD VALUES ARE READ, NEVER WRITTEN: "new" and "reviewing" read as
 * initial_review, "waitlisted" as declined (`normalizeApplicationStatus`).
 */
export type ApplicationStatus = "initial_review" | "team_review" | "approved" | "declined" | "banned";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "initial_review",
  "team_review",
  "approved",
  "declined",
  "banned",
];

/** A stored status, old or new, as one of today's five. */
export function normalizeApplicationStatus(raw: unknown): ApplicationStatus {
  if (raw === "new" || raw === "reviewing") return "initial_review";
  if (raw === "waitlisted") return "declined";
  return APPLICATION_STATUSES.includes(raw as ApplicationStatus) ? (raw as ApplicationStatus) : "initial_review";
}

/** One step taken on an application — the history the detail page shows. */
export interface ApplicationDecision {
  stage: "initial" | "team" | "staff";
  /** advanced (to team review), approved, declined, banned, reopened, payment link sent… */
  outcome: string;
  by: string;
  at: Timestamp;
  note?: string;
}

/**
 * An application — Geekdom's own questions (lib/application-questions.ts),
 * from /apply or imported from their Airtable (`source: "airtable"`).
 */
export interface ApplicationDoc {
  /** First + last, for everything that shows one name. */
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  city?: string;
  /** Required for Team and Enterprise. Not asked by Geekdom's Typeform. */
  company?: string;
  /** "LinkedIn or personal site". */
  website?: string;
  heardAbout?: string;
  heardAboutOther?: string;
  brag?: string;
  /** "What are you building?" */
  building: string;
  shipped?: string;
  links?: string;
  describes?: string[];
  describesOther?: string;
  whyGeekdom?: string;
  giveBack?: string;
  excited?: string;
  otherCommunities?: string;
  anythingElse?: string;
  /** Which membership they're applying for. Absent on pre-plan applications = Solo. */
  plan?: PlanId;
  /** "I'm a current Geekdom member" — a member of the coworking-era Geekdom. */
  formerMember: boolean;
  /** Where it came from: /apply, or Geekdom's Airtable (the import). */
  source?: "apply" | "airtable";

  /** Stored as written; read through `normalizeApplicationStatus`. */
  status: ApplicationStatus | "new" | "reviewing" | "waitlisted";
  /** Free-text staff notes, appended in the admin portal. */
  notes?: string;
  /** The last decision's who and when (the full trail is `decisions`). */
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;
  decisions?: ApplicationDecision[];

  /**
   * When the payment link (Solo, Team) went out. Also the idempotency guard
   * — approving twice must not send two checkout links.
   */
  invitedAt?: Timestamp | null;
  /** Stamped by the Stripe webhook when they pay — the application became a member. */
  paidAt?: Timestamp | null;

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

  /**
   * Null for a member added by staff or imported from Geekdom's CSV who
   * hasn't been through Stripe checkout. The doc id is NOT this — members
   * created by the webhook before this change are keyed by it, everyone else
   * has an auto id — so always look a member up by the FIELD.
   */
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: MemberStatus;
  /** End of the paid-through window, so staff can see who lapses when. */
  currentPeriodEnd: Timestamp | null;
  /** True when the member has asked Stripe to stop at period end. */
  cancelAtPeriodEnd: boolean;

  joinedAt: Timestamp;
  updatedAt: Timestamp;

  /** How the record began: the Stripe webhook, an admin, or the CSV import. */
  source?: "stripe" | "admin" | "import" | "application" | "team";
  /** Their membership plan. Absent on members from before plans = Solo. */
  plan?: PlanId;
  /** The company a Team or Enterprise membership belongs to. */
  company?: string;
  /**
   * TEAMMATES point at their team's OWNER (the member who applied and pays).
   * Their access follows the owner's status (lib/team.ts). Absent on owners
   * and on Solo members; removed (with `formerTeamOwnerId` kept) when a
   * teammate is taken off the team.
   */
  teamOwnerId?: string;
  formerTeamOwnerId?: string;
  /** Their directory profile, edited at Profile. Listed unless they opt out. */
  profile?: MemberProfile;
  /**
   * First-login onboarding (lib/onboarding.ts): the steps they've done or
   * skipped, and whether they folded the panel away with "Not now".
   */
  onboarding?: { done: string[]; dismissed?: boolean; firstSeenAt?: Timestamp };
  /** When the launch invitation (lib/invitations.ts) went to them. */
  portalInvitedAt?: Timestamp;
  /** Staff-only grouping ("founding member", "former coworking"). Never shown to members. */
  tags?: string[];
  /** Staff-only notes. Never shown to members. */
  notes?: string;
}

// ─── Staff ──────────────────────────────────────────────────────────────────

export interface StaffDoc {
  email: string;
  role: Role;
  createdAt: Timestamp;
}

// ─── Site content ───────────────────────────────────────────────────────────

/**
 * One row of "This month in the Club". The display date ("Oct 27", "Sept 23")
 * is derived from `startsAt` in Central time, never stored — stored text is
 * what drifted when THIS_MONTH was typed by hand.
 */
export interface EventDoc {
  title: string;
  href: string;
  /** Who hosts it, when it isn't Geekdom. Admin-facing only for now. */
  host?: string;
  startsAt: Timestamp;
  /** The row leaves the homepage once this passes. */
  endsAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** One cell of "Built at Geekdom". Mirrors `PortfolioCompany` in lib/site.ts. */
export interface PortfolioDoc {
  name: string;
  href?: string;
  link?: "site" | "story" | "video";
  stage: string;
  founded: number;
  studio: boolean;
  description?: string;
  /** A path under /public/portfolio, rendered as a CSS mask. */
  logo?: string;
  logoHeight?: string;
  logoMark?: "wordmark" | "symbol";
  /** Off the site without deleting the record. */
  hidden: boolean;
  /**
   * Position on the wall, set by dragging in the admin. Optional so a record
   * without one sorts by `founded` after the ordered ones rather than failing.
   */
  order?: number;
  updatedAt: Timestamp;
}

// ─── Conference rooms (lib/rooms/) ──────────────────────────────────────────

export interface RoomDoc {
  name: string;
  capacity: number;
  /** "75-inch TV", "Whiteboard", "Video-call camera"… */
  features: string[];
  description: string;
  /** Off = not bookable, kept for its history. */
  active: boolean;
  order: number;
}

export interface BookingDoc {
  roomId: string;
  /** As it was when booked, so a renamed room doesn't rewrite history. */
  roomName: string;
  start: Timestamp;
  end: Timestamp;
  minutes: number;
  status: "booked" | "canceled";
  /** A member's booking, or staff blocking the room (a Geekdom event, maintenance). */
  kind: "member" | "block";
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  /** Optional "what's it for" — staff see it, other members never do. For a block, its reason. */
  note: string;
  createdAt: Timestamp;
  createdBy: string;
  canceledAt?: Timestamp;
  canceledBy?: string;
}

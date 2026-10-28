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
  // Site content edited from the admin — see lib/content/.
  events: "events",
  portfolio: "portfolio",
  // Field Notes, the blog — see lib/field-notes/.
  fieldNotes: "fieldNotes",
  // One doc per hashed email: when its last sign-in link went out.
  authThrottle: "authThrottle",
} as const;

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
  source?: "stripe" | "admin" | "import";
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

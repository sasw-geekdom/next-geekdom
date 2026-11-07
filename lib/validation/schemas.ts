import { z } from "zod";
import { PLAN_IDS } from "@/lib/membership";
import { DESCRIBES, HEARD_ABOUT } from "@/lib/application-questions";
import { EVENT_TYPES, HEADCOUNTS, PARTNER_INTERESTS } from "@/lib/inquiries";
import { APPLICATION_STATUSES } from "@/lib/firebase/collections";

/*
  Shared field pieces.

  Every required field carries an explicit `error` on its base type, not just a
  message on `.min()`. Those two cover different cases: `.min()` fires when a
  string is present but too short, while `error` covers the field being absent
  entirely. Without it, a missing field surfaces zod's internal wording —
  "Invalid input: expected string, received undefined" — directly to an
  applicant, because the form submits with `noValidate` and the server is the
  only validator.

  `z.email()` is zod 4's top-level form; the chained `z.string().email()` is
  deprecated.
*/
const email = z
  .email("Enter a valid email.")
  .trim()
  .toLowerCase();

const name = z
  .string({ error: "Name is required." })
  .trim()
  .min(2, "Name is required.")
  .max(120);

/**
 * Optional free-text. Firestore rejects `undefined` in a document, so empty
 * strings normalize to undefined here and the route strips undefined keys
 * before writing — see stripUndefined below.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

// ─── Membership application ─────────────────────────────────────────────────

const longText = (label: string, min = 10) =>
  z
    .string({ error: label })
    .trim()
    .min(min, label)
    .max(4000);

/** Geekdom's own questions — lib/application-questions.ts. */
export const applicationSchema = z
  .object({
    plan: z.enum(PLAN_IDS, { message: "Pick a membership." }),
    firstName: z.string({ error: "Add your first name." }).trim().min(1, "Add your first name.").max(60),
    lastName: z.string({ error: "Add your last name." }).trim().min(1, "Add your last name.").max(60),
    email,
    phone: z.string({ error: "Add a phone number." }).trim().min(7, "Add a phone number.").max(40),
    city: z.string({ error: "Add your city." }).trim().min(2, "Add your city.").max(80),
    company: optionalText(160),
    website: z
      .string({ error: "Add your LinkedIn or personal site." })
      .trim()
      .min(4, "Add your LinkedIn or personal site.")
      .max(300),
    heardAbout: z.enum(HEARD_ABOUT, { message: "Pick one." }),
    heardAboutOther: optionalText(200),
    brag: longText("Brag about yourself in one sentence.", 10),
    building: longText("Tell us what you're building."),
    shipped: longText("Tell us what you've shipped, sold or built lately."),
    links: optionalText(1000),
    describes: z.array(z.enum(DESCRIBES)).min(1, "Pick at least one."),
    describesOther: optionalText(200),
    whyGeekdom: longText("Tell us why Geekdom."),
    giveBack: longText("Tell us what you'll give back."),
    excited: longText("Tell us what you're most excited to do."),
    otherCommunities: optionalText(1000),
    anythingElse: optionalText(2000),
    formerMember: z.boolean().default(false),
  })
  .superRefine((v, ctx) => {
    // A Team or Enterprise membership is a company's: say which.
    if (v.plan !== "solo" && !v.company) {
      ctx.addIssue({ code: "custom", path: ["company"], message: "Add your company — Team and Enterprise memberships are for a company." });
    }
  })
  .transform((v) => ({ ...v, name: `${v.firstName} ${v.lastName}`.trim() }));

export type ApplicationInput = z.infer<typeof applicationSchema>;

// ─── Inquiries: event requests and Studio partners ──────────────────────────

const inquiryBase = {
  company: z.string({ error: "Add your company." }).trim().min(2, "Add your company.").max(160),
  name,
  email,
};

export const inquirySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("event"),
    ...inquiryBase,
    eventType: z.enum(EVENT_TYPES, { message: "Pick the kind of event." }),
    headcount: z.enum(HEADCOUNTS, { message: "Pick roughly how many people." }),
    when: z.string({ error: "Tell us roughly when." }).trim().min(2, "Tell us roughly when.").max(200),
    details: optionalText(2000),
  }),
  z.object({
    kind: z.literal("partner"),
    ...inquiryBase,
    interest: z.enum(PARTNER_INTERESTS, { message: "Pick how you'd like to work with Studio companies." }),
    details: optionalText(2000),
  }),
]);

export type InquiryInput = z.infer<typeof inquirySchema>;

// ─── Admin: application review ──────────────────────────────────────────────

export const reviewSchema = z.object({
  id: z.string().trim().min(1),
  status: z.enum(APPLICATION_STATUSES as [string, ...string[]]),
  notes: optionalText(4000),
});

// ─── Billing portal request ─────────────────────────────────────────────────

export const portalRequestSchema = z.object({ email });

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Drop undefined values before handing an object to Firestore.
 *
 * Firestore's Admin SDK throws on `undefined` field values ("Cannot use
 * 'undefined' as a Firestore value") rather than skipping them, so an optional
 * field left blank blows up the whole write. Zod hands us `undefined` for those
 * by design, which makes this the seam where the two conventions meet.
 */
export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

/** Flatten a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

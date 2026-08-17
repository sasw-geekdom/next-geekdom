import { z } from "zod";
import { AUDIENCES, STAGES } from "@/lib/membership";
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

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => v === undefined || /^https?:\/\/.+\..+/.test(v), {
    message: "Enter a full URL, starting with https://",
  });

// ─── Membership application ─────────────────────────────────────────────────

export const applicationSchema = z.object({
  name,
  email,
  phone: optionalText(40),
  company: optionalText(160),
  role: optionalText(120),
  website: optionalUrl,
  linkedin: optionalUrl,

  audience: z.enum(AUDIENCES, { message: "Pick the one that fits best." }),
  stage: z.enum(STAGES, { message: "Pick a stage." }),

  building: z
    .string({ error: "Tell us what you're building." })
    .trim()
    .min(40, "Give us a couple of sentences — 40 characters minimum.")
    .max(2000),
  needs: z
    .string({ error: "Tell us what you're looking for." })
    .trim()
    .min(20, "Tell us what you're looking for.")
    .max(2000),

  referredBy: optionalText(160),
  formerMember: z.boolean().default(false),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;

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

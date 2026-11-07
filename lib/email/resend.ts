import "server-only";

import { Resend } from "resend";
import { env, envOr, hasEnv } from "@/lib/env";
import { ON_LIVE_DOMAIN } from "@/lib/preview";

/**
 * Lazily constructed.
 *
 * `new Resend(undefined)` THROWS ("Missing API key") at construction, and a
 * module-scope client turns that into a build failure: Next evaluates every
 * route module while collecting page data, so one unset variable fails
 * `next build` on a machine that was never going to send mail anyway. Deferring
 * construction to the first real send keeps the build honest and puts the error
 * where it belongs — at the call site, where `sendSafely` already handles it.
 */
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * From address must be on a Resend-verified domain. Until send.geekdom.com is
 * verified, onboarding@resend.dev works but only delivers to the account owner
 * — which looks exactly like "email is broken" if you forget.
 */
export const EMAIL_FROM =
  envOr(process.env.RESEND_FROM, "Geekdom <onboarding@resend.dev>");

export const EMAIL_REPLY_TO = env(process.env.RESEND_REPLY_TO);

/**
 * TEST SAFETY: every email goes to this one inbox instead, on any copy that
 * isn't geekdom.com. Set it on Vercel's Preview environment and in local
 * testing, so a reviewer approving a test application never emails a real
 * applicant — or club@ — from a preview. The real recipients ride along in
 * the subject. Ignored on the live domain, whatever it's set to.
 */
const redirectTo = () => (ON_LIVE_DOMAIN ? undefined : env(process.env.EMAIL_REDIRECT_TO));

/** The team: told when an application is ready for team review. */
export const TEAM_NOTIFY_TO = (
  envOr(process.env.TEAM_NOTIFY_EMAILS, "club@geekdom.com")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Who hears about a NEW application — the initial reviewer (Monica). Falls
 * back to the team list until APPLICATION_REVIEW_EMAILS is set.
 */
export const INITIAL_REVIEW_TO = (env(process.env.APPLICATION_REVIEW_EMAILS) ?? TEAM_NOTIFY_TO.join(","))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const list = (raw: string | undefined) =>
  (env(raw) ?? TEAM_NOTIFY_TO.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** Who hears about a new event request, and a new Studio partner inquiry. Both fall back to the team list. */
export const EVENTS_NOTIFY_TO = list(process.env.EVENTS_NOTIFY_EMAILS);
export const PARTNER_NOTIFY_TO = list(process.env.PARTNER_NOTIFY_EMAILS);

/**
 * Send, but never let a mail failure fail the request that triggered it.
 *
 * An application that saved to Firestore is a success even if the confirmation
 * bounces — the submitter should not see an error and re-submit, creating a
 * duplicate. Failures are logged for the server owner to notice.
 */
export async function sendSafely(payload: {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text alternative. Spam filters and some clients read it. */
  text?: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!hasEnv(process.env.RESEND_API_KEY)) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", payload.subject);
    return false;
  }

  try {
    const REDIRECT_TO = redirectTo();
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: REDIRECT_TO ?? payload.to,
      subject: REDIRECT_TO ? `[to ${[payload.to].flat().join(", ")}] ${payload.subject}` : payload.subject,
      html: payload.html,
      ...(payload.text ? { text: payload.text } : {}),
      replyTo: payload.replyTo ?? EMAIL_REPLY_TO,
    });

    if (error) {
      console.error("[email] resend rejected:", payload.subject, error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] send threw:", payload.subject, error);
    return false;
  }
}

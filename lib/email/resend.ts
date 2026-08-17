import "server-only";

import { Resend } from "resend";
import { env, envOr, hasEnv } from "@/lib/env";

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

/** Inboxes notified when a membership application lands. */
export const TEAM_NOTIFY_TO = (
  envOr(process.env.TEAM_NOTIFY_EMAILS, "members@geekdom.com")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

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
  replyTo?: string;
}): Promise<boolean> {
  if (!hasEnv(process.env.RESEND_API_KEY)) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", payload.subject);
    return false;
  }

  try {
    const { error } = await getResend().emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
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

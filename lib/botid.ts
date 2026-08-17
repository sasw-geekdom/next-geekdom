import { checkBotId } from "botid/server";

/**
 * `checkBotId()`, wrapped so that a failure of the bot check cannot take down
 * the form it is protecting.
 *
 * The raw call THROWS when it can't reach its verification backend — most
 * visibly outside the Vercel runtime, where it reports a missing
 * `x-vercel-oidc-token`. Unhandled in a route handler that means a 500, and
 * since the check runs before anything else, the endpoint fails identically for
 * a real applicant and a bot.
 *
 * THIS FAILS OPEN, deliberately, and the trade is worth stating plainly:
 *
 *   Fail closed — an infrastructure hiccup, or OIDC switched off in the Vercel
 *   project, turns every genuine application into "Access denied". Nobody finds
 *   out until a would-be member gives up and emails to complain. The entire
 *   membership funnel is this one form.
 *
 *   Fail open — a bot gets through during that same window. It still has to
 *   clear the honeypot, zod validation and the duplicate-submission guard, and
 *   staff read every application by hand anyway.
 *
 * A recoverable nuisance beats a silent outage on the only conversion path, so
 * the error is logged loudly and the request proceeds. A bot that is positively
 * IDENTIFIED is still rejected — this only softens the case where the check
 * could not run at all.
 */
export async function isBot(): Promise<boolean> {
  try {
    const { isBot } = await checkBotId();
    return isBot;
  } catch (error) {
    console.error(
      "[botid] verification unavailable — allowing the request through. " +
        "If this repeats in production, check that OIDC is enabled in the " +
        "Vercel project settings.",
      error,
    );
    return false;
  }
}

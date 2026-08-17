import { SITE_URL } from "@/lib/site";

/**
 * Preview mode: the site running with its narrative and design intact, and no
 * backend behind it.
 *
 * The point is review. Design and copy have to be approved before Firebase,
 * Stripe, Resend and Luma get wired up, and a reviewer can't judge what they
 * can't see — an empty calendar hides the event card entirely, and an apply
 * form that 500s hides the whole success path. Preview mode fills those in with
 * sample data and lets the forms complete, writing nothing anywhere.
 *
 * THE GATE IS THE DOMAIN, NOT THE ENVIRONMENT.
 *
 * This ships to next-geekdom.vercel.app, which is a *production* Vercel
 * deployment — `VERCEL_ENV` is "production" there. Gating on `VERCEL_ENV`
 * would switch preview mode off at precisely the URL that needs it. What
 * actually separates "under review" from "live" here is which domain is
 * answering, so that is what's checked: the moment geekdom.com is pointed at
 * this project and `NEXT_PUBLIC_SITE_URL` follows it, sample data stops being
 * served even if nobody remembers to clear the flag.
 *
 * Both conditions are required:
 *
 *   1. `NEXT_PUBLIC_PREVIEW_MODE=1` — explicit opt-in. Never a default, and
 *      never inferred from "services look unconfigured": a live deploy that
 *      loses its Stripe key must fail loudly, not quietly start inventing
 *      events and telling applicants they got in.
 *   2. Not serving the real domain. Checked independently of the flag, so it
 *      cannot be defeated by setting the variable.
 *
 * `NEXT_PUBLIC_PREVIEW_MODE` is read as a literal rather than through the
 * lib/env.ts helper because Next inlines public variables by matching that
 * exact text — see the note there.
 */

/** The live public domain. Anything serving this is not a preview. */
const LIVE_DOMAIN = "geekdom.com";

function isLiveDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === LIVE_DOMAIN || host.endsWith(`.${LIVE_DOMAIN}`);
  } catch {
    // An unparseable SITE_URL is a misconfiguration, not a licence to serve
    // sample data — fail toward the safer answer.
    return true;
  }
}

const OPTED_IN = process.env.NEXT_PUBLIC_PREVIEW_MODE === "1";

/** Whether to serve sample data and let forms complete without a backend. */
export const IS_PREVIEW = OPTED_IN && !isLiveDomain(SITE_URL);

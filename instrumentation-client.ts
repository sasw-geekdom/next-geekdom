import { initBotId } from "botid/client/core";

/**
 * Invisible CAPTCHA on the public write endpoints.
 *
 * Every path listed here must be matched by a `checkBotId()` call in the
 * corresponding route handler — this half only arms the client-side signal
 * collection; it blocks nothing on its own. A path added here without the
 * server check gives the appearance of protection and none of it.
 *
 * AND THE REVERSE IS WORSE: a route that calls `isBot()` but ISN'T listed
 * here never gets the client's signal, so in production every real visitor
 * is classified a bot. That shipped once: `/api/auth/email-link` checked and
 * wasn't listed, and since a bot is answered "sent" without sending, every
 * member and staff sign-in link silently never left — "Check your inbox",
 * and nothing in it. Locally `checkBotId()` can't reach its backend and
 * fails open, so it only ever broke in production. Callers today:
 * app/api/apply, app/api/billing/portal, app/api/auth/email-link.
 *
 * These are the endpoints an anonymous visitor can POST to. `/api/auth/session`
 * is deliberately absent: it's the staff login, already gated by a Firebase
 * credential, and running a bot check in front of it would add a failure mode
 * to the one flow that has to work when someone is locked out.
 */
initBotId({
  protect: [
    { path: "/api/apply", method: "POST" },
    { path: "/api/billing/portal", method: "POST" },
    { path: "/api/auth/email-link", method: "POST" },
  ],
});

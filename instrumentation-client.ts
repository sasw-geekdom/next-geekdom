import { initBotId } from "botid/client/core";

/**
 * Invisible CAPTCHA on the public write endpoints.
 *
 * Every path listed here must be matched by a `checkBotId()` call in the
 * corresponding route handler — this half only arms the client-side signal
 * collection; it blocks nothing on its own. A path added here without the
 * server check gives the appearance of protection and none of it.
 *
 * These are the two endpoints an anonymous visitor can POST to. `/api/auth/session`
 * is deliberately absent: it's the staff login, already gated by a Firebase
 * credential, and running a bot check in front of it would add a failure mode
 * to the one flow that has to work when someone is locked out.
 */
initBotId({
  protect: [
    { path: "/api/apply", method: "POST" },
    { path: "/api/billing/portal", method: "POST" },
  ],
});

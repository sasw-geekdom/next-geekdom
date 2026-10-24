import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Lightweight gate for the member portal and the admin behind it (/portal/*).
 *
 * This is a UX fast-path ONLY — it checks that a session cookie exists, not
 * that it is valid, unrevoked, or attached to an allowed account. The real
 * verification runs in app/portal/layout.tsx (and admin/layout.tsx under it)
 * and again inside every admin route handler and server action. Never treat
 * the proxy as the only gate: a forged cookie value walks straight past it.
 *
 * Note this is `proxy.ts`, not `middleware.ts` — Next 16 renamed the
 * convention. A file named middleware.ts here would silently never run.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = new URL("/sign-in", request.url);
    // `from` only when it says something: /portal is where sign-in lands
    // anyway, so the footer's "Member portal" link gets a clean /sign-in.
    // A deeper link (a bookmarked admin page) keeps it, so you land there.
    if (pathname !== "/portal" && pathname !== "/portal/") {
      url.searchParams.set("from", pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(url);
  }

  /*
    NO "ALREADY SIGNED IN? GO INSIDE" RULE HERE, and there must not be one.
    This once redirected the login page inside whenever a cookie EXISTED — but
    existing is all the proxy can see. An expired or revoked cookie passed
    here, failed real verification in the layout, got sent back to sign-in,
    and bounced straight back: an infinite redirect loop that the browser
    reports as a page that won't load, for exactly the people who had signed
    in before. /sign-in now makes that call itself, after verifying the
    session (app/sign-in/page.tsx). The sign-in page is outside the matcher.
  */

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};

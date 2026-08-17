import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Lightweight gate for /admin/*.
 *
 * This is a UX fast-path ONLY — it checks that a session cookie exists, not
 * that it is valid, unrevoked, or attached to an allowed account. The real
 * verification runs in app/admin/(protected)/layout.tsx and again inside every
 * admin route handler and server action. Never treat the proxy as the only
 * gate: a forged cookie value walks straight past it.
 *
 * Note this is `proxy.ts`, not `middleware.ts` — Next 16 renamed the
 * convention. A file named middleware.ts here would silently never run.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLogin = pathname === "/admin/login";
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession && !isLogin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in and hitting the login page — send them inside.
  if (hasSession && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

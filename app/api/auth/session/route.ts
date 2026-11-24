import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";
import { WELCOME_EVERY_SIGN_IN, WELCOME_SEEN_COOKIE } from "@/lib/onboarding";
import { termsCurrent } from "@/lib/terms";
import { getMemberByEmail } from "@/lib/admin/queries";

/** Exchange a Firebase ID token for an httpOnly, server-verified session cookie. */
export async function POST(request: Request) {
  let idToken: string | undefined;
  try {
    ({ idToken } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!idToken) {
    return NextResponse.json({ error: "Missing idToken." }, { status: 400 });
  }

  let result;
  try {
    result = await createSession(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token." }, { status: 401 });
  }

  // Token verified, but the account is neither staff nor a current member.
  // Neutral on purpose: it doesn't say which of the two it checked.
  if (!result) {
    return NextResponse.json(
      {
        error:
          "This account doesn't have access. Use the email your membership is under.",
      },
      { status: 403 },
    );
  }

  const store = await cookies();
  // THE WELCOME GATE (proxy.ts): until launch everyone walks through it at
  // every sign-in (WELCOME_EVERY_SIGN_IN); after, only a member who hasn't
  // finished it — everyone else is marked done here, for the session.
  const member = WELCOME_EVERY_SIGN_IN ? null : await getMemberByEmail(result.user.email).catch(() => null);
  // …or hasn't agreed to the CURRENT terms (lib/terms.ts) — agreeing sits on the welcome flow's first step.
  if (WELCOME_EVERY_SIGN_IN || (member && (!member.onboarding.welcomedAt || !termsCurrent(member.terms)))) store.delete(WELCOME_SEEN_COOKIE);
  else store.set(WELCOME_SEEN_COOKIE, "1", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: result.maxAge });
  store.set(SESSION_COOKIE, result.cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: result.maxAge,
  });

  return NextResponse.json({ user: result.user });
}

/** Sign out — clear the session cookie. */
export async function DELETE() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

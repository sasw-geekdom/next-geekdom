import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE } from "@/lib/auth/session";

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

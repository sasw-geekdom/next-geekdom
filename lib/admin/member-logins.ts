import "server-only";

import { getAdminAuth } from "@/lib/firebase/admin";

/*
  A MEMBER'S PORTAL LOGIN — the Firebase Auth account behind their email.

  Borrowed from next-angels (lib/members/provision.ts): the roster shows,
  per person, whether a login exists and whether they've ever used it, which
  answers "has this person actually got in?" without opening Firebase.

  Unlike next-angels there's no password to issue: members sign in by email
  link, so creating the account is the whole job. No email is sent from here.
  Sending a sign-in link from the admin waits on Resend (send.geekdom.com).
*/

export type LoginState =
  | { state: "none" }
  | { state: "invited" } // the account exists, never signed in
  | { state: "active"; lastSignIn: string };

/**
 * Every login, by email, in ONE paged listing rather than a lookup per
 * member — next-angels calls getUserByEmail per contact, which is fine for
 * 85 and a lot of round trips for 400.
 */
export async function loginStates(): Promise<Map<string, LoginState>> {
  const out = new Map<string, LoginState>();
  let pageToken: string | undefined;
  do {
    const page = await getAdminAuth().listUsers(1000, pageToken);
    for (const u of page.users) {
      if (!u.email) continue;
      const last = u.metadata.lastSignInTime;
      out.set(
        u.email.toLowerCase(),
        last ? { state: "active", lastSignIn: new Date(last).toISOString() } : { state: "invited" },
      );
    }
    pageToken = page.pageToken;
  } while (pageToken);
  return out;
}

/**
 * Make sure `email` has a login. When `previousEmail` differs (staff fixed a
 * typo), the existing account is moved to the new address instead of a
 * second one being made, so the person keeps one account.
 */
export async function ensureLogin(
  email: string,
  name: string,
  previousEmail?: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = getAdminAuth();
  try {
    const current = await auth.getUserByEmail(email).catch(() => null);
    if (current) return { ok: true };

    if (previousEmail && previousEmail !== email) {
      const old = await auth.getUserByEmail(previousEmail).catch(() => null);
      if (old) {
        await auth.updateUser(old.uid, { email, emailVerified: false });
        return { ok: true };
      }
    }

    await auth.createUser({ email, displayName: name, emailVerified: false });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Firebase refused the account." };
  }
}

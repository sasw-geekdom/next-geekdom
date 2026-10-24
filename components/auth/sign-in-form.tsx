"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isSignInWithEmailLink,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LINK, MONO } from "@/components/site/section";
import { CONTACT_EMAIL } from "@/lib/site";

/*
  ONE DOOR FOR MEMBERS AND STAFF.

  Members sign in by EMAIL LINK — no password to forget, and owning the inbox
  is the proof, which is how /account already worked. Staff keep Google and
  email/password. Which portal you land in is decided on the server from the
  account (lib/auth/session.ts), never by which button was pressed.

  The link round-trip, per Firebase's email-link guide:
    1. POST /api/auth/email-link. The SERVER makes the link (Admin SDK) and
       sends it through Resend in Geekdom's brand — Firebase's own email
       can't be reworded. The server only sends to staff and current
       members, and answers the same either way.
    2. The address is remembered in localStorage so the same device can finish
       without asking again. It is never put in the link's URL — that enables
       session injection.
    3. Back on this page, `isSignInWithEmailLink` spots the link; a link opened
       on another device asks for the address first, which must match.

  The sign-in only completes when this page's script runs, so a mail scanner
  that merely fetches the link can't spend it.

  NO GEEKDOM RED. It is reserved for the logo and Apply; the main action here
  is Graphite (`ink`). Errors are the one exception the brand allows.
*/

const EMAIL_KEY = "geekdom.emailForSignIn";

/** localStorage can throw (private mode, blocked storage) — never let it. */
function remember(email: string | null) {
  try {
    if (email) localStorage.setItem(EMAIL_KEY, email);
    else localStorage.removeItem(EMAIL_KEY);
  } catch {}
}
function recall(): string | null {
  try {
    return localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

/** Firebase's error codes, in the words a member needs. */
function explain(e: unknown, fallback: string): string {
  const code = (e as { code?: string })?.code ?? "";
  if (code === "auth/admin-restricted-operation" || code === "auth/user-not-found")
    return "That email doesn't have access yet. Use the email your membership is under.";
  if (code === "auth/invalid-action-code" || code === "auth/expired-action-code")
    return "That sign-in link has expired or was already used. Send yourself a new one.";
  if (code === "auth/invalid-email") return "That doesn't look like an email address.";
  if (code === "auth/popup-closed-by-user") return "Google sign-in was closed before it finished.";
  return e instanceof Error && !code ? e.message : fallback;
}

type Pending = "link" | "google" | "password" | "finishing" | null;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();

  /**
   * Where to land after sign-in. Only relative, single-slash paths are
   * honored — `?from=https://evil.example` is an open redirect otherwise.
   */
  const raw = params.get("from") ?? "/portal";
  const from = /^\/(?!\/)/.test(raw) ? raw : "/portal";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sentTo, setSentTo] = React.useState<string | null>(null);
  /** The address we found no membership under — shown instead of "Check your inbox". */
  const [notFound, setNotFound] = React.useState<string | null>(null);
  /** Found, but paused or canceled — a different message from a stranger's. */
  const [inactive, setInactive] = React.useState(false);
  const [pending, setPending] = React.useState<Pending>(null);
  /** Opened a sign-in link on a device that didn't request it. */
  const [confirmEmail, setConfirmEmail] = React.useState(false);

  // Trade the Firebase credential for a server-verified session cookie.
  const establishSession = React.useCallback(
    async (cred: UserCredential) => {
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        // Server rejected the account — drop the client-side session too, or
        // the user stays "signed in" to Firebase with no access here.
        await getFirebaseAuth().signOut();
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Sign-in failed.");
      }

      router.replace(from);
      router.refresh();
    },
    [from, router],
  );

  const finishLink = React.useCallback(
    async (address: string) => {
      setError(null);
      setPending("finishing");
      try {
        const cred = await signInWithEmailLink(
          getFirebaseAuth(),
          address,
          window.location.href,
        );
        remember(null);
        await establishSession(cred);
      } catch (e) {
        setError(explain(e, "Couldn't finish signing in."));
        setPending(null);
      }
    },
    [establishSession],
  );

  // Arriving from a sign-in link: finish it, or ask which address it was for.
  React.useEffect(() => {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      return; // no Firebase config in this environment
    }
    if (!isSignInWithEmailLink(auth, window.location.href)) return;
    const saved = recall();
    // Scheduled rather than called inline: the effect only kicks off the
    // async sign-in, and state updates land when it settles.
    const t = setTimeout(() => {
      if (saved) void finishLink(saved);
      else setConfirmEmail(true);
    }, 0);
    return () => clearTimeout(t);
  }, [finishLink]);

  async function onSendLink(e: React.FormEvent) {
    e.preventDefault();
    if (confirmEmail) return void finishLink(email.trim());

    setError(null);
    setNotFound(null);
    setPending("link");
    const address = email.trim();
    try {
      const res = await fetch("/api/auth/email-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, from }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error ?? "Couldn't send the link. Try again in a minute.");
      }
      if (body.reason === "no-membership" || body.reason === "inactive") {
        setNotFound(address);
        setInactive(body.reason === "inactive");
      } else {
        remember(address);
        setSentTo(address);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link. Try again in a minute.");
    }
    setPending(null);
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    try {
      await establishSession(await signInWithPopup(getFirebaseAuth(), getGoogleProvider()));
    } catch (e) {
      setError(explain(e, "Sign-in failed."));
      setPending(null);
    }
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("password");

    // Two steps, two failure meanings: a bad password is step 1; a server or
    // config problem is step 2, and calling that "wrong password" sends
    // people in circles.
    let cred: UserCredential;
    try {
      cred = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch {
      setError("Wrong email or password.");
      setPending(null);
      return;
    }
    try {
      await establishSession(cred);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start your session.");
      setPending(null);
    }
  }

  const busy = pending !== null;

  if (pending === "finishing") {
    return (
      <p role="status" className="text-base text-muted-foreground">
        Signing you in…
      </p>
    );
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="text-lg text-graphite">Check your inbox.</p>
        <p className="leading-relaxed text-muted-foreground">
          We sent a sign-in link to <span className="text-graphite">{sentTo}</span>.
          Open it on this device and you&rsquo;re in. It works once, for about an
          hour.
        </p>
        <button
          type="button"
          onClick={() => setSentTo(null)}
          className={`self-start text-sm ${LINK}`}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={showPassword ? onPassword : onSendLink} className="flex flex-col gap-3">
        {confirmEmail && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            You opened this link on a different device. Confirm the email it was
            sent to.
          </p>
        )}
        <label htmlFor="sign-in-email" className="sr-only">
          Email
        </label>
        <Input
          id="sign-in-email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setNotFound(null);
          }}
          required
        />
        {showPassword && (
          <>
            <label htmlFor="sign-in-password" className="sr-only">
              Password
            </label>
            <Input
              id="sign-in-password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </>
        )}
        <Button type="submit" variant="ink" size="lg" disabled={busy} className="w-full">
          {showPassword
            ? pending === "password"
              ? "Signing in…"
              : "Sign in"
            : confirmEmail
              ? "Finish signing in"
              : pending === "link"
                ? "Sending…"
                : "Email me a sign-in link"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-geekdom-red">
          {error}
        </p>
      )}

      {/*
        NO MEMBERSHIP UNDER THAT EMAIL — said plainly, before anything that
        looks like progress. Not Geekdom Red: nothing is wrong with what they
        typed, it just isn't on the list. A Clay rule marks it; the words
        stay Graphite (Clay can't carry small text). Most people who land
        here are members who typed a second address, so that comes first.
      */}
      {notFound && inactive && (
        <div role="alert" className="flex flex-col gap-2 border-l-2 border-clay pl-4 text-sm leading-relaxed">
          <p className="text-graphite">
            The membership under <span className="font-medium">{notFound}</span>{" "}
            isn&rsquo;t active right now.
          </p>
          <p className="text-muted-foreground">
            To pick it back up, write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </div>
      )}
      {notFound && !inactive && (
        <div role="alert" className="flex flex-col gap-2 border-l-2 border-clay pl-4 text-sm leading-relaxed">
          <p className="text-graphite">
            We don&rsquo;t have a current membership under{" "}
            <span className="font-medium">{notFound}</span>.
          </p>
          <p className="text-muted-foreground">
            Try the email you applied with. If it should work, write to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
              {CONTACT_EMAIL}
            </a>
            . Not a member yet?{" "}
            <Link href="/apply" className={LINK}>
              Apply to Geekdom
            </Link>
            .
          </p>
        </div>
      )}

      {/*
        GEEKDOM STAFF, set apart. Members have one path — the email link,
        which also creates their account on first use. Google is offered to
        staff only: a member who chose it before they had an account got
        "doesn't have access", which read as a rejection. Labeled, so
        members don't wonder whether it's meant for them.
      */}
      {!confirmEmail && (
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <p className={`${MONO.label} text-muted-foreground`}>Geekdom staff</p>
          <Button
            type="button"
            variant="outline"
            onClick={onGoogle}
            disabled={busy}
            className="w-full"
          >
            {pending === "google" ? "Connecting…" : "Continue with Google"}
          </Button>
          <p className="text-xs text-muted-foreground">Use your geekdom.com Google account.</p>
          <button
            type="button"
            onClick={() => {
              setShowPassword((v) => !v);
              setError(null);
            }}
            className={`mt-1 self-start text-sm ${LINK}`}
          >
            {showPassword ? "Use a sign-in link instead" : "Sign in with a password"}
          </button>
        </div>
      )}
    </div>
  );
}

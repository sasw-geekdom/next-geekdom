"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LINK } from "@/components/site/section";

/*
  ONE DOOR FOR MEMBERS AND STAFF.

  Members sign in by EMAIL LINK — no password to forget, and owning the inbox
  is the proof, which is how /account already worked. Staff keep Google and
  email/password. Which portal you land in is decided on the server from the
  account (lib/auth/session.ts), never by which button was pressed.

  The link round-trip, per Firebase's email-link guide:
    1. `sendSignInLinkToEmail` with `handleCodeInApp: true`, returning here.
    2. The address is remembered in localStorage so the same device can finish
       without asking again. It is never put in the link's URL — that enables
       session injection.
    3. Back on this page, `isSignInWithEmailLink` spots the link; a link opened
       on another device asks for the address first, which must match.

  The sign-in only completes when this page's script runs, so a mail scanner
  that merely fetches the link can't spend it.

  NO GEEKDOM RED. It is reserved for the logo and Apply; the main action here
  is Graphite (`ink`).
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
    setPending("link");
    const address = email.trim();
    try {
      const back = new URL("/sign-in", window.location.origin);
      if (from !== "/portal") back.searchParams.set("from", from);
      await sendSignInLinkToEmail(getFirebaseAuth(), address, {
        url: back.toString(),
        handleCodeInApp: true,
      });
      remember(address);
      setSentTo(address);
    } catch (err) {
      setError(explain(err, "Couldn't send the link. Try again in a minute."));
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
          onChange={(e) => setEmail(e.target.value)}
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

      {!confirmEmail && (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              or
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onGoogle}
            disabled={busy}
            className="w-full"
          >
            {pending === "google" ? "Connecting…" : "Continue with Google"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setShowPassword((v) => !v);
              setError(null);
            }}
            className={`self-start text-sm ${LINK}`}
          >
            {showPassword ? "Use a sign-in link instead" : "Sign in with a password"}
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-geekdom-red">
          {error}
        </p>
      )}
    </div>
  );
}

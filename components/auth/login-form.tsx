"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  /**
   * Where to land after sign-in.
   *
   * Only relative, single-slash paths are honoured. `?from=https://evil.example`
   * is a working open redirect otherwise — the proxy puts this parameter in the
   * URL, but anyone can hand out a link with their own value.
   */
  const raw = params.get("from") ?? "/admin";
  const from = /^\/(?!\/)/.test(raw) ? raw : "/admin";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"google" | "password" | null>(
    null,
  );

  // Trade the Firebase credential for a server-verified session cookie.
  async function establishSession(cred: UserCredential) {
    const idToken = await cred.user.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      // Server rejected the account — drop the client-side session too, or the
      // user stays "signed in" to Firebase while having no access here.
      await getFirebaseAuth().signOut();
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Sign-in failed.");
    }

    router.replace(from);
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setPending("google");
    try {
      await establishSession(await signInWithPopup(getFirebaseAuth(), getGoogleProvider()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setPending(null);
    }
  }

  async function onPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending("password");

    // Two steps, two different failure meanings. A failure in step 1 is a real
    // bad password; a failure in step 2 is a server or config problem, and
    // telling someone "wrong password" for that sends them in circles.
    let cred: UserCredential;
    try {
      cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
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

  return (
    <div className="flex flex-col gap-6">
      <Button
        onClick={onGoogle}
        disabled={pending !== null}
        size="lg"
        className="w-full"
      >
        {pending === "google" ? "Connecting…" : "Continue with Google"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onPassword} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button
          type="submit"
          variant="outline"
          disabled={pending !== null}
          className="w-full"
        >
          {pending === "password" ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-sm text-rust">
          {error}
        </p>
      )}
    </div>
  );
}

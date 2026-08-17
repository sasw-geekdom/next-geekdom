"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

/**
 * Requests a Stripe billing portal link by email.
 *
 * The success state is intentionally identical whether or not the address has
 * a membership — the endpoint answers the same way, and the UI must not undo
 * that by rendering a different message. See app/api/billing/portal/route.ts.
 */
export function BillingForm() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const email = new FormData(event.currentTarget).get("email");

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Something went wrong. Try again.");
        setPending(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Couldn't reach the server. Check your connection.");
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-white p-7"
      >
        <h2 className="text-xl font-semibold text-ink">Check your inbox.</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          If that email has a Geekdom membership, a secure billing link is on
          its way. It expires shortly, so use it while it&rsquo;s fresh.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field
        label="The email on your membership"
        htmlFor="email"
        hint="We'll send a secure link — no password to remember."
        required
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby="email-hint"
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-rust">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Email me a billing link"}
      </Button>
    </form>
  );
}

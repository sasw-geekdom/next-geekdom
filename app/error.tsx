"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/site/section";

/**
 * Root error boundary.
 *
 * Must be a client component — Next requires it, because `reset` is a callback.
 * The error's message is logged but never rendered: a Firestore or Stripe
 * failure can carry connection details, and this page is public.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center bg-sand px-6 py-28">
      <div className="mx-auto w-full max-w-xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
          Something broke
        </p>
        <PageTitle className="mt-4">
          That didn&rsquo;t work.
        </PageTitle>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Something on our end failed. Try again — and if it keeps happening,
          let us know at{" "}
          <a href="mailto:members@geekdom.com" className="text-rust underline">
            members@geekdom.com
          </a>
          .
        </p>
        {/* The digest is safe to show and is what makes a report traceable. */}
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <Button onClick={reset} size="lg" className="mt-9">
          Try again
        </Button>
      </div>
    </main>
  );
}

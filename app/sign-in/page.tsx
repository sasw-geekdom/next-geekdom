import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser, PORTAL_PATH } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Logo } from "@/components/site/logo";
import { ARROW, HEADING, LINK_ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

// Noindex (it's a door, not a page to rank), but it unfurls: its own card
// (opengraph-image.png beside this file, from OG_CARDS.portal) and words.
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to the Geekdom member portal with the email your membership is under.",
  openGraph: {
    title: "Geekdom member portal",
    description: "Sign in with the email your membership is under — we'll send you a link.",
  },
  robots: { index: false, follow: false },
};

/*
  THE DOOR TO THE MEMBER PORTAL — and it looks like the portal.

  It was the public site's CrownPage: a giant red crown (the guide bans the
  crown as decoration, and it was the largest block of Geekdom Red anywhere
  in the portal), a Clay "Geekdom." in the heading, and "Back to site" at
  the bottom, under the form. Now:

    · the portal's top bar — wordmark · rule · "Member portal", and
      "← Back to geekdom.com" where people look for it, top right;
    · one square tile, centered, in the portal's type: eyebrow, "Sign in.",
      the email link for everyone, and a labeled "Geekdom staff" section
      (Google, password) underneath — see components/auth/sign-in-form.tsx.

  One sign-in for members and staff; the account decides where it lands.

  A VERIFIED SESSION SKIPS THE FORM; A STALE ONE SEES IT. This check used to
  live in proxy.ts, which can only see that a cookie exists — so an expired
  cookie bounced between the door and the inside forever. `getSessionUser()`
  verifies it (and returns null rather than throwing when it can't), so only a
  real session is sent inside. Signing in again overwrites the stale cookie.
*/
export default async function SignInPage() {
  if (await getSessionUser()) redirect(PORTAL_PATH);

  return (
    <div className="flex min-h-screen flex-col bg-bone">
      <header className="border-b border-border bg-bone">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
          <Link href="/" aria-label="Geekdom home" className="flex shrink-0 items-center gap-3">
            <Logo title="" className="h-8 w-auto" />
            {/* The tile below says "Member portal" too; on a phone the bar
                drops the label so the way back fits beside the wordmark. */}
            <span aria-hidden="true" className="hidden h-5 w-px bg-border sm:block" />
            <span className={cn(MONO.label, "hidden text-muted-foreground sm:inline")}>Member portal</span>
          </Link>
          {/* ← not ↗: it stays on this site (the arrow rule in section.tsx). */}
          <Link href="/" className={cn("text-sm", LINK_ARROW)}>
            <ArrowLeft aria-hidden="true" className={ARROW.back} />
            <span className="hidden sm:inline">Back to geekdom.com</span>
            <span className="sm:hidden">geekdom.com</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-6 py-12 sm:items-center sm:py-16">
        <section className="w-full max-w-md border border-border bg-bone-light p-7 sm:p-9">
          <p className={cn(MONO.eyebrow, "text-muted-foreground")}>Member portal</p>
          <h1 className={cn("mt-3 text-graphite", HEADING.heading)}>Sign in.</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Use the email your membership is under. We&rsquo;ll send you a link — no password needed.
          </p>
          <div className="mt-8">
            {/*
              SignInForm reads `from` via useSearchParams, which forces the
              route into client rendering unless it sits behind Suspense —
              without this the build fails prerendering the page.
            */}
            <Suspense fallback={null}>
              <SignInForm />
            </Suspense>
          </div>
        </section>
      </main>

      <footer className="px-6 pb-8 text-center text-sm text-muted-foreground">
        Not a member yet?{" "}
        <Link href="/apply" className="text-graphite underline decoration-clay decoration-2 underline-offset-2">
          Apply to Geekdom
        </Link>
      </footer>
    </div>
  );
}

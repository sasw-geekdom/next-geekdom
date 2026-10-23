import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSessionUser, PORTAL_PATH } from "@/lib/auth/session";
import { SignInForm } from "@/components/auth/sign-in-form";
import { CrownPage } from "@/components/site/crown-page";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/*
  ONE SIGN-IN FOR MEMBERS AND STAFF. It replaced /admin/login (which 308s
  here). The account decides where you land — members in the portal, staff in
  the portal with the Admin switch — so the page doesn't ask which you are.

  A VERIFIED SESSION SKIPS THE FORM; A STALE ONE SEES IT. This check used to
  live in proxy.ts, which can only see that a cookie exists — so an expired
  cookie bounced between the door and the inside forever. `getSessionUser()`
  verifies it (and returns null rather than throwing when it can't), so only a
  real session is sent inside. Signing in again overwrites the stale cookie.
*/
export default async function SignInPage() {
  if (await getSessionUser()) redirect(PORTAL_PATH);

  return (
    <main className="flex-1 bg-bone">
      {/*
        navOffset 0 — this route renders outside the (site) group, with no
        navbar above it, so the crown rail takes the whole viewport.
      */}
      <CrownPage
        shape="crown"
        navOffset="0rem"
        eyebrow="Members and staff"
        title={
          <>
            Sign in to <span className="text-clay">Geekdom.</span>
          </>
        }
        subtitle="Use the email your membership is under. We'll send you a link — no password needed."
      >
        <div className="max-w-sm">
          {/*
            SignInForm reads `from` via useSearchParams, which forces the
            route into client rendering unless it sits behind Suspense —
            without this the build fails prerendering the page.
          */}
          <Suspense fallback={null}>
            <SignInForm />
          </Suspense>

          <Link
            href="/"
            className="mt-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-graphite"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
            Back to site
          </Link>
        </div>
      </CrownPage>
    </main>
  );
}

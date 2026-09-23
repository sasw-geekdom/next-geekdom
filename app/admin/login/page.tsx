import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { CrownPage } from "@/components/site/crown-page";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/*
  A VERIFIED SESSION SKIPS THE FORM; A STALE ONE SEES IT. This check used to
  live in proxy.ts, which can only see that a cookie exists — so an expired
  cookie bounced between here and /admin forever. `getSessionUser()` verifies
  it (and returns null rather than throwing when it can't), so only a real
  session is sent inside. Signing in again overwrites the stale cookie.
*/
export default async function LoginPage() {
  if (await getSessionUser()) redirect("/admin");

  return (
    <main className="flex-1 bg-bone">
      {/*
        navOffset 0 — the admin routes render outside the (site) group and have
        no navbar above them, so the crown rail takes the whole viewport rather
        than leaving a 4rem gap for a header that isn't there.
      */}
      <CrownPage
        shape="crown"
        navOffset="0rem"
        eyebrow="Staff portal"
        title={
          <>
            Sign in to <span className="text-clay">Geekdom.</span>
          </>
        }
        subtitle="Geekdom staff only. Use your workspace account."
      >
        <div className="max-w-sm">
          {/*
            LoginForm reads `from` via useSearchParams, which forces the whole
            route into client-side rendering unless it sits behind a Suspense
            boundary. Without this the build fails prerendering this page.
          */}
          <Suspense fallback={null}>
            <LoginForm />
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

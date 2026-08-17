import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { CrownPage } from "@/components/site/crown-page";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex-1 bg-sand">
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
            Sign in to <span className="text-rust">Geekdom.</span>
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
            className="mt-10 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
            Back to site
          </Link>
        </div>
      </CrownPage>
    </main>
  );
}

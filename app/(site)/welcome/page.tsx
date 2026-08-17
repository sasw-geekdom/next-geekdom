import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/site/section";
import { LOCATION, LUMA_CALENDAR_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Welcome",
  robots: { index: false, follow: false },
};

/**
 * Post-checkout landing page.
 *
 * Reads nothing and writes nothing. The roster is written by the Stripe
 * webhook, which is the only place that knows the payment actually cleared —
 * this page is reachable by anyone who guesses the URL, so treating a visit
 * here as proof of membership would hand out memberships for free.
 *
 * The session_id in the query string is left alone for the same reason: it's
 * useful for support, not for authorization.
 */
export default function WelcomePage() {
  return (
    <section className="bg-sand py-28 sm:py-36">
      <Container className="max-w-2xl">
        <Eyebrow>Membership active</Eyebrow>
        <h1 className="mt-5 text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl">
          Welcome to Geekdom.
        </h1>
        <p className="mt-8 text-xl leading-relaxed text-ink/75">
          You&rsquo;re in. Come find us on the {LOCATION.floor.toLowerCase()} at{" "}
          {LOCATION.street} — drop-in workspace when you need to focus, a cafe
          for your coffee chats, and meeting rooms for the conversations that
          need a door.
        </p>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          A receipt is on its way to your inbox. The calendar is where the club
          actually happens — start there.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/events" size="lg">
            See what&rsquo;s on
          </ButtonLink>
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-13 items-center justify-center rounded-lg border border-ink/20 px-7 text-lg font-medium text-ink transition-colors hover:bg-sand-deep"
          >
            Subscribe on Luma
          </a>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Manage billing any time at{" "}
          <a href="/account" className="text-rust underline">
            your account
          </a>
          .
        </p>
      </Container>
    </section>
  );
}

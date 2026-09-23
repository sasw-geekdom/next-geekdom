import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import {
  ARROW,
  Container,
  Eyebrow,
  LINK_ARROW,
  PageTitle,
} from "@/components/site/section";
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
    <section className="bg-bone py-28 sm:py-36">
      <Container className="max-w-2xl">
        <Eyebrow>Membership active</Eyebrow>
        <PageTitle className="mt-5">
          Welcome to Geekdom.
        </PageTitle>
        <p className="mt-8 text-xl leading-relaxed text-graphite/75">
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
          {/* /events is gone; the calendar is Luma. A link, not a button —
              buttons on this site are for Apply. */}
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={LINK_ARROW}
          >
            See what&rsquo;s on
            <ArrowUpRight aria-hidden="true" className={ARROW.external} />
          </a>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Manage billing any time at{" "}
          <a href="/account" className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite">
            your account
          </a>
          .
        </p>
      </Container>
    </section>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  LegalPage,
  LegalSection,
  LegalList,
} from "@/components/site/legal-page";
import { CONTACT_EMAIL, LOCATION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  path: "/privacy",
  description:
    "What Geekdom collects when you apply or pay, who processes it, how long it is kept, and how to ask for it back or have it deleted.",
});

/**
 * The privacy policy.
 *
 * ⚠️ WRITTEN FROM THE CODE, NOT FROM A TEMPLATE, AND NOT YET REVIEWED BY
 * COUNSEL. Every claim below was checked against what this repo actually does —
 * the field list is `applicationSchema` in lib/validation/schemas.ts, the
 * processor list is the four SDKs in lib/, the cookie is `SESSION_COOKIE`, and
 * the "no analytics" claim was verified by grep (there is no GA, no Vercel
 * Analytics, no Plausible, no PostHog anywhere in the project). That makes it
 * accurate. It does not make it sufficient: it has no lawyer's eyes on it, it
 * names no retention periods that anyone has actually agreed to internally, and
 * Texas has no state privacy statute of the CCPA kind whose requirements this
 * was drafted against. GET IT REVIEWED BEFORE LAUNCH.
 *
 * THE CLAIMS HERE ARE LOAD-BEARING ON THE CODE. If a fifth SDK is added, an
 * analytics script is dropped in, or a field is added to the application form,
 * this page becomes false the moment that ships. Treat it the way
 * lib/membership.ts treats the Stripe price: display copy that nothing
 * enforces, so it has to be changed by hand in the same commit.
 */
const UPDATED = new Date(2026, 8, 20); // September 20, 2026

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="What we collect, and what we don’t."
      updated={UPDATED}
      intro={
        <>
          Short version: we collect what you type into the application form and
          what Stripe needs to bill you. We don&rsquo;t run analytics, we
          don&rsquo;t run advertising trackers, and we don&rsquo;t sell anything
          to anyone.
        </>
      }
    >
      <LegalSection heading="What we collect">
        <p>
          When you apply for membership, we collect what the form asks for: your
          name and email, and — if you choose to give them — your phone number,
          company, role, website, and LinkedIn. You also tell us which of our
          audiences you fit, what stage you&rsquo;re at, what you&rsquo;re
          building, what you need, whether anyone referred you, and whether you
          were a member before.
        </p>
        <p>
          Everything past your name and email is optional. Leaving a field blank
          does not disadvantage an application.
        </p>
        <p>
          If you become a member, Stripe collects and holds your payment details.
          We never see or store your card number — {SITE_NAME} receives only the
          subscription status, the billing period, and the email you paid with.
        </p>
      </LegalSection>

      <LegalSection heading="What we don’t collect">
        <p>
          There is no analytics on this site. No Google Analytics, no advertising
          pixels, no session recording, no third-party trackers of any kind. We
          do not build a profile of what you read here or how long you spent
          reading it.
        </p>
        <p>
          The only cookie this site sets is a sign-in cookie for Geekdom staff
          using the admin area. If you are not a member of Geekdom staff signing
          in, this site sets no cookies at all.
        </p>
      </LegalSection>

      <LegalSection heading="Who else processes it">
        <p>
          We use four services to run this, and each one sees only the part it
          needs:
        </p>
        <LegalList
          items={[
            <>
              <strong className="font-medium text-graphite">Google Firebase</strong> —
              stores applications and member records, and authenticates staff
              sign-in.
            </>,
            <>
              <strong className="font-medium text-graphite">Stripe</strong> — takes
              payment and runs the billing portal. Stripe is the only party that
              handles your card.
            </>,
            <>
              <strong className="font-medium text-graphite">Resend</strong> — sends
              the email we send you: the confirmation that your application
              arrived, and the decision.
            </>,
            <>
              <strong className="font-medium text-graphite">Vercel</strong> — hosts
              the site, and runs the bot check that sits in front of the
              application form.
            </>,
          ]}
        />
        <p>
          Our public event calendar is hosted by Luma. Event listings are fetched
          by our servers, not by your browser, so browsing this site does not
          report anything to Luma. Clicking through to register for an event does
          — at that point you are on Luma&rsquo;s site under Luma&rsquo;s policy.
        </p>
        <p>
          We do not sell personal information, and we do not share it with anyone
          beyond the services above.
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Applications are kept while we review them and for as long as the
          decision is useful to us — a declined application tells us we&rsquo;ve
          already spoken, and a waitlisted one is the list. If you&rsquo;d rather
          we didn&rsquo;t keep yours, say so and we&rsquo;ll delete it.
        </p>
        <p>
          Member records are kept for the length of the membership and afterwards
          for as long as we need them for accounting, which is generally seven
          years for anything with a payment attached to it.
        </p>
      </LegalSection>

      <LegalSection heading="Asking for it back, or asking us to delete it">
        <p>
          Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and ask.
          We&rsquo;ll send you everything we hold about you, correct anything
          that&rsquo;s wrong, or delete it. A person answers — there is no form
          for this.
        </p>
        <p>
          Deleting a member record while a subscription is live will cancel the
          subscription, because the record is what the subscription is attached
          to. We&rsquo;ll tell you that before we do it rather than after.
        </p>
      </LegalSection>

      <LegalSection heading="Photography">
        <p>
          We photograph events on the third floor, and those photographs appear
          on this site and on our social channels. If you are in one and would
          rather not be, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we&rsquo;ll
          take it down.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this changes materially — a new processor, a new category of data —
          we&rsquo;ll change the date at the top and tell members by email. We
          won&rsquo;t quietly broaden it.
        </p>
      </LegalSection>

      <LegalSection heading="Reaching us">
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <br />
          {SITE_NAME}, {LOCATION.line1}
          <br />
          {LOCATION.full}
        </p>
      </LegalSection>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  LegalPage,
  LegalSection,
  LegalList,
} from "@/components/site/legal-page";
import { CONTACT_EMAIL, LOCATION, SITE_NAME } from "@/lib/site";
import { NOT_INCLUDED, priceLabel } from "@/lib/membership";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  path: "/terms",
  description:
    "The terms of Geekdom membership: what it costs, what it includes, how billing and cancellation work, and what we ask of each other on the third floor.",
});

/**
 * Terms of membership.
 *
 * ⚠️ NOT REVIEWED BY COUNSEL. Same caveat as the privacy policy, and a sharper
 * one: this page describes what Geekdom will and won't do about someone's
 * money, and the behavior clause describes grounds on which a membership can
 * be ended. Both are the kind of commitment a lawyer should see before it is
 * public. GET IT REVIEWED BEFORE LAUNCH.
 *
 * The price and the exclusions read from lib/membership.ts rather than being
 * typed here, for the reason AGENTS.md gives: a dollar figure written into copy
 * drifts from Stripe silently, and a terms page is the worst possible place for
 * that to happen.
 *
 * DELIBERATELY SHORT, and in the site's own voice rather than in legalese. The
 * brand guide's rule is short declaratives and no corporate-speak, and it does
 * not carve out an exception for this page. A membership agreement nobody reads
 * protects nobody; the enforceable version can be the document a member signs,
 * and this can be the one they actually understand.
 */
const UPDATED = new Date(2026, 8, 20); // September 20, 2026

export default function TermsPage() {
  const price = priceLabel();

  return (
    <LegalPage
      eyebrow="Terms"
      title="What membership commits us both to."
      updated={UPDATED}
      intro={
        <>
          These cover what you get for the fee, how billing works, and what we
          ask of each other on the third floor. They apply from the moment a
          membership starts.
        </>
      }
    >
      <LegalSection heading="Applying">
        <p>
          Membership is by application. A person on the Geekdom team reads every
          one and answers either way, generally within two weeks. We can decline
          an application without giving a reason, and a declined application
          isn&rsquo;t a permanent verdict — circumstances change, and you can
          apply again.
        </p>
        <p>
          Nothing is charged while an application is under review. You are asked
          for payment only after you&rsquo;re accepted.
        </p>
      </LegalSection>

      <LegalSection heading="What it costs">
        <p>
          {price ? (
            <>Membership is {price}, billed monthly in advance.</>
          ) : (
            <>Membership is billed monthly in advance.</>
          )}{" "}
          There is one membership. There are no tiers.
        </p>
        <p>
          If the price changes, we&rsquo;ll tell existing members at least 30
          days before it takes effect, and you can cancel in that window without
          paying the new rate.
        </p>
        <p>
          Parking passes and validations are real and cost extra. They are the
          only thing on the floor that does.
        </p>
      </LegalSection>

      <LegalSection heading="Billing and cancelling">
        <p>
          Payment runs through Stripe. Your membership renews each month until
          you cancel it.
        </p>
        <p>
          You can cancel any time from the billing portal — there is no notice
          period, no cancellation fee, and nobody to talk out of it. Cancelling
          ends the membership at the end of the period you&rsquo;ve already paid
          for; you keep access until then.
        </p>
        <p>
          We don&rsquo;t pro-rate refunds for a partial month. If something has
          gone wrong enough that you think you&rsquo;re owed one, email us and
          we&rsquo;ll sort it out.
        </p>
        <p>
          If a payment fails, Stripe retries it and we&rsquo;ll email you. If it
          keeps failing, the membership lapses rather than accruing a debt.
        </p>
      </LegalSection>

      <LegalSection heading="What membership is, and isn’t">
        <p>
          Membership is access to the third floor and to what happens on it —
          the room, the programming, the cafe, drop-in workspace, reservable
          meeting rooms, and the member directory. It is a license to use the
          space alongside other members, for as long as you&rsquo;re a member.
        </p>
        <p>It is not a tenancy, and it does not include:</p>
        <LegalList items={NOT_INCLUDED} />
        <p>
          You have no assigned seat and no right to a particular room. Meeting
          rooms are reservable, not reserved. Nothing has your name taped to it.
        </p>
      </LegalSection>

      <LegalSection heading="Guests">
        <p>
          Bring people. Guests are complimentary for as long as you&rsquo;re
          there with them, and they are your responsibility while they&rsquo;re
          in the building. A guest is a guest, not a shared membership — if
          someone is using the floor as their own workspace without one,
          we&rsquo;ll ask them to apply.
        </p>
      </LegalSection>

      <LegalSection heading="What we ask of each other">
        <p>
          The bar isn&rsquo;t impressiveness. It&rsquo;s generosity. The floor
          works because people help the person next to them, and everything
          below follows from that.
        </p>
        <LegalList
          items={[
            "Treat other members, their guests, and Geekdom staff with respect.",
            "What a member tells you about their company in confidence stays with you.",
            "The room is not a lead list. Don’t work it, and don’t sell into it.",
            "Look after the space and the people in it.",
          ]}
        />
        <p>
          We can end a membership for behavior that makes the room worse —
          harassment, threats, or persistently treating other members as
          prospects. We&rsquo;ll refund the unused part of the period if we do.
          This is the one thing we won&rsquo;t be slow about.
        </p>
      </LegalSection>

      <LegalSection heading="Your work is yours">
        <p>
          Nothing about being a member gives {SITE_NAME} any claim on what you
          build, your intellectual property, or your company. Membership is not
          an investment and does not entitle either of us to anything in the
          other.
        </p>
        <p>
          If Geekdom ever does invest in your company, that is a separate
          agreement, separately negotiated and separately signed. It has nothing
          to do with this page.
        </p>
      </LegalSection>

      <LegalSection heading="Photography on the floor">
        <p>
          We photograph events here and use the photographs on this site and on
          our channels. If you&rsquo;re in one and would rather not be, tell us
          and we&rsquo;ll take it down. See our{" "}
          <a href="/privacy">privacy policy</a>.
        </p>
      </LegalSection>

      <LegalSection heading="The building">
        <p>
          Geekdom occupies the third floor of {LOCATION.building}. The building
          itself is not ours, and access depends on the building being open and
          on our arrangement with its owner. We&rsquo;ll give members as much
          notice as we have of anything that changes that.
        </p>
        <p>
          Look after your own things. Geekdom isn&rsquo;t responsible for
          property left on the floor.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We&rsquo;ll change the date at the top and email members before
          anything material takes effect. If you don&rsquo;t want to accept a
          change, cancel — that&rsquo;s what the no-notice-period cancellation is
          for.
        </p>
      </LegalSection>

      <LegalSection heading="Questions">
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

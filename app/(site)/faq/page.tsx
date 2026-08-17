import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { CrownPage } from "@/components/site/crown-page";
import { CONTRACTS_END, CONTACT_EMAIL, LOCATION } from "@/lib/site";
import { formatLongDate } from "@/lib/format";
import { isPriceAnnounced, priceLabel } from "@/lib/membership";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions about Geekdom's move from coworking to a membership club: what happens to desks and offices, what the membership includes, and how to apply.",
};

interface QA {
  q: string;
  a: React.ReactNode;
}

export default function FaqPage() {
  const price = priceLabel();

  const faqs: QA[] = [
    {
      q: "What happened to coworking?",
      a: (
        <>
          It&rsquo;s sunsetting. Geekdom is consolidating to the{" "}
          {LOCATION.floor.toLowerCase()} and becoming a membership club for
          founders and builders. One membership replaces the old tiers — no
          dedicated desks, no private offices.
        </>
      ),
    },
    {
      q: "I have an office or a dedicated desk. What now?",
      a: (
        <>
          Those contracts wrap up by {formatLongDate(CONTRACTS_END)}. If that
          affects you, we&rsquo;ve either already spoken with you or we&rsquo;ll
          be in touch. We&rsquo;re committed to making the transition smooth — if
          you have a question in the meantime, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-rust underline">
            {CONTACT_EMAIL}
          </a>
          .
        </>
      ),
    },
    {
      q: "Can I still get work done there?",
      a: (
        <>
          Yes. There&rsquo;s drop-in workspace on the floor for when you need to
          focus, a cafe for coffee chats, and meeting rooms you can reserve for
          deep-dive conversations, brainstorms, or an offsite with your team.
          What&rsquo;s gone is the assigned seat with your name on it.
        </>
      ),
    },
    {
      q: "What does membership cost?",
      a: isPriceAnnounced() ? (
        <>Membership is {price}. You can cancel any time from your account.</>
      ) : (
        <>
          We&rsquo;re finalizing it. Apply now — we&rsquo;ll send the pricing
          along with your invitation, and nothing is charged until you accept.
        </>
      ),
    },
    {
      q: "Why do I have to apply?",
      a: (
        <>
          Because who&rsquo;s in the room is the product. The value of the club
          is the person sitting next to you, and that only works if we&rsquo;re
          deliberate about it. A real person on the Geekdom team reads every
          application.
        </>
      ),
    },
    {
      q: "How long does a decision take?",
      a: (
        <>
          We aim to come back to you within a couple of weeks. If we&rsquo;re
          managing how quickly the club grows, you may hear that you&rsquo;re on
          the list rather than a yes or a no — that&rsquo;s about timing, not
          about you.
        </>
      ),
    },
    {
      q: "Are events open to non-members?",
      a: (
        <>
          Some are. Our public events stay public — they&rsquo;re the best way to
          meet the community before you apply. Members-only events are marked as
          such on the calendar.
        </>
      ),
    },
    {
      q: "How do I cancel or update my card?",
      a: (
        <>
          Go to{" "}
          <a href="/account" className="text-rust underline">
            your account
          </a>{" "}
          and enter your email. We&rsquo;ll send a secure billing link — no
          password to remember.
        </>
      ),
    },
  ];

  return (
    <CrownPage
      eyebrow="Questions"
      title={
        <>
          The practical <span className="text-rust">stuff.</span>
        </>
      }
      subtitle="The letter covers the why. This covers the what-happens-to-my-desk."
    >
      <dl className="divide-y divide-border border-y border-border">
        {faqs.map((faq) => (
          <div key={faq.q} className="py-7">
            <dt className="text-lg font-semibold text-ink">{faq.q}</dt>
            <dd className="mt-3 leading-relaxed text-muted-foreground">
              {faq.a}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/apply" size="lg">
          Apply for membership
        </ButtonLink>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex h-13 items-center justify-center rounded-lg border border-ink/20 px-7 text-lg font-medium text-ink transition-colors hover:bg-sand-deep"
        >
          Ask us something else
        </a>
      </div>
    </CrownPage>
  );
}

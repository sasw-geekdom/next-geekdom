import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import { CrownPage } from "@/components/site/crown-page";
import {
  CONTRACTS_END,
  CLUB_OPENS,
  CONTACT_EMAIL,
  LOCATION,
  OPEN_COFFEE,
  PROPERTY_OWNER,
  TEAM_CONTACTS,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { formatLongDate } from "@/lib/format";
import { isPriceAnnounced, priceLabel } from "@/lib/membership";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions about Geekdom's move from coworking to a membership club: what happens to desks and offices, what the membership includes, what it costs, and how to apply.",
};

/**
 * The members FAQ.
 *
 * THIS IS THE CLIENT'S OWN SHEET, the one that went out attached to the letter.
 * Reproduced close to the source and grouped the way it was written, because
 * people act on these answers — refunds, lease dates, who to email. Tightening
 * the phrasing is fine; changing what an answer commits Geekdom to is not.
 *
 * Where an answer names a date or a price, it reads from lib/site.ts and
 * lib/membership.ts rather than stating it inline, so the FAQ can't drift from
 * the rest of the site — or from Stripe.
 */

interface QA {
  q: string;
  a: React.ReactNode;
}

interface Group {
  title: string;
  items: QA[];
}

export default function FaqPage() {
  const price = priceLabel();
  const contractsEnd = formatLongDate(CONTRACTS_END);
  const opensOn = formatLongDate(CLUB_OPENS);

  const groups: Group[] = [
    {
      title: "About the space",
      items: [
        {
          q: "What happens to the floors above the third floor?",
          a: (
            <>
              Geekdom will no longer operate the Event Centre or the 6th, 7th,
              or 8th floors. Those spaces will be managed separately by the
              property owner, {PROPERTY_OWNER}. Our full focus is on the{" "}
              {LOCATION.floor.toLowerCase()} and the community we&rsquo;re
              building there.
            </>
          ),
        },
        {
          q: "What does the third floor actually look like? What's staying, what's going?",
          a: (
            <>
              The {LOCATION.floor.toLowerCase()} is being redesigned as a
              purposeful club space: open areas for collaboration and
              gatherings, reservable rooms for meetings and focused work, and
              the cafe, conference rooms, and workstations you already know.
              Design and hospitality upgrades will come over time. More on the
              new layout before October.
            </>
          ),
        },
        {
          q: "Can I drop in and work from the third floor without a membership?",
          a: (
            <>
              Geekdom and community-hosted events will be free and open to the
              public. Otherwise a membership is required to access the{" "}
              {LOCATION.floor.toLowerCase()} and member-only activities.
            </>
          ),
        },
      ],
    },
    {
      title: "About current memberships",
      items: [
        {
          q: "Does this affect my coworking membership, or just offices and dedicated desks?",
          a: (
            <>
              <p>
                We&rsquo;re asking all current members to apply for the club
                membership as part of the new onboarding. If you consider
                yourself a builder, a founder, or someone with knowledge or
                skills to contribute to the startup community, you&rsquo;ll be a
                great fit, and we&rsquo;re excited to go deeper with you.
              </p>
              <p className="mt-3">
                If you&rsquo;re primarily looking for a traditional coworking
                space, the club may not be the right fit — and we&rsquo;d rather
                be honest about that upfront than have you invest in something
                that doesn&rsquo;t serve you well. We&rsquo;re happy to suggest
                alternatives, and we hope you&rsquo;ll stay connected through
                our community events.
              </p>
            </>
          ),
        },
        {
          q: `My lease runs past ${contractsEnd}. What happens to me specifically?`,
          a: (
            <>
              Our team will reach out to every affected member with a lease
              individually before the end of August to walk through your
              situation. Nobody will be left without a clear answer.
            </>
          ),
        },
        {
          q: "Will I get a refund or prorated credit?",
          a: (
            <>
              Refunds and prorated credits are handled case by case for office
              tenants and dedicated desks. If you bought an annual coworking
              membership rather than paying month to month, we&rsquo;ll honor it
              through its expiration date. Month-to-month coworking members
              continue on current terms through {contractsEnd}, with no penalty
              for choosing not to continue into the new model.
            </>
          ),
        },
      ],
    },
    {
      title: "About the new club",
      items: [
        {
          q: "What does club membership cost?",
          a: isPriceAnnounced() ? (
            <>The club membership rolls out at {price}.</>
          ) : (
            <>
              We&rsquo;re finalizing it. Apply now — nothing is charged until
              you&rsquo;re accepted.
            </>
          ),
        },
        {
          q: "What does club membership include?",
          a: (
            <>
              <p>
                Access to the {LOCATION.floor.toLowerCase()} and its amenities,
                member-only events and activities, and our virtual member
                platforms. Drop in to work or meet in the open areas, or reserve
                what you need based on availability — conference rooms, call
                rooms, workstations.
              </p>
              <p className="mt-3">
                We&rsquo;re launching a virtual channel and member directory to
                connect members between visits, plus new and rotating
                programming: office hours with mentors, pitch nights, build
                sessions, talk series, and meetups.
              </p>
              <p className="mt-3">
                Parking passes and validations are available at additional cost.
                Guests are complimentary as long as the member is present.
              </p>
            </>
          ),
        },
        {
          q: "Who is it for? Is it just founders, or can I join as a developer, investor, or service provider?",
          a: (
            <>
              <p>
                Our primary goal is serving founders building scalable startups.
                But a thriving startup community needs the many people who power
                it: developers, creatives, engineers, investors, service
                providers, tech workers, corporate innovators, and seasoned
                operators who want to plug in and give back.
              </p>
              <p className="mt-3">
                The ideal members are not passive coworkers. They&rsquo;re here
                to be part of a startup community, and they want to show up and
                contribute.
              </p>
            </>
          ),
        },
        {
          q: "How do I apply?",
          a: (
            <>
              It&rsquo;s a short online form — a handful of questions, about ten
              minutes. It was emailed to current members and it&rsquo;s{" "}
              <Link href="/apply" className="text-rust underline">
                here on the site
              </Link>
              . You&rsquo;ll hear back within two weeks of applying.
            </>
          ),
        },
        {
          q: "What happens if I apply and don't get in?",
          a: (
            <>
              If the club isn&rsquo;t a fit, or you&rsquo;re looking for a more
              traditional coworking experience, we&rsquo;ll point you to our free
              community events and can refer you to small business assistance
              organizations or other coworking spaces. The purpose of the
              application is to know our member base and make sure what we offer
              lines up with what you&rsquo;re looking for.
            </>
          ),
        },
        {
          q: "When does the club open?",
          a: (
            <>
              Applications rolled out in mid-to-late August. The new club
              membership fully operates from {opensOn}.
            </>
          ),
        },
      ],
    },
    {
      title: "About staying connected",
      items: [
        {
          q: "If I don't join the club, how do I stay connected to Geekdom?",
          a: (
            <>
              Stay subscribed to the newsletter, follow us on social, and come to
              the free community events we host — including {OPEN_COFFEE.name}{" "}
              every week.
            </>
          ),
        },
        {
          q: "Will there still be events open to non-members?",
          a: (
            <>
              Yes. Geekdom hosts and partners on events open to non-members.
              You&rsquo;ll find them in the newsletter, on social, and on the{" "}
              <Link href="/events" className="text-rust underline">
                public calendar
              </Link>{" "}
              — also on{" "}
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-rust underline"
              >
                Luma
              </a>
              .
            </>
          ),
        },
        {
          q: "What is Open Coffee, and how do I find it?",
          a: (
            <>
              {OPEN_COFFEE.name} is a weekly coffee gathering Geekdom hosts for
              the greater San Antonio startup community. {OPEN_COFFEE.when}, at{" "}
              {OPEN_COFFEE.where}. Subscribe to the{" "}
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="text-rust underline"
              >
                calendar
              </a>{" "}
              for updates.
            </>
          ),
        },
      ],
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
      <div className="flex flex-col gap-14">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
              {group.title}
            </h2>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {group.items.map((faq) => (
                <div key={faq.q} className="py-7">
                  <dt className="text-lg font-semibold text-ink">{faq.q}</dt>
                  <dd className="mt-3 leading-relaxed text-muted-foreground">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {/*
          Named people, not a shared inbox. Someone worried about a lease or a
          refund should reach the person who can actually answer, rather than
          send it to a queue and wait to be routed.
        */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
            Who to ask
          </h2>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {TEAM_CONTACTS.map((contact) => (
              <div
                key={contact.email}
                className="py-6 sm:flex sm:items-baseline sm:justify-between sm:gap-8"
              >
                <dt className="font-semibold text-ink">{contact.topic}</dt>
                <dd className="mt-1 text-muted-foreground sm:mt-0 sm:text-right">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-rust underline"
                  >
                    {contact.name}
                  </a>
                  <span className="block text-sm">{contact.role}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/apply" size="lg">
          Apply for membership
        </ButtonLink>
        <ButtonAnchor
          href={`mailto:${CONTACT_EMAIL}`}
          variant="outline"
          size="lg"
        >
          Ask us something else
        </ButtonAnchor>
      </div>
    </CrownPage>
  );
}

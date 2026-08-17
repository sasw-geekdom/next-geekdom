import type { Metadata } from "next";
import { Check, Minus, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, Section, SectionTitle } from "@/components/site/section";
import { TypeHero } from "@/components/site/type-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PHOTOS } from "@/lib/photos";
import {
  BENEFITS,
  NOT_INCLUDED,
  priceLabel,
  formatPrice,
  isPriceAnnounced,
  MEMBERSHIP_PRICE_CENTS,
  MEMBERSHIP_INTERVAL,
  AUDIENCES,
  EXTRAS,
} from "@/lib/membership";
import { LOCATION, CLUB_OPENS, MILESTONES } from "@/lib/site";
import { formatLongDate } from "@/lib/format";

// Built from priceLabel() so the search snippet can't drift from Stripe — see
// the note in app/layout.tsx.
export const metadata: Metadata = {
  title: "Membership",
  description: `One membership${
    priceLabel() ? `, ${priceLabel()}` : ""
  }. The third floor, the programming, and a room full of people who'll break the problem down with you. No dedicated desks. No offices.`,
};

export default function MembershipPage() {
  // null while pricing is unannounced — see lib/membership.ts. The page reads
  // correctly either way rather than shipping a placeholder number.
  const price = priceLabel();

  return (
    <>
      {/*
        Type-led, with the PRICE as the visual anchor rather than a photograph.

        That's the whole difference from the homepage, which uses the same
        component: home anchors on a citation because its job is to make a
        claim, and this page anchors on the number because its job is to remove
        the last reason to hesitate. Both are type on sand; neither competes
        with the other for the same device.

        The figure is built from MEMBERSHIP_PRICE_CENTS, never typed. A literal
        here would drift from Stripe silently, and this is now the largest
        rendering of the price anywhere on the site.
      */}
      <TypeHero
        eyebrow="Membership"
        title={
          <>
            One <span className="text-rust">membership.</span>
          </>
        }
      >
        <p className="text-lg leading-relaxed text-muted-foreground">
          No tiers to compare, no desk to rent, no contract to negotiate. One
          membership that gets you the room, the programming, and the people
          who&rsquo;ll think the hard part through with you.
        </p>

        {isPriceAnnounced() && MEMBERSHIP_PRICE_CENTS !== null && (
          <p className="mt-12 text-7xl font-bold tracking-[-0.03em] text-ink tabular-nums sm:text-8xl">
            {formatPrice(MEMBERSHIP_PRICE_CENTS)}
            <span className="align-middle text-2xl font-medium tracking-normal text-muted-foreground">
              /{MEMBERSHIP_INTERVAL}
            </span>
          </p>
        )}

        <p className="mt-5 text-base text-muted-foreground">
          Nothing is charged until you&rsquo;re accepted, and you can cancel any
          time.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <ButtonLink href="/apply" size="lg">
            Apply for membership
          </ButtonLink>
          <ButtonLink href="/the-floor" size="lg" variant="outline">
            See the floor
          </ButtonLink>
        </div>
      </TypeHero>

      {/*
        The photograph the type-led hero gives up. It sits BELOW the price
        rather than behind it, which is the whole point of the split — the
        number gets the fold, the room answers it immediately after.

        This frame was on this page before, as a cropped panel beside the old
        hero. Full width it keeps the group it was shot for.

        NO `fadeTo`. The homepage band needs one because it runs into the ink
        section and a photograph meeting a dark band edge-to-edge draws a hard
        rule across the page. This one meets white — there is no seam to soften,
        and fading a lit room into white just washes out its bottom third.
      */}
      <PhotoBand photo={PHOTOS.theCrowd} />

      {/*
        The track record, repeated from the homepage on purpose.

        This is the page where the number matters: someone weighing $100 a month
        is asking whether the room has produced anything, and these are the only
        hard figures the site has. Set smaller than the homepage's — there it is
        the section's subject, here it is evidence in support of a price.
      */}
      <Section tone="white">
        <Eyebrow>The track record</Eyebrow>
        <SectionTitle>What the room has produced.</SectionTitle>
        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3">
          {MILESTONES.map((m) => (
            <div key={m.label}>
              <dt className="text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">
                {m.figure}
              </dt>
              <dd className="mt-1.5 font-mono text-xs uppercase leading-relaxed tracking-[0.14em] text-muted-foreground">
                {m.label}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/*
        WHO IT'S FOR — the biggest thing this page was missing.

        Its answer existed only in the members FAQ, and the omission had a cost
        in one direction: a developer, an investor or a service provider reading
        a page that only ever says "founders" self-selects out of a club that
        wants them. The last line is the actual filter, and it's the FAQ's own —
        the test is whether you'll contribute, not what your title is.
      */}
      <Section tone="sand">
        <Eyebrow>Who it&rsquo;s for</Eyebrow>
        <SectionTitle>Founders first. Not founders only.</SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A startup community needs the people who power it — developers,
          creatives, engineers, investors, service providers, tech workers,
          corporate innovators, and operators who have done it before and want
          to give back.
        </p>
        {/*
          Two columns, a rule under each. The pills this replaced read as form
          controls — small, capsuled, interchangeable — which is the wrong
          register for a section whose job is to widen who sees themselves in
          the room. A ruled line reads as an entry in a list rather than as a
          token you might pick one of.

          NO NUMBERING, deliberately. An earlier pass had 01–06 running down the
          left, which looked tidy and said something untrue: numbers rank, and a
          founder does not outrank a civic leader here — the FAQ's whole point
          is that the club wants both equally.
        */}
        <ul className="mt-10 grid gap-x-12 sm:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <li
              key={audience}
              className="border-b border-border py-4 text-lg font-semibold text-ink"
            >
              {audience}
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-2xl text-lg font-medium leading-relaxed text-ink">
          The one thing every member has in common: they&rsquo;re not here to
          cowork quietly. They show up and contribute.
        </p>
      </Section>

      <Section tone="white" className="pt-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          {/* What you get */}
          <div>
            <h2 className="text-2xl font-bold text-ink">What&rsquo;s included</h2>
            <ul className="mt-8 flex flex-col gap-7">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex gap-4">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-rust"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-ink">{benefit.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 text-2xl font-bold text-ink">
              What it isn&rsquo;t
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {NOT_INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <Minus
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            {/* Priced separately, and said out loud. */}
            <ul className="mt-4 flex flex-col gap-3">
              {EXTRAS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <Plus
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Price / apply card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-sand p-7 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
                Geekdom Club
              </p>

              {price ? (
                <p className="mt-4 text-4xl font-bold tracking-tight text-ink">
                  {price.split("/")[0]}
                  <span className="text-lg font-medium text-muted-foreground">
                    /{price.split("/")[1]}
                  </span>
                </p>
              ) : (
                <>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-ink">
                    Pricing coming soon
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Apply now and we&rsquo;ll send the membership details along
                    with your invitation. Nothing is charged until you accept.
                  </p>
                </>
              )}

              <ButtonLink href="/apply" size="lg" className="mt-6 w-full">
                Apply for membership
              </ButtonLink>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Applications are read by a person on the Geekdom team. If
                it&rsquo;s a fit, we&rsquo;ll send you an invitation to activate
                your membership.
              </p>

              <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
                <p className="font-medium text-ink">{LOCATION.line1}</p>
                <p className="mt-1">{LOCATION.full}</p>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      {/*
        The timeline. Every number here comes from the members FAQ, and its
        absence was the page's other real gap: it asked for an application and
        never said how long you'd wait or when the thing you're paying for
        actually starts.
      */}
      <Section tone="deep">
        <Eyebrow>What happens next</Eyebrow>
        <SectionTitle>Three steps, no negotiation.</SectionTitle>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Apply",
              body: "A short form — a handful of questions, about ten minutes.",
            },
            {
              n: "02",
              title: "Hear back",
              body: "A person on the Geekdom team reads it. You'll have an answer within two weeks.",
            },
            {
              n: "03",
              title: "Start",
              body: `The club membership operates fully from ${formatLongDate(
                CLUB_OPENS,
              )}. Nothing is charged until you're accepted.`,
            },
          ].map((step) => (
            <li key={step.n}>
              <p className="font-mono text-xs tracking-[0.18em] text-rust">
                {step.n}
              </p>
              <h3 className="mt-2 text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="ink">
        <Eyebrow onInk>Already a member</Eyebrow>
        <SectionTitle className="text-white">
          Manage your membership.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Update your card, download invoices, or cancel — no sign-in to
          remember. We&rsquo;ll email you a secure link.
        </p>
        <ButtonLink href="/account" size="lg" variant="on-ink" className="mt-8">
          Go to billing
        </ButtonLink>
      </Section>
    </>
  );
}

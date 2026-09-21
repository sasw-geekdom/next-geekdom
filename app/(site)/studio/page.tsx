import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  Lede,
  Section,
  SectionTitle,
  Subhead,
  MONO,
} from "@/components/site/section";
import { Editorial, PullQuote } from "@/components/site/editorial";
import { TypeHero } from "@/components/site/type-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PortfolioWall } from "@/components/site/portfolio-wall";
import { PHOTOS } from "@/lib/photos";
import {
  STUDIO,
  STUDIO_CRITERIA,
  STUDIO_PARTNERS,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Studio",
  path: "/studio",
  description: `Geekdom's venture layer. ${STUDIO.checkRange} ${STUDIO.checkTerms} checks from the ${STUDIO.fund} and ${STUDIO.engagement} of hands-on work with our Entrepreneur in Residence, for ${STUDIO.foundersPerYear} San Antonio founders a year. Not an accelerator. No cohorts. No open application.`,
});

/**
 * THE SECOND ENGINE, and the page the site was missing entirely.
 *
 * Half of what Geekdom does had no representation anywhere: a visitor could
 * read every page and conclude Geekdom rents access to a nice floor for $100 a
 * month. The nav now names two things, and this is the other one.
 *
 * EVERY FIGURE AND EVERY CLAIM COMES FROM GEEKDOM'S OWN SOURCE COPY (v1, 19
 * September 2026), through constants in lib/site.ts rather than typed inline.
 * These are the terms of a live fund — check size, MRR floor, founders a year
 * — and a number that drifts here is a number a founder plans around.
 *
 * THE PAGE'S HARDEST JOB IS SAYING NO WITHOUT SAYING GO AWAY. There is no open
 * application and there are no cohorts; founders are scouted and invited. A
 * page that explains an opportunity and then offers no door is a page people
 * leave annoyed, so the door it does offer is the real one: come to a public
 * event, apply to the Club, send a deck. That is genuinely how Studio
 * relationships start, and it is stated three times rather than buried once.
 *
 * NOT AN ACCELERATOR, said plainly and early. It is the single most likely
 * wrong assumption a founder arrives with, and the brand guide lists
 * "accelerator" among the things Geekdom explicitly is not.
 */
export default function StudioPage() {
  return (
    <>
      <TypeHero
        size="compact"
        eyebrow="Studio · The venture layer"
        title={
          <>
            Where we go all in with the founders we{" "}
            <span className="text-clay">believe in.</span>
          </>
        }
        side={
          /*
            THE TERMS, BESIDE THE PITCH — the same structure /club uses, where
            the price sits opposite what it buys. A founder reading this page
            is asking four questions (how much, on what terms, for how long,
            how many of us) and all four are answerable in one line each. Left
            below the fold they would be five paragraphs of prose to mine.

            Hairline-ruled rows at the mono label scale, matching the criteria
            list further down, so the page has one idiom for "a fact you scan"
            rather than a card up here and a list down there.
          */
          <div>
            <p className={cn(MONO.label, "text-muted-foreground")}>
              The terms
            </p>
            <dl className="mt-5">
              {[
                ["Check", `${STUDIO.checkRange} on ${STUDIO.checkTerms} terms`],
                ["From", STUDIO.fund],
                ["Founders a year", STUDIO.foundersPerYear],
                ["Engagement", "6–12 months, hands-on"],
                ["Stage", "Pre-seed, $500+ MRR"],
                ["How you get in", "Scouted and invited"],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 border-b border-border py-3"
                >
                  <dt className="text-sm text-muted-foreground">{term}</dt>
                  <dd className="text-lg font-medium leading-snug text-graphite">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        }
      >
        {/*
          The guide's editorial face, on the one line here that is a claim
          rather than a term. The source copy marks it "Fraunces italic"
          explicitly — it is the Studio's whole argument in six words, and it
          earns the register the rest of this page can't have.
        */}
        <Editorial className="text-2xl leading-[1.45] text-graphite/90">
          More than a check. More than mentorship.
        </Editorial>

        <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
          The Studio backs a small number of local founders each year with a{" "}
          {STUDIO.checkRange} {STUDIO.checkTerms} check from our{" "}
          {STUDIO.fund} and {STUDIO.engagement} of intensive, hands-on work with
          our {STUDIO.eir.role}, {STUDIO.eir.name}. The focus is on
          go-to-market, product, and getting founders connected to the local
          customers, operators, and investors who make growth possible.
        </p>

        {/*
          THE DISQUALIFIER, HIGH UP. Someone who came here to apply should find
          out in the first screen that there is nothing to apply to, not after
          scrolling past the investment criteria.
        */}
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          There&rsquo;s no open application and no cohorts. Founders are scouted
          and invited. Club membership isn&rsquo;t a prerequisite, but most
          Studio relationships start there.
        </p>
      </TypeHero>

      <PhotoBand photo={PHOTOS.oneOnOne} aspect="lg:aspect-video" priority />

      {/* ── The EIR ──────────────────────────────────────────────────── */}
      {/*
        A NAMED PERSON, WITH A TRACK RECORD, placed before the terms.

        The brand guide's voice section asks for real names and real outcomes
        over claims, and this page's central promise is "hands-on work" — which
        is meaningless until you know whose hands. Brian's bio is the evidence
        for the only part of the offer that isn't a number.
      */}
      <Section tone="bone-light">
        <Eyebrow>Leading the Studio</Eyebrow>
        <SectionTitle>{STUDIO.eir.name}</SectionTitle>
        <p className={cn("mt-4", MONO.label, "text-muted-foreground")}>
          {STUDIO.eir.role}, Geekdom Studio
        </p>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {STUDIO.eir.name} leads the Studio. He co-founded TeamPassword in
              2012, bootstrapped it alongside a day job for four years, went
              full-time in 2016, and sold it to San Antonio&rsquo;s Jungle Disk
              in 2018. He&rsquo;s spent the years since shipping products,
              writing about SaaS, and working alongside founders in the city.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              He works with Studio companies the way he built his own — sleeves
              up, on the specific work that turns early traction into real
              scale.
            </p>
          </div>

          {/*
            PLACEHOLDER QUOTE. The source copy flags this one explicitly:
            "Pull quote is a placeholder. Get a real one from Brian before
            launch." It stays because an empty slot teaches the layout nothing,
            and it is marked here so it cannot quietly ship as his words.
          */}
          <PullQuote className="lg:text-xl">
            Early stage startups need two things: customers and capital. I
            personally love to go after both.
          </PullQuote>
        </div>
      </Section>

      {/* ── Who we invest in ─────────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Who we invest in</Eyebrow>
        <SectionTitle>The shape of a Studio company.</SectionTitle>
        <Lede>
          We focus on local founders and startups well positioned to sell into
          local corporate partners, work with senior operator talent in our
          networks, and receive follow-on funding from local investors.
        </Lede>

        {/*
          Hairline-ruled rows rather than bullets — the same list idiom the
          Club page uses, so the two engines read as one site. Criteria are
          quoted exactly: "$500 MRR, average entry $7K" is a floor and a
          typical, and collapsing it to either one changes what it says.
        */}
        <ul className="mt-12 grid gap-x-12 sm:grid-cols-2">
          {STUDIO_CRITERIA.map((criterion) => (
            <li
              key={criterion}
              className="border-t border-border py-4 text-lg leading-snug text-graphite"
            >
              {criterion}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── The Community Fund ───────────────────────────────────────── */}
      <Section tone="graphite">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow onInk>Capital</Eyebrow>
            <SectionTitle className="text-bone">
              The check is small on purpose.
            </SectionTitle>
          </div>
          <div className="flex flex-col gap-6">
            <p className="text-lg leading-relaxed text-bone/70">
              The {STUDIO.fund} is how we make our initial investment in each
              Studio company. Checks are {STUDIO.checkRange} on{" "}
              {STUDIO.checkTerms} terms.
            </p>
            <p className="text-lg leading-relaxed text-bone/70">
              It signals real commitment without stretching the founder or the
              fund. The value is in what comes with it: {STUDIO.eir.name}
              &rsquo;s time, the network, and the local corporate, operator, and
              investor relationships that make the next round possible.
            </p>
          </div>
        </div>
      </Section>

      {/* ── Studio companies ─────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>Studio companies</Eyebrow>
        <SectionTitle>Who we&rsquo;re in with.</SectionTitle>
        <PortfolioWall studioOnly className="mt-12" />
      </Section>

      {/* ── Open programming ─────────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Open to the community</Eyebrow>
        <SectionTitle>Not everything here is invitation-only.</SectionTitle>
        <Lede>
          The Studio hosts a small amount of open programming each year —{" "}
          {STUDIO.openPrograms.slice(0, -1).join(", ")}, and{" "}
          {STUDIO.openPrograms.at(-1)?.toLowerCase()}. These are open to the
          broader community, not just Studio companies.
        </Lede>
        <Lede className="mt-5">
          If you&rsquo;re building something and wondering whether the Studio
          might be a fit, come to a public event and apply to the Club. The
          application tells us who you are and what you&rsquo;re working on.
          Studio invitations get made from there.
        </Lede>
      </Section>

      {/* ── Built with ───────────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>Built with</Eyebrow>
        <SectionTitle>Who backs the Studio.</SectionTitle>
        <Lede>
          The Studio is supported by partners who believe San Antonio&rsquo;s
          founder community is worth investing in.
        </Lede>
        <ul className="mt-10 grid gap-x-12 sm:grid-cols-2">
          {STUDIO_PARTNERS.map((partner) => (
            <li
              key={partner}
              className="border-t border-border py-5 text-lg font-medium leading-snug text-graphite"
            >
              {partner}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── How to get involved ──────────────────────────────────────── */}
      {/*
        THE DOOR, and the reason this section exists at all.

        Everything above says no: no application, no cohorts, invitation only.
        Two audiences arrive at the bottom of this page with somewhere to go —
        a founder who wants in, and a corporate partner who wants to work with
        the companies. Both get a real next step rather than a mailto buried in
        a paragraph.
      */}
      <Section tone="bone">
        <Eyebrow>How to get involved</Eyebrow>
        <SectionTitle>Two doors, both real.</SectionTitle>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Subhead>If you&rsquo;re a founder</Subhead>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The Studio isn&rsquo;t something you apply to directly. We scout
              founders and companies to be invited in. The best Studio
              investments start as relationships.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/apply">Apply to the Club</ButtonLink>
              <ButtonAnchor
                external
                href={LUMA_CALENDAR_URL}
                variant="outline"
              >
                See upcoming events
              </ButtonAnchor>
            </div>
            <p className="mt-6 text-muted-foreground">
              Or introduce yourself — send your deck to{" "}
              <a
                href={`mailto:${STUDIO.email}`}
                className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
              >
                {STUDIO.email}
              </a>
              .
            </p>
          </div>

          <div>
            <Subhead>If you&rsquo;re a corporate partner</Subhead>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              We work with a small number of corporate partners each year to
              support Studio companies with pilots, talent access, and
              follow-on introductions. If that sounds like a fit, we&rsquo;d
              like to talk.
            </p>
            <div className="mt-8">
              <ButtonAnchor href={`mailto:${STUDIO.email}`} variant="outline">
                Start a conversation
              </ButtonAnchor>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

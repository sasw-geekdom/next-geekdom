import type { Metadata } from "next";
import Image from "next/image";
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
import { Editorial } from "@/components/site/editorial";
import { MemberVoices } from "@/components/site/member-voices";
import { TypeHero } from "@/components/site/type-hero";
import { PortfolioWall } from "@/components/site/portfolio-wall";
import { VideoCard } from "@/components/site/video-card";
import { StudioFilmJsonLd } from "@/components/site/structured-data";
import { Photo } from "@/components/site/photo";
import { PHOTOS } from "@/lib/photos";
import { MOCK_FOUNDER_VOICES } from "@/data/mock/voices";
import {
  STUDIO,
  STUDIO_CRITERIA,
  STUDIO_PARTNERS,
  STUDIO_FILM,
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
      {/*
        THE BLEED, ON THE THIRD HERO THAT NEEDS IT.

        The homepage and /club both open on a photograph under the ramp, and
        this page opened on type over Bone. Reading them in sequence, the
        Studio looked like a subsection of the site rather than the other half
        of the institution — the visual promotion the nav already gave it was
        missing from the page itself.

        OPENLANE AT THEIR WHITEBOARD, and it is the whole argument in one
        frame: two founders of a backed company working a problem out on a
        wall. What the Studio sells is six to twelve months of that, so a
        photograph of the act beats a photograph of the building — and the
        "same floor" rule is scoped to Club imagery for exactly this reason
        (see the note in lib/photos.ts).

        MEASURED against the three candidates in the real ramp, at 1440×760
        with the box inset to 38%: this frame holds Bone at 15.3:1 median and
        6.0:1 at the single worst pixel across the copy column, AA for body
        with margin. `brianWhiteboard` measured comparably but does not
        survive the crop — the fold is 1.87 and that frame is 1.50 with both
        heads near the top edge, so cover takes the tops of their heads off.
        Centred, not left-anchored: at `object-left` the man on the right is
        cut in half by the frame edge.

        1600px against the ~2380 device px a full-bleed fold wants at 2x. The
        same knowing trade /club's hero already takes, and the ramp is what
        makes it survivable — 96% of the left half is scrim, so there is very
        little detail left to go soft.

        IT LEAVES THE STUDIO-COMPANIES SECTION, where it was the one
        photograph. Running it in both places is the duplication this site has
        been caught on repeatedly; the logo wall is the right content for
        "who we're in with" anyway, since four companies and one photograph
        means three of them go unpictured.
      */}
      <TypeHero
        size="compact"
        eyebrow="Studio · The venture layer"
        media={{ photo: PHOTOS.openlaneTeam, fadeTo: "48%" }}
        title="Where we go all in with the founders we believe in."
      >
        {/*
          The guide's editorial face, on the one line here that is a claim
          rather than a term. The source copy marks it "Fraunces italic"
          explicitly — it is the Studio's whole argument in six words, and it
          earns the register the rest of this page can't have.
        */}
        <Editorial className="text-2xl leading-[1.45] text-bone">
          More than a check. More than mentorship.
        </Editorial>

        <p className="mt-8 text-lg leading-relaxed text-bone/80">
          The Studio backs a small number of local founders each year with a{" "}
          {STUDIO.checkRange} {STUDIO.checkTerms} check from our {STUDIO.fund}{" "}
          and {STUDIO.engagement} of intensive, hands-on work with our{" "}
          {STUDIO.eir.role}, {STUDIO.eir.name}.
        </p>

        {/*
          THE DISQUALIFIER, HIGH UP. Someone who came here to apply should find
          out in the first screen that there is nothing to apply to, not after
          scrolling past the investment criteria.
        */}
        <p className="mt-5 text-lg leading-relaxed text-bone">
          There&rsquo;s no open application and no cohorts. Founders are
          scouted and invited.
        </p>
      </TypeHero>

      {/*
        THE TERMS, IN A BAND OF THEIR OWN — they were a side panel in the hero,
        and the bleed cannot hold both. `media` caps the copy block at 42rem so
        it stays inside the heavy end of the ramp; a 20rem side column inside
        that leaves the headline about 22rem to set in.

        Moving them out cost nothing and gained the full measure. A founder
        reading this page is asking four questions — how much, on what terms,
        for how long, how many of us — and six rows across three columns
        answers all of them in one screen, where the panel answered them in a
        column narrow enough to wrap every value.

        Directly under the fold, before the person and before the criteria,
        because it is the cheapest possible way for the wrong-stage founder to
        find out and leave.
      */}
      <Section tone="bone">
        <Eyebrow>The terms</Eyebrow>
        <dl className="mt-10 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Check", `${STUDIO.checkRange} on ${STUDIO.checkTerms} terms`],
            ["From", STUDIO.fund],
            ["Founders a year", STUDIO.foundersPerYear],
            ["Engagement", "6–12 months, hands-on"],
            ["Stage", "Pre-seed, $500+ MRR"],
            ["How you get in", "Scouted and invited"],
          ].map(([term, value]) => (
            <div key={term} className="border-t border-border py-5">
              <dt className={cn(MONO.label, "text-muted-foreground")}>
                {term}
              </dt>
              <dd className="mt-2 text-lg font-medium leading-snug text-graphite">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      {/* ── The EIR ──────────────────────────────────────────────────── */}
      {/*
        A NAMED PERSON, WITH A TRACK RECORD, placed before the terms.

        The brand guide's voice section asks for real names and real outcomes
        over claims, and this page's central promise is "hands-on work" — which
        is meaningless until you know whose hands. Brian's bio is the evidence
        for the only part of the offer that isn't a number.
      */}
      <Section tone="bone-light">
        {/*
          A PROFILE BLOCK, and the heading sits INSIDE it — the one place on
          this site where it does.

          Every other section runs Eyebrow, SectionTitle, then content across
          the full measure. This section is about a PERSON, and a name beside
          a face is how a person is introduced; run full width above the grid
          it is a topic heading with a photograph filed under it.

          IT IS ALSO WHAT MAKES THE COLUMNS BALANCE. The layout before this
          was `[1.1fr_1fr]` with the portrait capped at 19rem inside a 536px
          column — a 232 x 380 hole of nothing beside it, with the bio pushed
          down past the picture. Sizing the TRACK to the cap fixed that, but
          once "What the work is" moved to the Capital section the copy column
          was 200px of text against a 420px rail, so the hole reappeared lower
          down.

          MEASURED at the 1088px container: the rail is 304 wide and about 420
          tall with its caption. The copy track at 34rem gives the bio roughly
          sixty characters a line, so the name block and two paragraphs come
          to about 405. Within fifteen pixels, which is why the heading is in
          here rather than above.

          THE CAP STAYS. A face widened to fill a column becomes a poster; at
          ~300px it reads as someone you could recognise in the room.
        */}
        <div className="grid gap-12 lg:grid-cols-[19rem_minmax(0,34rem)] lg:gap-16">
          <div>
            <Eyebrow>Leading the Studio</Eyebrow>
            <SectionTitle>{STUDIO.eir.name}</SectionTitle>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
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
            SECOND IN THE DOM, FIRST IN THE TRACKS.

            With the heading inside the grid, a one-column stack that led
            with the portrait showed a phone a face and a job title before
            it said whose they were — the name arrived after both. Putting
            the copy first in the source fixes the phone AND the reading
            order a screen reader gets, and `lg:order-first` puts the rail
            back on the left from lg up. Grid auto-placement follows the
            ORDERED sequence, so the rail still takes the 19rem track.
          */}
          <div className="lg:order-first">
            <Photo
              photo={PHOTOS.brianPortrait}
              aspect="aspect-[4/5]"
              sizes="(min-width: 1024px) 304px, 60vw"
              className="max-w-[19rem]"
            />
            {/*
              ", Geekdom Studio" came off with the move. In a 19rem rail it
              wrapped to a second line to say something the eyebrow beside it
              ("Leading the Studio") and the URL have both already said.
            */}
            <p className={cn("mt-5", MONO.label, "text-muted-foreground")}>
              {STUDIO.eir.role}
            </p>
          </div>
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

      {/*
        THE FOUNDERS, AFTER THE CRITERIA — and it renders nothing until the
        quotes are real.

        Everything above this point is Geekdom describing its own offer. This
        is the one slot on the page where somebody who took the deal can say
        what it was like, which is the question the criteria provoke: fine,
        that is who you back, but what did they get?

        THIS SLOT IS WHERE IT IS BECAUSE OF THE TONE ALTERNATION. The band
        has to sit between two sections that do not collide with it when it
        renders AND do not collide with each other when it doesn't — and Bone
        Light between the Bone criteria and the Graphite fund is the only
        place on this page where both hold. Bone / Bone Light is a six-point
        step; a hairline separates them, an accidental adjacency does not.

        See data/mock/voices.ts for why the list is empty.
      */}
      <MemberVoices
        voices={MOCK_FOUNDER_VOICES}
        tone="bone-light"
        eyebrow="From the founders"
        title="What the six months were actually like."
      />

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

        {/*
          THE ITEMIZATION OF THAT COLON, and it started life two sections up.

          It was "What the work is" in the EIR section, filling the column the
          placeholder pull quote had left — words the source copy flags as not
          yet Brian's ("Get a real one from Brian before launch"), which a
          fabricated sentence under a real person's name had no business being
          (see data/mock/voices.ts).

          It reads better here. The paragraph above ends "the value is in what
          comes with it: his time, the network, and the local corporate,
          operator, and investor relationships" — a sentence that names four
          things and leaves a founder to work out what any of them means in
          practice. These five rows are that sentence, itemized, and every one
          of them is lifted from the page's own hero copy rather than invented.

          FULL WIDTH BELOW THE GRID rather than inside a column. The grid is
          two columns of roughly 500px; five rows inside one of them sets a
          second column of the same list beside a paragraph, and the reading
          order stops being obvious. Across the measure it is 3 + 2, which is
          the shape `STUDIO_CRITERIA` already uses further up.

          bone/15 for the rules, not `border-border` — that token is #d9d3c5,
          a light-ground hairline, and on graphite it reads as a bright line
          rather than a division.
        */}
        <p className={cn("mt-16", MONO.label, "text-bone/60")}>
          What comes with it
        </p>
        <ul className="mt-5 grid gap-x-12 sm:grid-cols-2">
          {[
            "Go-to-market, with you in the room",
            "Product, and what to build next",
            "Local customers who can actually buy",
            "Operators in our networks, when you need to hire",
            "Local investors, ahead of the round",
          ].map((item) => (
            <li
              key={item}
              className="border-t border-bone/15 py-4 text-lg leading-snug text-bone"
            >
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* ── Studio companies ─────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>Studio companies</Eyebrow>
        <SectionTitle>Who we&rsquo;re in with.</SectionTitle>

        {/*
          LOGOS ONLY, AND NO FAVOURITE.

          This section used to open on a photograph of Openlane's founders at
          their whiteboard, captioned with their name so that privileging one
          of the four read as deliberate rather than accidental. That frame is
          the page's hero now — it is the best photograph the Studio has and
          the fold is where it earns the most — and running it twice on one
          page is the duplication this site keeps getting caught on.

          Nothing replaces it. Geekdom supplied one photograph of one backed
          team and there are no equivalents for the other three; a second
          company's frame would have to be invented or borrowed. Four logos
          treat the four the same, which is what the section's own title
          promises.
        */}
        <PortfolioWall studioOnly className="mt-14" />

        {/*
          ONE OF THE FOUR, ON CAMERA — and this is the section's proof rather
          than its decoration.

          The note above says nothing replaced the photograph that led this
          section. This is not that photograph's replacement: it is Geekdom's
          own published film about a named portfolio company, with the founder
          speaking. The objection to the photograph was that one company's
          frame stood in for four; a film is captioned with whose it is and
          makes no claim about the others.

          IT IS ALSO THE NEAREST THING /studio HAS TO A FOUNDER VOICE. Every
          other line on this page is Geekdom describing its own offer, and the
          quote grid further up is still empty because there is nothing real
          to put in it yet. This is 38 minutes of a founder talking, which is
          more than a pull quote was ever going to be.

          THE FOUNDER IS NAMED IN THE LABEL — "Real people, named. No stock."
          is the guide's loudest rule, and the row said "KeepTabz" while
          leaving the person in it anonymous on the one page whose gap is that
          no founder speaks. Franklin Morris comes off the film's own
          description; see `STUDIO_FILM`.

          IT RENDERS AS A HAIRLINE ROW, which is this page's own idiom — the
          terms, the criteria, "what comes with it" and the logo wall above it
          are all the same shape. The film is evidence supporting a section
          about four companies, not the section's subject, and a 16:9 panel
          across the full measure is 612px tall and outranks everything near
          it. The player appears when pressed; see the note in that file.
        */}
        <StudioFilmJsonLd />
        <VideoCard
          id={STUDIO_FILM.youtubeId}
          title={STUDIO_FILM.title}
          label={`Geekdom film · ${STUDIO_FILM.founder}, ${STUDIO_FILM.company}`}
          portrait={PHOTOS.franklinMorris}
          className="mt-16"
        />
      </Section>

      {/* ── Open programming ─────────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Open to the community</Eyebrow>
        <SectionTitle>Not everything here is invitation-only.</SectionTitle>
        {/*
          THE CLAIM, PHOTOGRAPHED. This section asserted that anyone can walk
          into some of this and then showed nothing, on a page where every
          other section carries either a figure or a list. The frame is a
          Studio founder teaching one of those sessions — the whiteboard
          behind him names him and the workshop — so it is evidence for the
          section rather than decoration in it.

          TWO COLUMNS, because 16:9 across the full 1088px measure is 612px
          tall and would make the open programming the biggest thing on a page
          about a closed fund. At 0.9fr it is ~490px, the same weight the
          homepage gives its product sections.
        */}
        <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div>
            <Lede className="mt-0">
              The Studio hosts a small amount of open programming each year —{" "}
              {STUDIO.openPrograms.slice(0, -1).join(", ")}, and{" "}
              {STUDIO.openPrograms.at(-1)?.toLowerCase()}. These are open to
              the broader community, not just Studio companies.
            </Lede>
            <Lede className="mt-5">
              If you&rsquo;re building something and wondering whether the
              Studio might be a fit, come to a public event and apply to the
              Club. The application tells us who you are and what you&rsquo;re
              working on. Studio invitations get made from there.
            </Lede>
          </div>

          <figure>
            <Photo
              photo={PHOTOS.workshopWednesday}
              aspect="aspect-video"
              sizes="(min-width: 1024px) 490px, 100vw"
            />
            {/*
              NAMED, because the guide's rule is "Real people, named" and
              because naming him is what ties this to the film further down —
              the person running the open session is the founder of a company
              the Studio backed. That is the pipeline argument in two frames,
              and it only works if both say who he is.
            */}
            <figcaption
              className={cn("mt-3", MONO.label, "text-muted-foreground")}
            >
              Workshop Wednesday — {STUDIO_FILM.founder} of{" "}
              {STUDIO_FILM.company} on marketing strategy
            </figcaption>
          </figure>
        </div>
      </Section>

      {/* ── Built with ───────────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>Built with</Eyebrow>
        <SectionTitle>Who backs the Studio.</SectionTitle>
        <Lede>
          The Studio is supported by partners who believe San Antonio&rsquo;s
          founder community is worth investing in.
        </Lede>
        {/*
          LOGOS, WITH A DESCRIPTOR UNDER EACH RATHER THAN THE NAME. Both marks
          are wordmarks that set their own name legibly at this size, so the
          name under them said it twice; what they don't carry is what each
          body IS, and for Bexar that the county is Bexar. See `role` on
          StudioPartner for the measurements behind that.

          HEIGHTS ARE BALANCED ON INK, and these two land on the same value —
          see `logoHeight`.
        */}
        {/*
          THE ROW IS THE TARGET WHEN THERE IS ONE, which is the convention
          `PortfolioWall` already set: the row is the thing a reader perceives
          as the organization, so the row takes the click rather than a
          three-word name. `-mx-3 px-3` lets the focus ring clear the text
          without moving the grid's alignment.

          `href` IS OPTIONAL AND AN ABSENCE IS DELIBERATE, same as over there.
          See the note on STUDIO_PARTNERS for why Jockey Ventures has none yet.

          THE HOVER CUE IS THE HAIRLINE AND A TINT, NOT AN UNDERLINE. The
          portfolio wall underlines the name, which worked while this slot
          rendered the name; it now renders a descriptor, and underlining
          "Venture studio" implies that phrase is the link. The rule takes
          Clay instead — one of the jobs the guide assigns it — over a tint
          that steps DOWN to Bone, since the portfolio wall's `bone-light`
          tint is this section's own ground and would be invisible.
        */}
        <ul className="mt-10 grid gap-x-12 gap-y-2 sm:grid-cols-2">
          {STUDIO_PARTNERS.map((partner) => {
            const mark = (
              <>
                <span className="flex h-12 items-center">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={480}
                    height={120}
                    className={cn("w-auto object-contain", partner.logoHeight)}
                  />
                </span>
                <span
                  className={cn("mt-3 block", MONO.label, "text-muted-foreground")}
                >
                  {partner.role}
                </span>
              </>
            );

            if (!partner.href) {
              return (
                <li key={partner.name} className="border-t border-border py-6">
                  {mark}
                </li>
              );
            }

            return (
              <li
                key={partner.name}
                className="group border-t border-border transition-colors hover:border-clay"
              >
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="-mx-3 block rounded-lg px-3 py-6 transition-colors group-hover:bg-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                >
                  {mark}
                </a>
              </li>
            );
          })}
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
            {/*
              THE CAVEAT BELONGS BESIDE THE BUTTON, not in the hero.

              It was in the hero's disqualifier paragraph, which the bleed
              trimmed for measure. Losing it here is worse than losing it
              there: the button under this paragraph says "Apply to the Club",
              and without the caveat a founder reads that as the route in —
              i.e. that $100 a month buys a shot at a check. It doesn't, and
              /club carries the same rule in the other direction.
            */}
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Club membership isn&rsquo;t a prerequisite, but most Studio
              relationships start there.
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

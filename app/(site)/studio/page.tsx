import type { Metadata } from "next";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  Lede,
  LINK,
  Section,
  SectionTitle,
  Subhead,
  MONO,
} from "@/components/site/section";
import { Editorial, PullQuote } from "@/components/site/editorial";
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
        eyebrow="Studio"
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

        {/*
          THE SOURCE DOC'S THREE OPENING PARAGRAPHS, VERBATIM.

          Geekdom's feedback is that the site should carry the exact copy from
          `Geekdom Website — Source Copy v1`, and this section had drifted from
          it in three ways, all introduced here rather than inherited:

            1. Paragraph 1 lost its second sentence — "The focus is on
               go-to-market, product, and getting founders connected to the
               local customers, operators, and investors who make growth
               possible" — trimmed for measure when this hero took the bleed.
               It is the only line on the page that says what the six to
               twelve months are actually spent ON.
            2. Paragraph 2 lost the Club sentence, which moved to the bottom
               of the page. The doc keeps it here, where the disqualifier is.
            3. Paragraph 3 did not exist. It is what tells a reader who is not
               getting invited that there is still a way in.

          The figures still interpolate from `STUDIO` rather than being typed,
          so a number cannot drift from the fund; the SENTENCES around them are
          the doc's. Where the doc says "our Community Fund" and the Capital
          section says "The Geekdom Community Fund", both are reproduced as
          written — that variation is the doc's, not an inconsistency to fix.
        */}
        <p className="mt-8 text-lg leading-relaxed text-bone/80">
          The Studio backs a small number of local founders each year with a{" "}
          {STUDIO.checkRange} {STUDIO.checkTerms} check from our Community Fund
          and {STUDIO.engagement} of intensive, hands-on work with our{" "}
          {STUDIO.eir.role}, {STUDIO.eir.name}. The focus is on go-to-market,
          product, and getting founders connected to the local customers,
          operators, and investors who make growth possible.
        </p>

        <p className="mt-5 text-lg leading-relaxed text-bone">
          There&rsquo;s no open application and no cohorts. Founders are
          scouted and invited. Club membership isn&rsquo;t a prerequisite, but
          most Studio relationships start there.
        </p>

        <p className="mt-5 text-lg leading-relaxed text-bone/80">
          Beyond the portfolio, the Studio also runs open programming
          throughout the year — Office Hours, Startup Bootcamp, and select
          workshops — for the broader community.
        </p>
      </TypeHero>

      {/*
        THE TERMS BAND CAME OUT, and it was mine rather than the doc's.

        It lifted the check size, the terms, the engagement length and the
        founders-a-year out of the opening paragraph and set them as six
        scannable rows. That read well and it is not what `Source Copy v1`
        says: those facts live in the opening paragraph, and "Pre-seed" and
        "At least $500 MRR" live in the "Who we invest in" list further down.
        Restoring paragraph 1 in full puts them back where the doc has them,
        and a band that restates them is the same figures twice.
      */}

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

            {/*
              ⚠️ THE PLACEHOLDER PULL QUOTE IS BACK, AND IT IS STILL A
              PLACEHOLDER.

              I deleted it, on the reasoning that `data/mock/voices.ts` had
              already settled that a fabricated sentence under a real person's
              name should not ship. `Source Copy v1` carries it — "Pull quote
              is a placeholder. Get a real one from Brian before launch." —
              and Geekdom's instruction is that the site follows the doc, so
              deleting it was a decision that was not mine to make.

              THE FLAG IS THE POINT. The doc says replace it before launch, so
              the job is to get a real one from Brian, not to quietly remove
              the slot and let the page look finished. If it must not ship as
              his words, that is a conversation with Leslie rather than a
              silent edit — see the note in data/mock/voices.ts for the case
              against it.
            */}
            <PullQuote className="mt-8 lg:text-xl">
              Early stage startups need two things: customers and capital. I
              personally love to go after both.
            </PullQuote>
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
              THE DOC'S ROLE LINE, IN FULL. I had cut ", Geekdom Studio" on
              the grounds that the eyebrow above already said it and the
              string wrapped to two lines in a 19rem rail. `Source Copy v1`
              writes it out — "Entrepreneur in Residence, Geekdom Studio" — so
              it is written out. The wrap is a layout problem to solve in the
              layout, not by editing Geekdom's copy.
            */}
            <p className={cn("mt-5", MONO.label, "text-muted-foreground")}>
              {STUDIO.eir.role}, Geekdom Studio
            </p>
          </div>
        </div>
      </Section>

      {/* ── Who we invest in ─────────────────────────────────────────── */}
      <Section tone="bone">
        {/*
          NO INVENTED HEADLINE. `Source Copy v1` gives this section an Eyebrow
          and an intro and no Headline element, so "The shape of a Studio
          company." — which was written here, not by Geekdom — comes out. The
          h2 stays for document structure and carries the doc's own section
          name; it is visually hidden because the eyebrow already shows it.
        */}
        <Eyebrow>Who we invest in</Eyebrow>
        <h2 className="sr-only">Who we invest in</h2>
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
          THE "WHAT COMES WITH IT" LIST CAME OUT. It itemized the paragraph
          above into five rows — go-to-market, product, local customers,
          operators, investors — which is a reshaping of the doc's sentence
          rather than the doc's copy. `Source Copy v1` writes it as prose:
          "The value is in what comes with it: Brian's time, the network, and
          the local corporate, operator, and investor relationships that make
          the next round possible." That sentence is above, verbatim.

          The same five things now sit where the doc puts them — in the
          opening paragraph's "The focus is on go-to-market, product, and
          getting founders connected to the local customers, operators, and
          investors who make growth possible."
        */}
      </Section>

      {/* ── Studio companies ─────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>Studio Companies</Eyebrow>
        <h2 className="sr-only">Studio Companies</h2>

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
        <h2 className="sr-only">Open programming</h2>
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
        <h2 className="sr-only">Built with</h2>
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
        <h2 className="sr-only">How to get involved</h2>

        {/*
          NOT TWO COLUMNS, BECAUSE THEY ARE NOT TWO EQUAL DOORS.

          This was `lg:grid-cols-2` with a door in each, and the layout argued
          against the heading above it. The founder side carries two
          paragraphs, a red primary CTA, a secondary and a mailto line; the
          corporate side carried one sentence and a lone outline button, which
          landed 40px above the founder buttons because the column above it is
          shorter. Side by side that reads as an afterthought someone parked
          in the spare column — "both real" undercut by its own grid.

          MAKING THEM MATCH WOULD BE THE WRONG FIX. This is a page for
          founders; a corporate partner is a second, smaller audience, and
          giving that ask equal visual weight — or a dark panel, which on a
          Bone section would make it the loudest thing here — overstates it in
          the other direction.

          SO THE FOUNDER PATH RUNS AT A READING MEASURE and the corporate ask
          gets a FRAME rather than a column: full width, hairline-bordered,
          the copy and the button on one baseline. It is contained and
          deliberate instead of stray, it sits after the primary path rather
          than beside it, and there is no second column left for its button to
          fail to line up with.
        */}
        <div className="mt-14 max-w-2xl">
          <Subhead>If you&rsquo;re a founder</Subhead>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            The Studio isn&rsquo;t something you apply to directly. We scout
            founders and companies to be invited in. The best Studio
            investments start as relationships.
          </p>
          {/*
            THE CAVEAT BELONGS BESIDE THE BUTTON, not in the hero.

            It was in the hero's disqualifier paragraph, which the bleed
            trimmed for measure. Losing it here is worse than losing it there:
            the button under this paragraph says "Apply to the Club", and
            without the caveat a founder reads that as the route in — i.e.
            that $100 a month buys a shot at a check. It doesn't, and /club
            carries the same rule in the other direction.
          */}
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Club membership isn&rsquo;t a prerequisite, but most Studio
            relationships start there.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/apply">Apply to the Club</ButtonLink>
            <ButtonAnchor external href={LUMA_CALENDAR_URL} variant="outline">
              See upcoming events
            </ButtonAnchor>
          </div>
          <p className="mt-6 text-muted-foreground">
            Or introduce yourself — send your deck to{" "}
            <a href={`mailto:${STUDIO.email}`} className={LINK}>
              {STUDIO.email}
            </a>
            .
          </p>
        </div>

        {/*
          Bone Light on a Bone section — a step UP, which is the direction the
          two tones are built to travel. The hairline is what separates them;
          six points of luminance on their own would not.

          `items-center` rather than a bottom-aligned CTA: there is only one
          button here and one block of copy, so the button belongs on the
          copy's optical centre. That is also what makes it impossible for
          this to drift out of alignment again — nothing else is being aligned
          to.
        */}
        <div className="mt-12 rounded-xl border border-border bg-bone-light p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
            <div>
              <Subhead>If you&rsquo;re a corporate partner</Subhead>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                We work with a small number of corporate partners each year to
                support Studio companies with pilots, talent access, and
                follow-on introductions. If that sounds like a fit, we&rsquo;d
                like to talk.
              </p>
            </div>
            {/*
              "Contact us → /contact" is the doc's link for this block. It had
              been a mailto because /contact did not exist; it does now.
            */}
            <ButtonLink href="/contact" variant="outline" className="shrink-0">
              Contact us
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}

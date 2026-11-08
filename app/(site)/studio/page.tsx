import type { Metadata } from "next";
import { getSiteCopy } from "@/lib/content/site-copy";
import Image from "next/image";
import { pageMetadata } from "@/lib/seo";
import { ArrowUpRight } from "lucide-react";
import {
  Eyebrow,
  Lede,
  LINK,
  Section,
  SectionTitle,
  Subhead,
  MONO,
  ARROW,
  LINK_ARROW,
} from "@/components/site/section";
import { Editorial, PullQuote } from "@/components/site/editorial";
import { MemberVoices } from "@/components/site/member-voices";
import { SpreadHero } from "@/components/site/spread-hero";
import { PortfolioWall } from "@/components/site/portfolio-wall";
import { getPortfolio } from "@/lib/content/portfolio";
import { VideoCard } from "@/components/site/video-card";
import { StudioFilmJsonLd } from "@/components/site/structured-data";
import { Photo } from "@/components/site/photo";
import { InquiryButton } from "@/components/forms/inquiry-form";
import { PHOTOS } from "@/lib/photos";
import { MOCK_FOUNDER_VOICES } from "@/data/mock/voices";
import {
  STUDIO,
  STUDIO_PARTNERS,
  STUDIO_FILM,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Studio",
  path: "/studio",
  // Under 160 characters — it ran to 244, and Google cut it before the
  // disqualifier, which is the half that saves a founder a wasted click.
  description: `Geekdom's venture layer: ${STUDIO.checkRange} ${STUDIO.checkTerms} checks and hands-on work for ${STUDIO.foundersPerYear} San Antonio founders a year. Not an accelerator. No open application.`,
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
export default async function StudioPage() {
  // The words Geekdom edits in the admin (Site content → Site copy).
  const [companies, t] = await Promise.all([getPortfolio(), getSiteCopy()]);
  return (
    <>
      {/*
        THE SAME SPREAD AS /club: headline and the source copy's Fraunces
        tagline on Bone, the photograph full-bleed beneath, no gradient.
        Geekdom rejected the dark ramp-over-photograph hero on /club as "too
        basic, not editorial enough", and this page ran the identical
        treatment. The three opening paragraphs that sat over the photograph
        move to the section below it, verbatim.

        `openlaneTeam` — a backed company's founders at their own whiteboard,
        now black and white under the brand grade (a founder spotlight).
      */}
      <SpreadHero
        eyebrow={t("studio.hero.eyebrow")}
        title={t("studio.hero.headline")}
        photo={PHOTOS.openlaneTeam}
        objectPosition="object-[50%_30%]"
      >
        {/*
          The source copy marks this line "Fraunces italic" explicitly — it
          is the Studio's whole argument in six words.
        */}
        <Editorial className="text-2xl leading-[1.45] text-graphite sm:text-3xl">
{t("studio.hero.tagline")}
        </Editorial>
      </SpreadHero>

      {/*
        THE OPENING: a lede, then two body paragraphs — the same typographic
        transition out of the photograph that /club uses. The lede is
        Geekdom's rewrite ("Geekdom Studio is where we back…"), replacing the
        source copy's figure-heavy first paragraph; the check size, the
        engagement length and Brian's name are carried by the Capital and EIR
        sections below.

        ⚠️ PENDING GEEKDOM: "Club membership isn't a prerequisite, but most
        Studio relationships start there." is their own source copy, and it
        reads as the Club-to-Studio pathway they have since said never to
        imply. Left as written until they rule on it.
      */}
      <Section tone="bone">
        <h2 className="sr-only">Opening</h2>
        <div className="max-w-3xl">
          {/* Geekdom's wording, verbatim. */}
          <p className="text-2xl leading-snug text-graphite sm:text-[1.75rem]">
{t("studio.opening.lede")}
          </p>
          {/* Geekdom's addition, verbatim. */}
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
{t("studio.opening.p1")}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("studio.opening.p2")}
          </p>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t("studio.opening.p3")}
          </p>
        </div>
      </Section>

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
        <div className="grid gap-12 lg:grid-cols-[28rem_minmax(0,34rem)] lg:gap-16">
          <div>
            <Eyebrow>{t("studio.eir.eyebrow")}</Eyebrow>
            <SectionTitle>{STUDIO.eir.name}</SectionTitle>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
              {t("studio.eir.p1")}
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t("studio.eir.p2")}
            </p>

            {/*
              BRIAN'S QUOTE, VERBATIM — the real one, sent by Geekdom. The
              source copy carried a placeholder here ("Get a real one from
              Brian before launch"); this replaces it.
            */}
            <PullQuote className="mt-8 lg:text-xl">
              {t("studio.eir.quote")}
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
            {/*
              BRIAN AT WORK, NOT A HEADSHOT — Geekdom's call. `brianWhiteboard`
              shows what the Studio sells (his hands-on time with a founder);
              the studio portrait it replaced showed who he is. Landscape 3:2,
              so the rail widened from 19rem to 28rem: at 448px the camera
              original (1200px) still covers 2x, which is the most this frame
              can carry sharply — see AGENTS.md on this photograph.
            */}
            <Photo
              photo={PHOTOS.brianWhiteboard}
              aspect="aspect-[3/2]"
              sizes="(min-width: 1024px) 448px, 90vw"
              className="max-w-[28rem]"
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
        <Eyebrow>{t("studio.invest.eyebrow")}</Eyebrow>
        <h2 className="sr-only">Who we invest in</h2>
        <Lede>
          {t("studio.invest.lede")}
        </Lede>

        {/*
          Hairline-ruled rows rather than bullets — the same list idiom the
          Club page uses, so the two engines read as one site. Criteria are
          quoted exactly: "$500 MRR, average entry $7K" is a floor and a
          typical, and collapsing it to either one changes what it says.
        */}
        <ul className="mt-12 grid gap-x-12 sm:grid-cols-2">
          {t.list("studio.invest.criteria").map((criterion) => (
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
            <Eyebrow onInk>{t("studio.capital.eyebrow")}</Eyebrow>
            {/* Geekdom's wording, verbatim. */}
            <SectionTitle className="text-bone">
{t("studio.capital.title")}
            </SectionTitle>
          </div>
          <div className="flex flex-col gap-6">
            {/* Geekdom's wording, verbatim. */}
            <p className="text-lg leading-relaxed text-bone/70">
              {t("studio.capital.p1")}
            </p>
            <p className="text-lg leading-relaxed text-bone/70">
              {t("studio.capital.p2")}
            </p>
          </div>
        </div>

        {/*
          CAPITAL IS GEEKDOM'S COPY: "The check is just the starting point."
          and the two paragraphs beside it. An itemized "what comes with it"
          list sat here once and came out; the focus areas now live in the
          opening ("The focus is on go-to-market, product…").
        */}
      </Section>

      {/* ── Studio companies ─────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>{t("studio.companies.eyebrow")}</Eyebrow>
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
        <PortfolioWall companies={companies} studioOnly className="mt-14" />

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
        <Eyebrow>{t("studio.open.eyebrow")}</Eyebrow>
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
              {t("studio.open.p1")}
            </Lede>
            {/* The last two sentences ("The application tells us who you
                are…" / "Studio invitations get made from there.") came off at
                Geekdom's request. */}
            <Lede className="mt-5">
              {t("studio.open.p2")}
            </Lede>
          </div>

          {/*
            NO CAPTION — Geekdom has asked for photographs without them. The
            alt text still names who is speaking, for anyone who needs it.
          */}
          <Photo
            photo={PHOTOS.workshopWednesday}
            aspect="aspect-video"
            sizes="(min-width: 1024px) 490px, 100vw"
          />
        </div>
      </Section>

      {/* ── Built with ───────────────────────────────────────────────── */}
      <Section tone="bone-light">
        <Eyebrow>{t("studio.partners.eyebrow")}</Eyebrow>
        <h2 className="sr-only">Built with</h2>
        <Lede>
          {t("studio.partners.lede")}
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
                  className="-mx-3 block px-3 py-6 transition-colors group-hover:bg-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
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
        <Eyebrow>{t("studio.involved.eyebrow")}</Eyebrow>
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
          <Subhead>{t("studio.founder.title")}</Subhead>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {t("studio.founder.p1")}
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
{t("studio.founder.p2")}
          </p>
          {/*
            NO "APPLY TO THE CLUB" HERE. A red Apply-to-the-Club button under
            "If you're a founder" on the Studio page is the Club-to-Studio
            pathway in one control, and Geekdom has said never to imply one.
            What's left is a link, not a button — buttons are for Apply.
          */}
          <a
            href={LUMA_CALENDAR_URL}
            target="_blank"
            rel="noreferrer noopener"
            className={cn("mt-8 inline-flex", LINK_ARROW)}
          >
            {t("studio.founder.link")}
            <ArrowUpRight aria-hidden="true" className={ARROW.external} />
          </a>
          {/*
            AN EMAIL, NOT A FORM, on purpose. The Studio has no open
            application, and a step-by-step Typeform under "If you're a
            founder" would read as one whatever it was titled. An introduction
            to a person is how these relationships start. The subject is
            prefilled so introductions are easy to spot at studio@. (A second
            line asking for what you're building and MRR was tried and cut —
            it made the block busy, and the criteria are right above it.)
          */}
          <p className="mt-6 text-muted-foreground">
            {t("studio.founder.deck")}{" "}
            <a
              href={`mailto:${STUDIO.email}?subject=${encodeURIComponent("Introduction — [your company]")}`}
              className={LINK}
            >
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
        <div className="mt-12 border border-border bg-bone-light p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
            <div>
              <Subhead>{t("studio.partner.title")}</Subhead>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                {t("studio.partner.body")}
              </p>
            </div>
            {/*
              OUR OWN PARTNER FORM, in a slide-out; requests are reviewed at
              /portal/admin/requests (lib/inquiries.ts).
            */}
            <div className="shrink-0">
              <InquiryButton kind="partner" label={t("studio.partner.cta")} />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

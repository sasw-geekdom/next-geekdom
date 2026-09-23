import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { MembershipJsonLd } from "@/components/site/structured-data";
import { ArrowUpRight, Check, Minus, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Eyebrow,
  Section,
  SectionTitle,
  Subhead,
  HEADING,
  MONO,
  ARROW,
  LINK_ARROW,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { Photo } from "@/components/site/photo";
import { SpreadHero } from "@/components/site/spread-hero";
import { PHOTOS } from "@/lib/photos";
import {
  BENEFITS,
  NOT_INCLUDED,
  priceLabel,
  priceSentence,
  EXTRAS,
  GENEROSITY_BAR,
  GOOD_FIT,
  NOT_FIT,
  NOT_FIT_CLOSING,
} from "@/lib/membership";
import {
  CLUB,
  LOCATION,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { cn } from "@/lib/utils";

// No price in the search snippet — see SITE_DESCRIPTION in lib/seo.ts.
export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "The Club",
  path: "/club",
  description:
    "Geekdom's members' club for founders and builders in San Antonio: the third floor, the programming, and the people in it. Not coworking. Not an accelerator.",
});

/**
 * THE CLUB — one of the two engines the nav now names.
 *
 * This page was /membership. It is the same page with the same job, renamed
 * and widened: "membership" is the transaction, and the Club is the thing
 * being bought. The source copy's IA names it /club, the nav points there, and
 * /membership now redirects (see next.config.ts) so nothing that already links
 * to it breaks.
 *
 * WHAT MOVED IN with the rename — all of it from Geekdom's source copy (v1):
 *   - the header, which now says what the Club IS before what it costs
 *   - "It's not coworking. It's not an accelerator." said in the first screen,
 *     because it is the assumption most visitors arrive with
 *   - the clubhouse section, which absorbed /the-floor when that page
 *     was retired (see the note on the section itself)
 *   - "Who the Club is for", in two columns, INCLUDING who it isn't for
 *
 * THE PRICE DOES NOT LEAD. It used to anchor the hero at FIGURE.lg, on the
 * argument that this page's job is conversion and the fee is the last
 * objection. That was wrong for a club: leading with the number makes this a
 * pricing page, and a pricing page invites one question — is it worth $100? —
 * before the reader has anything to weigh it against.
 *
 * The order is now Geekdom's own, from the source copy: the rhythm, the
 * clubhouse, who's in the room, who it's for, and only then membership. By the
 * time the figure appears it is the answer to a question the reader is already
 * holding rather than the opening bid.
 */

/*
  `MODES` IS GONE. It held three invented captions — Think it through, Build
  it, Put it in front of people — for a grid that stood where the doc's "A
  month in the Club" section goes. Removed with that section; see the note
  there. The photographs are still in lib/photos.ts.
*/


export default function ClubPage() {
  // null while pricing is unannounced — see lib/membership.ts. The page reads
  // correctly either way rather than shipping a placeholder number.
  const price = priceLabel();

  return (
    <>
      {/*
        The price, as an Offer. This is the one page on the site with a number
        that a search engine can show next to the link, and a membership listed
        without one invites the "contact for pricing" reading that the whole
        page exists to refuse.
      */}
      <MembershipJsonLd />

      {/*
        THE HERO IS A SPREAD: the source copy's eyebrow and headline at display
        size on Bone, the photograph full-bleed beneath, no gradient. Geekdom
        found the gradient band before it "too basic, not editorial enough";
        SpreadHero records what was tried and why this won.

        NO PRICE HERE, deliberately. Leading with the fee makes the page a
        pricing page — "is it worth $100?" before the reader has anything to
        weigh — so the figure lives in the Membership section, eighth of nine,
        where the source copy puts it.

        `makeAPoint`: someone mid-sentence with people listening at close
        range, which is the claim rather than an illustration of it, and a
        different set of faces from the homepage hero. Anchored at 35% down so
        the crop keeps the back row's heads and the speaker's hands.
      */}
      <SpreadHero
        eyebrow="The Club · Members only"
        photo={PHOTOS.makeAPoint}
        objectPosition="object-[60%_35%]"
        title={
          <>
            Where {"San\u00A0Antonio\u2019s"} founders and builders find their
            room.
          </>
        }
      />

      {/*
        THE DOC SPLITS THE HEADER FROM THE OPENING, and this page did not.

        `Source Copy v1` gives /club a "Page header" of an eyebrow and a
        headline and nothing else, then a separate "Opening" section of three
        paragraphs. The hero carried all of it, which put five blocks of copy
        over a photograph and made the fold do the job of two sections.

        The three paragraphs below are the doc's, verbatim, and they are not
        the three the hero used to show: those were `claim` / `who` / `isnt`,
        shared with the homepage's Club section. The doc writes the two
        placements differently on purpose — see CLUB and CLUB_HOME in
        lib/site.ts.
      */}
      {/*
        THE TRANSITION OUT OF THE HERO IS TYPOGRAPHIC. The photograph ends on
        a clean edge and the first paragraph picks up as a lede — larger,
        Graphite — before the other two drop to body size, so the eye steps
        down photograph → lede → body instead of hitting a wall of grey text.

        Two things were tried and taken out: a gradient (Geekdom rules those
        out) and a Bone panel pulled up over the photograph's lower edge,
        which Geekdom didn't like cutting into the picture. Keep the image
        whole.

        The three paragraphs are the source copy's Opening, verbatim.
      */}
      <Section tone="bone">
        <h2 className="sr-only">Opening</h2>
        <div className="max-w-3xl">
          {CLUB.opening.map((para, i) => (
            <p
              key={para}
              className={cn(
                i === 0
                  ? "text-2xl leading-snug text-graphite sm:text-[1.75rem]"
                  : "mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground",
                i === 1 && "mt-8",
              )}
            >
              {para}
            </p>
          ))}
        </div>
      </Section>



      {/* ── Who the Club is for ──────────────────────────────────────── */}

      {/* ── A month in the Club ──────────────────────────────────────── */}
      {/*
        MOVED HERE FROM THE HOMEPAGE, where it was one of seven club-only
        sections on a page that is supposed to introduce the whole of Geekdom.
        It is a good section and it belongs to the Club — this is what a
        membership actually feels like week to week, which is the question
        somebody reads this page to answer.

        Three modes in the order a problem actually moves through them: you
        think it through, you build it, you put it in front of people who will
        tell you the truth.
      */}
      <Section tone="bone-light">
        {/*
          "A MONTH IN THE CLUB", AS THE DOC WRITES IT.

          This section was an invented one standing in the doc's slot. It ran
          under "Break the problem down together." with a three-up grid —
          Think it through / Build it / Put it in front of people — none of
          which appears in `Source Copy v1`. The doc's version is an eyebrow,
          three paragraphs, and a note asking for one full-width third-floor
          photograph after them.

          ⚠️ THE THREE MODE PHOTOGRAPHS AND THEIR CAPTIONS ARE GONE WITH IT.
          `MODES` is no longer rendered anywhere. The frames are still in
          lib/photos.ts and the copy is in this file's history if Geekdom
          wants that treatment back — but it was written here rather than by
          them, which is the thing the feedback is about.

          The second paragraph names a real recurring event with a real time,
          so it is transcribed rather than paraphrased: Creme Coffee and
          Social, Tuesdays 8 to 9:30.
        */}
        <Eyebrow>The rhythm</Eyebrow>
        <h2 className="sr-only">A month in the Club</h2>
        <div className="max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground">
            The Club runs on a monthly rhythm of programming — socials,
            meetups, office hours, build sessions — plus special events open to
            members first.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Every Tuesday, Open Coffee Club meets at Creme Coffee and Social
            from 8 to 9:30. Public, free, no agenda. Just founders and builders
            finding each other over coffee.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Beyond the space, we&rsquo;re building the online layer too: a
            member Slack, a directory, and a portal so the community keeps
            working when you&rsquo;re not in the building.
          </p>
        </div>

        {/*
          The doc's note for this section: "Full-width placeholder image from
          the third floor after this section." One frame, not three.
        */}
        <Photo
          photo={PHOTOS.theFloorWide}
          aspect="aspect-[16/7]"
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="mt-12"
        />
      </Section>

      {/* ── Who the Club is for ──────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Who the Club is for</Eyebrow>
        {/*
          THIS SECTION HAD NO HEADING AT ALL. It opened on an eyebrow and went
          straight to the Fraunces line, so in the document outline its two
          subheads — "A good fit" and "Not the right fit right now" — filed
          themselves under "Builders of all breeds.", the section BEFORE it.
          Anyone navigating by heading skipped the whole filter.

          It also names the job the previous section does not. "Who's in the
          room" is the roster; this is the bar. Two eyebrows that both start
          "Who…" were doing nothing to tell them apart.
        */}
        <SectionTitle>The bar is generosity.</SectionTitle>
        <Editorial
          as="p"
          className="mt-5 max-w-3xl text-3xl leading-[1.3] text-graphite sm:text-4xl"
        >
          {GENEROSITY_BAR}
        </Editorial>
        {/*
          BOTH PARAGRAPHS ARE THE DOC'S NOW, VERBATIM, and they come from two
          different sections of it.

          `Source Copy v1` has "Who's in the room" (the roster) and "WHO THE
          CLUB IS FOR" (the bar) as separate sections. This page merged them
          — a deliberate call made with Jesse earlier, because two eyebrows
          both starting "Who…" were not telling the reader them apart. The
          COPY had been paraphrased in the merge: "engineers, tinkerers,
          investors, students, senior operators" dropped founders and tech
          workers, and "a give-first habit" rewrote "we lean into a give first
          culture".

          ⚠️ THE MERGE ITSELF IS STILL A DEPARTURE FROM THE DOC. Flagged for
          Leslie rather than reversed here, since splitting them back is
          undoing a decision that was made on purpose and for a stated reason.

          The first line below is the doc's intro line for "WHO THE CLUB IS
          FOR", minus its opening two sentences, which `GENEROSITY_BAR` sets
          in Fraunces directly above.
        */}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          We&rsquo;re looking for people who show up for the community, not
          just for themselves.
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Our members are eclectic. Engineers, tinkerers, founders, investors,
          tech workers, students, senior operators—builders of all breeds. We
          lean into a give first culture where everyone is willing to help the
          person next to them. We show up with curiosity, ambition, and a
          belief that no good idea gets built alone.
        </p>

      {/*
        NO PHOTO ROW HERE. A three-up of event photographs sat between the
        intro and the fit lists; it went when Geekdom asked for a site that
        doesn't feel photo-heavy. /club now carries three photographs: the
        hero, the rhythm's full-width frame (which the source copy asks for),
        and the clubhouse.
      */}

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className={cn(MONO.label, "text-muted-foreground")}>
              A good fit
            </h3>
            <ul className="mt-5">
              {GOOD_FIT.map((item) => (
                <li
                  key={item}
                  className="border-t border-border py-4 text-lg leading-snug text-graphite"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className={cn(MONO.label, "text-muted-foreground")}>
              Not the right fit right now
            </h3>
            {/*
              "RIGHT NOW" IS LOAD-BEARING and is the source copy's own wording.
              It makes this a statement about timing rather than about the
              person — a small business owner today may be a founder in two
              years, and the door should still read as open to them.
            */}
            <ul className="mt-5">
              {NOT_FIT.map((item) => (
                <li
                  key={item}
                  className="border-t border-border py-4 text-lg leading-snug text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 leading-relaxed text-muted-foreground">
              {NOT_FIT_CLOSING}
            </p>
          </div>
        </div>
      </Section>

      {/* ── The clubhouse ────────────────────────────────────────────── */}
      {/*
        THE FLOOR, ABSORBED. This used to be a summary with a door to
        /the-floor; that page is gone and 308s here.

        Why it went: half of it duplicated this page. It rendered BENEFITS a
        third time under "What's in the room", and its rhythm section repeated
        what /events already says. What was genuinely only there was the
        photography and the wayfinding, and both are now here — which is a
        straight upgrade, because this section used to be one photograph and a
        lot of assertion.

        A STANDALONE PAGE ABOUT THE FLOOR WAS ALSO THE WRONG ARGUMENT. "Look at
        our space" is how a coworking company sells, and the whole 2026
        position is that the desk was never the point. The room matters as part
        of what membership is, not as a thing to tour.

        THE FRAMES ARE THE PLACE, not decoration. Three photographs, three
        parts of the floor: the floor itself as the lead, then the cafe and the
        window banquettes. The copy claims a room; these show it.

        NO WAYFINDING HERE. The address, the Maps link and the elevator line
        sat on this page as a stopgap until /contact existed; they live there
        now. The membership card keeps the one-line address.
      */}
      <Section tone="bone-light">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Eyebrow>The clubhouse</Eyebrow>
            <SectionTitle>
              The third floor is where the Club lives.
            </SectionTitle>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              A place you come to do your best thinking, have your most
              important conversations, and be around people who raise your
              game — in the historic {LOCATION.building} downtown, where San
              Antonio builders have been gathering for over a decade.
            </p>

            {/* A link, not a button — Geekdom keeps buttons for Apply. */}
            <div className="mt-8">
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noreferrer noopener"
                className={LINK_ARROW}
              >
                Browse the calendar
                <ArrowUpRight aria-hidden="true" className={ARROW.external} />
              </a>
            </div>
          </div>

          {/*
            ONE FRAME, NO CAPTION. This column held the floor as a lead plus
            two captioned portrait tiles; Geekdom asked for fewer photographs
            and no captions. `theCafe` rather than `theFloor`, because
            `theFloor` is the same moment as the rhythm section's
            `theFloorWide` a screen above — the two would have been two of the
            page's three photographs.
          */}
          <Photo
            photo={PHOTOS.theCafe}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 544px, 100vw"
          />
        </div>

      </Section>

      {/* ── Membership ───────────────────────────────────────────────── */}
      {/*
        THE PRICE IS IN THE CARD, NOT THE HEADLINE. The source copy's headline
        here is "$100 per month. Application-based.", and for a while the
        number ran at SectionTitle size — the largest rendering of the price
        on the site. Geekdom has since asked that nothing on the site feel
        salesy or pushy, so the headline keeps only "Application-based." and
        the figure sits at the top of the card, one quiet line above "Billed
        monthly", where it answers a question the reader is already asking.

        Built from `priceSentence()` and never typed — a literal would drift
        from Stripe silently.
      */}
      {/*
        BONE, NOT BONE-LIGHT. Moving "The bar is generosity" above the
        clubhouse left two bone sections touching — six points of luminance
        between them, which reads as one long section. Flipping this one
        restores the alternation for the whole rest of the page rather than
        just patching the seam.
      */}
      <Section tone="bone">
        <Eyebrow>Membership</Eyebrow>
        <SectionTitle>Application-based.</SectionTitle>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          {/* What you get */}
          <div>
            <Subhead>What&rsquo;s included</Subhead>
            {/*
              TITLES ONLY. Each benefit carried a sentence or two of
              description — about 360 words for the section — and Geekdom's
              note on the portfolio applies here too: too text-heavy, remove
              the descriptions. They stay in `BENEFITS` (/llms.txt still reads
              them); this list just doesn't render them.
            */}
            <ul className="mt-8 grid border-b border-border sm:grid-cols-2 sm:gap-x-10">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit.title}
                  className="flex items-center gap-3 border-t border-border py-4"
                >
                  <Check
                    className="h-4 w-4 shrink-0 text-clay"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="text-lg leading-snug text-graphite">
                    {benefit.title}
                  </span>
                </li>
              ))}
            </ul>

<Subhead className="mt-14">What it isn&rsquo;t</Subhead>
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

            {/*
              The doc's closing line for this section, in its place — after
              the includes list, not before it. It used to be folded into a
              lede above the list alongside three sentences that were written
              here rather than by Geekdom.
            */}
            <p className="mt-10 text-lg leading-relaxed text-muted-foreground">
              The application takes about ten minutes. We respond within two
              weeks.
            </p>
          </div>

          {/* Price / apply card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-border bg-bone p-7">
              <p className={cn(MONO.eyebrow, "text-concrete")}>Geekdom Club</p>

              {price ? (
                <>
                  <p
                    className={cn(
                      "mt-4 tabular-nums",
                      HEADING.subhead,
                      "text-graphite",
                    )}
                  >
                    {priceSentence()}
                  </p>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    Billed monthly. Nothing is charged until you&rsquo;re
                    accepted, and you can cancel any time.
                  </p>
                </>
              ) : (
                <>
                  <p className={cn("mt-4", HEADING.item, "text-graphite")}>
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
                <p className="font-medium text-graphite">{LOCATION.line1}</p>
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
      {/*
        "THE OTHER ENGINE" IS GONE. It ran "One is the on-ramp. The other is
        where it leads." — the Club-to-Studio pathway Geekdom said never to
        imply. The Studio is in the nav and beside the Club on the homepage;
        this page doesn't need to route anyone to it.
      */}

      {/*
        "WHAT HAPPENS NEXT — Three steps, no negotiation." IS GONE, at
        Geekdom's request. "No negotiation" read pushy, and its three steps
        repeated the membership card (a person reads it, two weeks, nothing
        charged until accepted). The Club's opening date it carried is on
        /faq.
      */}

      {/*
        "ALREADY A MEMBER — Manage your membership." IS OFF until billing is
        live. It linked to /account; that route still exists, it just isn't
        promoted here. Put the section back when members can actually use it.
      */}
    </>
  );
}

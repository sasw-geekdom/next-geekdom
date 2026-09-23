import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { MembershipJsonLd } from "@/components/site/structured-data";
import { Check, Minus, Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import {
  Eyebrow,
  Section,
  SectionTitle,
  Subhead,
  HEADING,
  MONO,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { Photo } from "@/components/site/photo";
import { ButtonAnchor } from "@/components/ui/button";
import { ClubHero } from "@/components/site/club-hero";
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
  STUDIO,
  LOCATION,
  CLUB_OPENS,
  OPEN_COFFEE,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Built from priceLabel() so the search snippet can't drift from Stripe — see
// the note in app/layout.tsx.
export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "The Club",
  path: "/club",
  description: `Geekdom's members' club for serious founders and builders in San Antonio${
    priceLabel() ? `, ${priceLabel()}` : ""
  }. The third floor, the programming, and a room full of people who'll break the problem down with you. Not coworking. Not an accelerator.`,
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
        ClubHero records what was tried and why this won.

        NO PRICE HERE, deliberately. Leading with the fee makes the page a
        pricing page — "is it worth $100?" before the reader has anything to
        weigh — so the figure lives in the Membership section, eighth of nine,
        where the source copy puts it.

        `makeAPoint`: someone mid-sentence with people listening at close
        range, which is the claim rather than an illustration of it, and a
        different set of faces from the homepage hero. Anchored at 35% down so
        the crop keeps the back row's heads and the speaker's hands.
      */}
      <ClubHero
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

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {/*
          `pysaTalk` took this tile when `makeAPoint` went to the hero, and
          it is the right shape for the slot rather than a stand-in: the two
          frames beside it are both ROOMS, and a third room at 341px makes
          the row one texture. This is people at close range — two speakers,
          an audience in the foreground — which is what "all breeds" is
          actually claiming.
        */}
        <Photo
          photo={PHOTOS.pysaTalk}
          aspect="aspect-[3/2]"
          sizes="(min-width: 640px) 341px, 100vw"
        />
        {/*
          `fullHouse` took this slot when `speaking` went to the homepage's
          Club section, where it had to carry a 584px frame on its own. It
          is the better trade in both directions: this is a three-up of small
          tiles under "Builders of all breeds", and a packed room reads as a
          crowd here without needing any single face to be legible.
        */}
        {/*
          `fullHouse` LEFT THIS TILE BECAUSE OF WHO IS IN IT. The man
          applauding centre-right is the man on the right of the homepage
          hero, and at 341px he is legible rather than incidental — so the
          same face was appearing on the two biggest pages on the site for no
          reason anyone chose.

          He is now in exactly one frame across the whole site: the homepage
          hero, where he is meant to be.

          `pysaTables` replaces him on merit as well as by elimination. It is
          the only EVENING photograph in the library, and the two tiles
          beside it are both daylight — in a row of three it is the one that
          does not blend into its neighbours.
        */}
        {/*
          `fireside` REPLACED `pysaTables` BECAUSE OF A SHARED FACE. Both pysa
          frames come from the same evening meetup, so they share a room and
          they share people — the person with long dreadlocks is in the
          foreground of both, and they sat in adjacent tiles.

          Two frames from one event will always do this. The risk was noted
          about the morehumanthanhuman archive and then not applied here, which
          is why this row needed a third EVENT rather than a third photograph.

          It also suits the section better than a packed room does: two
          speakers laughing with members watching from close by is what a
          give-first culture looks like.
        */}
        <Photo
          photo={PHOTOS.fireside}
          aspect="aspect-[3/2]"
          sizes="(min-width: 640px) 341px, 100vw"
        />
        {/*
          `welcomeHero`, and the reason this slot has now changed twice is
          worth writing down: it keeps colliding with the homepage.

          It held `theRoom` while the homepage's Club section did, then
          `conversation` — which was free at the time and is now the
          homepage's full-bleed HERO. That made the collision worse than the
          one the swap was meant to fix: a reader clicking "Explore the Club"
          met the same two men, at 341px, one screen after meeting them at
          full width.

          `welcomeHero` had never been placed anywhere. Two members greeting
          each other with a room applauding around them is the most literal
          "builders of all breeds" frame in the library, and nothing else
          competes for it.

          THE BLACK-AND-WHITE QUOTA STILL NEEDS ANSWERING. The 2026 guide
          asks for roughly 30% of the photography in black and white,
          "reserved for editorial gravity". `conversation` was carrying that
          here; it now carries it on the homepage hero instead, which is a
          more prominent home for it but leaves this page without one. Worth
          a look when the /club photography gets its own pass.

          It is also the library's only BLACK AND WHITE frame, and it had
          never been placed. The 2026 guide asks for roughly 30% of the
          photography in black and white, "reserved for editorial gravity —
          member spotlights, ceremonial moments"; two people in close
          conversation, under a heading about who is in the room, is the
          closest thing on this site to a member spotlight.
        */}
        {/*
          `speaking` REPLACED `theCrowd`, AND IT WAS A FACE AGAIN. The man in
          the black coat addressing the room in `theCrowd` is the same man
          presenting in `pysaTalk`, which is tile one. Different events, same
          person, same row — the second time this row has shipped a repeat.

          THE LIBRARY IS THE REASON, and it is worth writing down. A handful of
          people recur across most of these frames: the man with the long dark
          hair is in `theCrowd` and `pysaTalk`; the grey-haired man with the
          tattooed forearm is in `conversation`, `welcomeHero`, `fullHouse` AND
          `programming`. That is why every unused frame was unusable here — all
          four carry one of the two. A three-up of people needs three EVENTS,
          and there are barely three to draw on.

          `speaking` is the third event, and it fixes something else the row
          had: tiles one and two are both men presenting. This is a woman
          leading a room, which is the only frame in the library that shows it.

          `theCrowd` went to the homepage's Club section in exchange — warmer
          there than what it replaced, and no one in it appears anywhere else
          on that page.
        */}
        <Photo
          photo={PHOTOS.speaking}
          aspect="aspect-[3/2]"
          sizes="(min-width: 640px) 341px, 100vw"
        />
      </div>

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

        WAYFINDING IS TEMPORARY HERE. The address, the Maps link and the
        elevator instruction belong on /contact, which the source copy
        specifies and nobody has built. Until then this is the only place on
        the site that tells someone how to actually get here.
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
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Every Tuesday, {OPEN_COFFEE.name} meets at {OPEN_COFFEE.where}{" "}
              from 8 to 9:30. Public, free, no agenda — just founders and
              builders finding each other over coffee. You don&rsquo;t have to
              be a member to come.
            </p>

            {/*
              The address as an <address>, not a paragraph — it is the one
              block on this page a browser, a screen reader or a phone should
              be able to recognize as contact information.
            */}
            <address className="mt-8 not-italic leading-relaxed text-muted-foreground">
              <span className="font-medium text-graphite">
                {LOCATION.building}
              </span>
              <br />
              {LOCATION.full}
              <br />
              Elevator to the {LOCATION.floor.toLowerCase()}.
            </address>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonAnchor
                external
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `Geekdom, ${LOCATION.postal}`,
                )}`}
                variant="outline"
              >
                Open in Maps
              </ButtonAnchor>
              <ButtonAnchor external href={LUMA_CALENDAR_URL} variant="ghost">
                Browse the calendar
              </ButtonAnchor>
            </div>
          </div>

          <div>
            <Photo
              photo={PHOTOS.theFloor}
              aspect="aspect-[4/3]"
              sizes="(min-width: 1024px) 544px, 100vw"
            />
          <ul className="mt-4 grid grid-cols-2 gap-4">
            {[
              // Captions name WHERE YOU ARE, not what you get. See the note above.
              { photo: PHOTOS.theCafe, caption: "The cafe" },
              { photo: PHOTOS.dropIn, caption: "By the windows" },
            ].map((frame) => (
              <li key={frame.caption}>
                <Photo
                  photo={frame.photo}
                  aspect="aspect-[4/5]"
                  sizes="(min-width: 1024px) 256px, 50vw"
                />
                {/*
                  Editorial captions, which the brand guide asks for by name in
                  its website section and which the site had nowhere.
                */}
                <p className={cn("mt-3", MONO.label, "text-muted-foreground")}>
                  {frame.caption}
                </p>
              </li>
            ))}
          </ul>
          </div>
        </div>

        {/*
          THE GRID SHOWS THE ROOM, WHICH IS THE SECTION'S ONE JOB.

          It used to run four tiles captioned "The cafe", "Drop in and work",
          "Fireside chats" and "Programming, most weeks" — and two of those are
          not the room at all. Their own alt text gives them away: `fireside`
          is "two speakers laughing during a fireside chat" and `programming`
          is "a talk in progress". Photographs of EVENTS, in the one section
          that exists to answer WHERE.

          The captions had a second problem. Four of them were an arbitrary
          subset of the ten-item `BENEFITS` list the page states properly a
          screen later — "The cafe" appears in both, verbatim — written in a
          different vocabulary and arriving first. That is why the row read as
          randomly chosen: as a selection from a list nobody had seen yet, it
          was.

          TWO FRAMES, NOT THREE, AND THE FLOOR ONLY HAS THREE PLACES. The
          third tile was `theFloorWide` — which is the same view as this
          section's own lead photograph. Both alt texts open "The third floor
          from the back"; they are two frames of one moment, a panel recording
          shot from almost the same spot, and they sat a few hundred pixels
          apart.

          Nothing replaces it, because there is nothing left to show. The
          photographed areas of this floor are the open tables, the cafe and
          the window banquettes — and the open tables IS the lead photograph.
          The archive was searched for a fourth: every candidate was either the
          cafe again, a close-up of faces, or carried one of the two people who
          recur across this whole library.

          So the section shows three places, one of them large: the floor as
          the lead, then the cafe and the windows. The captions are wayfinding
          rather than an offer, and they describe only what is visible.

          PORTRAIT TILES, 4:5, which is not the aspect any other grid on the
          site uses. Landscape frames in a row read as a filmstrip of moments;
          upright ones read as places you could walk to.

          THEY LIVE INSIDE THE RIGHT COLUMN, AND THE WIDTH IS WHY. 4:5 was
          picked for a FOUR-up across the full container — 254px wide, 318
          tall, thumbnails you scan. Cutting the row to two and leaving it
          full-width made each one 532 x 665px: two portraits towering over the
          4:3 lead photograph above them, which is a section that looks broken
          and reads as though the bottom two images have no job.

          In the right column they are 248 x 310 — within a few pixels of what
          the aspect was chosen for. It also groups the photography into one
          column, so the section reads as copy on the left and the place on the
          right, rather than a block and then two orphans.
        */}
      </Section>

      {/* ── Membership ───────────────────────────────────────────────── */}
      {/*
        WHERE THE PRICE LIVES NOW — eighth of nine sections, which is where
        Geekdom's own source copy puts it, and where it stops being an opening
        bid and starts being an answer.

        The number is the HEADLINE here rather than a figure in a card, and
        that is deliberate: by this point the reader has been through the
        room, the rhythm, the clubhouse and who it's for, so "$100/month.
        Application-based." reads as the resolution of a question they are
        already holding. The same sentence at the top of the page reads as a
        price tag.

        Built from `priceLabel()` and never typed — a literal here would drift
        from Stripe silently, and this is now the largest rendering of the
        price on the site.
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
        {/*
          "$100 per month. Application-based." — the doc's headline, and the
          preposition matters. This read "$100/month.", which is a rate card;
          `priceSentence()` spells it out and still derives the figure from
          `MEMBERSHIP_PRICE_CENTS`, so it cannot drift from Stripe.

          THE LEDE UNDER IT IS GONE. "One membership. No tiers to compare, no
          desk to rent, no contract to negotiate." was written here. The doc
          gives this section an eyebrow, a headline, the includes list, and
          one closing line — which now sits after the list, where the doc puts
          it.
        */}
        <SectionTitle>
          {priceSentence() ? (
            <>
              <span className="tabular-nums">{priceSentence()}</span>.{" "}
              <span className="text-clay">Application-based.</span>
            </>
          ) : (
            <>
              One membership.{" "}
              <span className="text-clay">Application-based.</span>
            </>
          )}
        </SectionTitle>

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          {/* What you get */}
          <div>
            <Subhead>What&rsquo;s included</Subhead>
            <ul className="mt-8 flex flex-col gap-7">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex gap-4">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-clay"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className={cn(HEADING.item, "text-graphite")}>{benefit.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
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
            <div className="rounded-xl border border-border bg-bone p-7 shadow-sm">
              {/*
                NO PRICE IN THE CARD. It used to repeat the figure at
                FIGURE.md, which made sense when the hero carried the number
                and this was the second mention; now the section headline two
                inches away IS the price, and setting it twice in one viewport
                reads as a page that is nervous about it.

                What the card does instead is hold the CTA while the reader
                scrolls the nine-item list beside it — which is the whole
                reason it is sticky.
              */}
              <p className={cn(MONO.eyebrow, "text-concrete")}>Geekdom Club</p>

              {price ? (
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  Billed monthly. Nothing is charged until you&rsquo;re
                  accepted, and you can cancel any time.
                </p>
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
            {/* ── The other engine ─────────────────────────────────────────── */}
      {/*
        /club NEVER MENTIONED THE STUDIO. Not the word, not a venture layer,
        not a fund, and no link — zero occurrences in the page body, on the
        page most likely to be somebody's entry point from search.

        That breaks the site's central claim from the Club's side. The homepage
        states it plainly — "Geekdom runs a members' club and a venture fund" —
        and builds a whole section on the pipeline between them, because
        without it the two engines read as a landlord with a side fund. Every
        other page already carries its half: /studio points at the Club by
        name, the FAQ answers for both. This page behaved as though the club
        were the whole company.

        WHAT IT MUST NOT SAY is that membership buys a check. The homepage
        lede is explicit that it does not and that there is nothing to apply
        to, and this reuses that wording rather than softening it — an
        application fee that reads as buying a lottery ticket is the one way
        this section could do damage.
      */}
      {/*
        GRAPHITE, FOR TWO REASONS. It landed on bone-light directly after the
        Membership section, which is also bone-light — six points of luminance
        between them, which reads as one long section rather than two.

        And graphite is how the HOMEPAGE treats this same argument: its
        pipeline section is the one dark band on the page. Matching it means
        the reader who met the idea there meets it in the same clothes here.
      */}
      <Section tone="graphite">
        <Eyebrow onInk>The other engine</Eyebrow>
        <SectionTitle className="text-bone">
          One is the on-ramp. The other is where it leads.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/70">
          Geekdom runs a members&rsquo; club and a venture fund. Most Studio
          relationships start in the Club — not because membership buys you a
          check, it doesn&rsquo;t and there&rsquo;s nothing to apply to, but
          because the work is easier to see up close.
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-bone/70">
          The Studio backs {STUDIO.foundersPerYear} founders a year with{" "}
          {STUDIO.checkRange} {STUDIO.checkTerms} checks from the {STUDIO.fund}{" "}
          and {STUDIO.engagement} of hands-on work with {STUDIO.eir.name}, our{" "}
          {STUDIO.eir.role}. Founders are scouted and invited.
        </p>
        <div className="mt-8">
          <ButtonLink href="/studio" size="lg" variant="on-ink-outline">
            Explore Studio
          </ButtonLink>
        </div>
      </Section>

      {/* ── What happens next ────────────────────────────────────────── */}
      <Section tone="bone">
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
              <p className="font-mono text-xs tracking-[0.18em] text-concrete">
                {step.n}
              </p>
              <h3 className={cn("mt-2", HEADING.subhead, "text-graphite")}>{step.title}</h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="graphite">
        <Eyebrow onInk>Already a member</Eyebrow>
        <SectionTitle className="text-bone">
          Manage your membership.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/70">
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

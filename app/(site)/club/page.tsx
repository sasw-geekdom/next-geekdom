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
import { InkField } from "@/components/site/ink-field";
import { ButtonAnchor } from "@/components/ui/button";
import { TypeHero } from "@/components/site/type-hero";
import { PhotoBand } from "@/components/site/photo-band";
import { PHOTOS } from "@/lib/photos";
import {
  BENEFITS,
  NOT_INCLUDED,
  priceLabel,
  EXTRAS,
  GENEROSITY_BAR,
  GOOD_FIT,
  NOT_FIT,
  NOT_FIT_CLOSING,
} from "@/lib/membership";
import {
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

/**
 * How the room works. Three modes, in the order a problem actually moves
 * through them. Lifted from the homepage with the section that renders it.
 */
const MODES = [
  {
    title: "Think it through",
    body: "Bring the thing you're stuck on. Office hours with mentors who've hit the same wall, fireside chats about the unglamorous middle, and the hallway conversation that reframes the whole problem.",
    photo: PHOTOS.byTheWindows,
  },
  {
    title: "Build it",
    body: "Heads down, together. Build sessions where the goal is to ship something before you leave, and drop-in workspace for the days you just need to focus.",
    photo: PHOTOS.headsDown,
  },
  {
    title: "Put it in front of people",
    body: "Say it out loud to a room that will tell you the truth. Pitch nights, demos, and the honest read you can't get from people who already agree with you.",
    photo: PHOTOS.pitch,
  },
];

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
      {/*
        THE PRICE IS NOT IN THIS HERO ANY MORE, and that reverses the call this
        page used to document.

        The old hero anchored on $100 at FIGURE.lg — the largest rendering of
        the number anywhere on the site — with the nine benefit titles beside
        it. The argument was that the page's job is conversion and the price is
        the last objection, so lead with it.

        That is the wrong first move for a club. Leading with the fee makes the
        page a pricing page, and a pricing page invites exactly one question —
        is it worth $100? — before the reader has been given a single thing to
        weigh it against. Geekdom's own source copy puts membership eighth of
        nine sections, after the rhythm, the clubhouse, who is in the room and
        who it's for. It is right: by the time the number appears, it should be
        the answer to a question the reader is already asking rather than the
        opening bid.

        THE SIDE PANEL WENT WITH IT. It existed because the price needed
        company — a lone figure in half a hero reads as a price tag. Without
        the number there is nothing to balance, and a type-led hero with the
        crown in its empty right is the same shape the homepage uses.

        The price now lives in the Membership section, with the full list of
        what it buys directly beside it.
      */}
      <TypeHero
        size="compact"
        fill
        eyebrow="The Club · Members only"
        title={
          <>
            Where San Antonio&rsquo;s founders and builders{" "}
            <span className="text-clay">find their room.</span>
          </>
        }
        aside={
          <InkField
            maskClassName="crown-mask"
            className="aspect-[55/41] h-auto w-[29rem] min-w-0 shrink-0 translate-x-[15%]"
            alpha={0.95}
          />
        }
      >
        <p className="text-lg leading-relaxed text-muted-foreground">
          A members-only community for the people building San Antonio&rsquo;s
          next generation of companies. Build sessions, tech talks, fireside
          chats and socials make the connections; the clubhouse on the third
          floor of the Rand is where they happen.
        </p>

        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          Member-only channels keep the community connected beyond the room,
          and the calendar runs on a monthly rhythm you can build a week
          around.
        </p>

        {/*
          THE THREE-BEAT DISQUALIFIER, in the first screen.

          Straight from the source copy, and it is the most load-bearing
          sentence on the page: "coworking space" is what fifteen years of
          public record says Geekdom is, and someone who arrives wanting a desk
          should learn it here rather than after a ten-minute application. The
          brand guide names both — not a coworking space, not an accelerator —
          in its "What we're not".
        */}
        <p className="mt-5 text-lg leading-relaxed text-graphite">
          It&rsquo;s not coworking. It&rsquo;s not an accelerator. It&rsquo;s a
          community powered by its mix of people, activities, and a clubhouse on
          the third floor.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/apply" size="lg">
            Apply for membership
          </ButtonLink>
          {/*
            The other thing a reader who isn't ready to apply can actually do:
            most of the calendar is open to non-members.
          */}
          <ButtonAnchor
            external
            href={LUMA_CALENDAR_URL}
            size="lg"
            variant="outline"
          >
            Come to an event first
          </ButtonAnchor>
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
        <Eyebrow>The rhythm</Eyebrow>
        <SectionTitle>Break the problem down together.</SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Every hard thing you&rsquo;re building moves through the same three
          stages. The room is built for all of them.
        </p>

        <ul className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-3">
          {MODES.map((mode, i) => (
            <li key={mode.title}>
              <Photo
                photo={mode.photo}
                aspect="aspect-[3/2]"
                sizes="(min-width: 1024px) 341px, (min-width: 640px) 50vw, 100vw"
              />
              <p className={cn("mt-5", MONO.label, "text-muted-foreground")}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className={cn("mt-2", HEADING.subhead, "text-graphite")}>
                {mode.title}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {mode.body}
              </p>
            </li>
          ))}
        </ul>
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

        THE FRAMES ARE CHOSEN AS EVIDENCE, not decoration. Each one shows a
        specific thing the membership promises — the cafe, somewhere to drop
        in, a fireside chat, programming — so the list above stops being
        assertions and starts being a photograph of the thing.

        WAYFINDING IS TEMPORARY HERE. The address, the Maps link and the
        elevator instruction belong on /contact, which the source copy
        specifies and nobody has built. Until then this is the only place on
        the site that tells someone how to actually get here.
      */}
      <Section tone="bone">
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
              be able to recognise as contact information.
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

          <Photo
            photo={PHOTOS.theFloor}
            aspect="aspect-[4/3]"
            sizes="(min-width: 1024px) 544px, 100vw"
          />
        </div>

        {/*
          The four frames that only existed on /the-floor. Deleting that page
          without moving these would have idled them — along with three already
          unused, that would be seven of seventeen photographs doing nothing,
          on a brand whose guide calls photography "the single biggest lever
          between a brand that reads as serious and one that doesn't".

          `aspect-[4/5]` — portrait, and deliberately not the 3/2 every other
          grid on the site uses. Four landscape frames in a row read as a
          gallery; four uprights read as a column of moments, which is what
          they are. It also fits more of each room in at this width.
        */}
        <ul className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[
            { photo: PHOTOS.theCafe, caption: "The cafe" },
            { photo: PHOTOS.dropIn, caption: "Drop in and work" },
            { photo: PHOTOS.fireside, caption: "Fireside chats" },
            { photo: PHOTOS.programming, caption: "Programming, most weeks" },
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
      </Section>

      {/* ── Who's in the room ────────────────────────────────────────── */}
      {/*
        THE PEOPLE, BEFORE THE FILTER — and this copy is Geekdom's own, from
        the source copy, and had never appeared anywhere on the site.

        The section below it ("Who the Club is for") is a filter: two columns,
        good fit and not. That is a necessary thing for an application-based
        club to say and a cold thing to open with. This comes first so the
        reader meets the people before the criteria — which is also the order
        the source copy puts them in.

        "GIVE FIRST" IS THE LINE THAT MATTERS. It is the same idea as the
        generosity bar below, said from the inside: the bar is what Geekdom
        looks for, this is what the room already does.
      */}
      <Section tone="bone-light">
        <Eyebrow>Who&rsquo;s in the room</Eyebrow>
        <SectionTitle>Builders of all breeds.</SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Our members are eclectic. Engineers, tinkerers, founders, investors,
          tech workers, students, senior operators. We lean into a give-first
          culture where everyone is willing to help the person next to them.
        </p>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-graphite">
          We show up with curiosity, ambition, and a belief that no good idea
          gets built alone.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <Photo
            photo={PHOTOS.makeAPoint}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.speaking}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
          <Photo
            photo={PHOTOS.theRoom}
            aspect="aspect-[3/2]"
            sizes="(min-width: 640px) 341px, 100vw"
          />
        </div>
      </Section>

      {/*
        THE HALF OF THE ANSWER THE SITE NEVER GAVE.

        "Who's in the room" above widens the door — it tells a developer, an
        investor or a service provider that a club described as "founders and
        builders" also means them. This narrows it, and the site had no version
        of that outside a soft line in the FAQ.

        Both columns, side by side, because a page that lists only good fits is
        making the reader guess. Someone who wants a desk finds out in ten
        seconds here instead of after a ten-minute application and a two-week
        wait, and that is a kindness, not a rejection.

        THE GENEROSITY BAR OPENS IT, which is exactly what the brand guide
        prescribes: use this line "anywhere the tone risks turning gate-keepy.
        It reframes selectivity as culture instead of prestige." A two-column
        in/out table is the most gate-keepy shape on the site, so the line goes
        first, in the editorial face, where it sets the terms for everything
        under it.
      */}
      {/* ── Who the Club is for ──────────────────────────────────────── */}
      <Section tone="bone">
        <Eyebrow>Who the Club is for</Eyebrow>
        <Editorial
          as="p"
          className="mt-5 max-w-3xl text-3xl leading-[1.3] text-graphite sm:text-4xl"
        >
          {GENEROSITY_BAR}
        </Editorial>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          We&rsquo;re looking for people who show up for the community, not just
          for themselves.
        </p>

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
      <Section tone="bone-light">
        <Eyebrow>Membership</Eyebrow>
        <SectionTitle>
          {price ? (
            <>
              <span className="tabular-nums">{price}</span>.{" "}
              <span className="text-clay">Application-based.</span>
            </>
          ) : (
            <>
              One membership.{" "}
              <span className="text-clay">Application-based.</span>
            </>
          )}
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One membership. No tiers to compare, no desk to rent, no contract to
          negotiate. The application takes about ten minutes and we respond
          within two weeks.
        </p>

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

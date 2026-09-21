import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  HEADING,
  LINK,
  Section,
} from "@/components/site/section";
import { cn } from "@/lib/utils";
import {
  CLUB_OPENS,
  STUDIO,
  CONTACT_EMAIL,
  LOCATION,
  OPEN_COFFEE,
  PROPERTY_OWNER,
  TEAM_CONTACTS,
  LUMA_CALENDAR_URL,
} from "@/lib/site";
import { formatLongDate } from "@/lib/format";
import { isPriceAnnounced, priceLabel } from "@/lib/membership";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "FAQ",
  path: "/faq",
  /*
    THE DESK CAME OUT OF HERE TOO, and this is the copy that mattered most.

    It read "what happens to desks and offices" — the search snippet and the
    social preview, both leading on the thing Geekdom stopped doing. The
    subtitle was the visible version of the same mistake; this is the one a
    stranger meets before they ever reach the page.

    It now describes what the page covers: both engines, the cost, and getting
    to the building. Evergreen, and it stops the FAQ presenting itself to
    search as a coworking wind-down notice.
  */
  description:
    "Practical answers about Geekdom: what club membership costs and includes, how to apply, how the Studio works, and where to park downtown.",
});

/**
 * The members FAQ.
 *
 * BUILT ON THE CLIENT'S OWN SHEET, the one that went out attached to the
 * letter. Reproduced close to the source, because people act on these answers.
 * Tightening the phrasing is fine; changing what an answer commits Geekdom to
 * is not.
 *
 * THE TRANSITION QUESTIONS HAVE BEEN RETIRED, on Geekdom's instruction: every
 * member holding an office or a dedicated desk was spoken to directly, so the
 * people those answers were written for already have them. Leases, refunds and
 * prorated credit are gone, along with the last reference to the September 25
 * contract date. What the page covers now is the Club, the Studio and getting
 * to the building.
 *
 * Two groups have since been ADDED rather than reproduced — the Studio and
 * Getting here. Both are sourced: the Studio from `STUDIO` in lib/site.ts,
 * which is Geekdom's own copy, and the garages from the City.
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
  const opensOn = formatLongDate(CLUB_OPENS);

  const groups: Group[] = [
    {
      title: "About the space",
      items: [
        {
          q: "What happens to the floors above the third floor?",
          a: (
            <>
              Geekdom will no longer operate the Event Center or the 6th, 7th,
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
              <Link href="/apply" className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite">
                here on the site
              </Link>
              . You&rsquo;ll hear back within two weeks of applying.
            </>
          ),
        },
        {
          /*
            THE ONE ANSWER KEPT FROM THE OLD "ABOUT CURRENT MEMBERSHIPS" GROUP,
            in the client's own words, moved rather than rewritten.

            That group was three transition questions — leases, refunds,
            prorated credit — and every member they were written for has since
            been spoken to directly. One of them had already gone stale on its
            own: it promised the team would reach out "before the end of
            August".

            This part is not about the transition at all. It is an honest
            disqualifier, and the guide asks for exactly this register — say
            who it is not for, rather than let somebody pay to find out.
          */
          q: "Is this a coworking space? What if that's what I'm looking for?",
          a: (
            <>
              <p>
                It isn&rsquo;t, and we&rsquo;d rather be straight about it.
                There are no dedicated desks and no offices — the club is one
                membership, built around the people in the room rather than a
                seat in it.
              </p>
              <p className="mt-3">
                If what you need is primarily a traditional coworking space, the
                club may not be the right fit, and we&rsquo;d rather say so
                upfront than have you invest in something that doesn&rsquo;t
                serve you well. We&rsquo;re happy to suggest alternatives, and
                we hope you&rsquo;ll stay connected through our community
                events.
              </p>
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
    /*
      THE STUDIO WAS MISSING ENTIRELY, and the nav is what makes that a bug
      rather than an omission. It names three things — the Club, the Studio and
      Apply — and a visitor who clicks Studio, then comes here for the
      practical answers, found fourteen questions that behaved as though only
      the Club existed.

      EVERY FIGURE READS FROM `STUDIO` in lib/site.ts, which is Geekdom's own
      source copy. These are the terms of a live fund, so they are transcribed
      rather than rounded — the same rule MILESTONES carries.

      THE SECOND ANSWER IS THE LOAD-BEARING ONE. "How do I apply to the Studio"
      is the question this page will actually be asked, and the answer is that
      you cannot. Getting that wrong sends founders to a form that does not
      exist; AGENTS.md is explicit that the Studio is never given an apply CTA
      and is never called an accelerator or a cohort.
    */
    {
      title: "About the Studio",
      items: [
        {
          q: "What is the Studio?",
          a: (
            <>
              <p>
                Geekdom&rsquo;s venture layer, and the second of the two things
                Geekdom runs. It backs {STUDIO.foundersPerYear} local founders a
                year with a {STUDIO.checkRange} {STUDIO.checkTerms} check from
                the {STUDIO.fund}, plus {STUDIO.engagement} of hands-on work
                with {STUDIO.eir.name}, our {STUDIO.eir.role}.
              </p>
              <p className="mt-3">
                It is not an accelerator and there are no cohorts.{" "}
                <Link href="/studio" className={LINK}>
                  More on the Studio
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          q: "How do I apply to the Studio?",
          a: (
            <>
              <p>
                You don&rsquo;t — there is no open application. Founders are
                scouted and invited.
              </p>
              <p className="mt-3">
                Club membership isn&rsquo;t a prerequisite, but most Studio
                relationships start there, because the work is easier to see up
                close. If you think there&rsquo;s a fit, the honest route is to
                be around: come to something on the calendar, or write to{" "}
                <a href={`mailto:${STUDIO.email}`} className={LINK}>
                  {STUDIO.email}
                </a>
                .
              </p>
            </>
          ),
        },
        {
          q: "Do I need to be a member to join a Studio program?",
          a: (
            <>
              No, not for all of them. {STUDIO.openPrograms.join(", ")} are open
              to the wider community rather than to Studio companies only. The
              check and the {STUDIO.eir.role} time are the parts reserved for
              founders the Studio backs.
            </>
          ),
        },
      ],
    },
    /*
      WHERE TO PARK, WHICH THE SITE RAISED AND THEN DIDN'T ANSWER.

      "Parking passes and validations, at additional cost" appears on /club,
      in EXTRAS and in the terms — and lib/membership.ts says why: a page that
      omits a cost people meet on day one "buys a small conversion win and
      spends it on the first awkward conversation". But naming a cost without
      naming a garage is the worst of both. It tells a prospective member
      parking will cost them something and leaves them to work out where.

      That matters more for this membership than most. What is being sold is a
      specific room in a specific building that you come to; the journey in is
      part of the product.

      SOURCING. The garages, their addresses and the walking times are the
      City's, by way of the research in the sibling next-sasw repo, which
      measured them TO THE RAND — Geekdom's own building — for Startup Week.
      That file corroborates the addresses against Centro San Antonio and the
      City's parking directory.

      NO RATES HERE ON PURPOSE, which is where this departs from that file.
      Startup Week is five days and can quote a price that is true that week;
      this page is open-ended, and a flat rate written into it is a number that
      goes stale silently. The link goes to the City's own affordable-parking
      page, which is right on the day.

      ⚠️ WHAT GEEKDOM STILL HAS TO CONFIRM: which garage the member passes and
      validations are for, and what they cost. Both are claimed on /club and
      neither is written down anywhere. Deliberately not guessed — this answer
      says the passes exist and to ask, rather than inventing a garage.

      This belongs on /contact eventually, with the address and the elevator
      line that are on /club as the same kind of stopgap. Until that page
      exists, the FAQ is where people look.
    */
    {
      title: "Getting here",
      items: [
        {
          q: "Where do I park downtown?",
          a: (
            <>
              <p>
                Geekdom is on the {LOCATION.floor.toLowerCase()} of{" "}
                {LOCATION.building}, {LOCATION.street}. Three City garages sit
                within a short walk:
              </p>
              <ul className="mt-3 space-y-2">
                <li>
                  <span className="font-medium text-graphite">
                    City Tower Garage
                  </span>{" "}
                  — 60 N Flores St. The closest, about a minute away.
                </li>
                <li>
                  <span className="font-medium text-graphite">
                    Houston Street Garage
                  </span>{" "}
                  — 111 College St. Roughly four minutes, coming at the block
                  from the river side.
                </li>
                <li>
                  <span className="font-medium text-graphite">
                    St. Mary&rsquo;s Garage
                  </span>{" "}
                  — 205 E Travis St. Roughly four minutes.
                </li>
              </ul>
              <p className="mt-3">
                Rates change, so we don&rsquo;t quote them here —{" "}
                <a
                  href="https://sapark.sanantonio.gov/Parking-Locations/Affordable-Parking"
                  target="_blank"
                  rel="noreferrer noopener"
                  className={LINK}
                >
                  the City&rsquo;s affordable parking page
                </a>{" "}
                is the one that&rsquo;s right on the day. Street meters run
                downtown too and are free in the evenings and at weekends.
              </p>
              <p className="mt-3">
                Members can buy parking passes and validations at additional
                cost. Ask us for the current arrangement before you commit to a
                garage — write to{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
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
              <Link href="/events" className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite">
                public calendar
              </Link>{" "}
              — also on{" "}
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
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
                className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
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
    /*
      NO MARK IN A RAIL HERE EITHER, and between this page and the letter there
      is now a rule rather than two separate judgement calls:

        THE RAIL IS FOR PAGES YOU GLANCE AT. The 404, /account and the admin
        login are looked at and left; a mark in an otherwise empty column
        costs nobody anything there.

        IT COMES OFF PAGES THAT HOLD YOU. This is seventeen questions and the
        second-longest scroll on the site, and the shader is a
        requestAnimationFrame loop — it never settles, so it sits moving in
        peripheral vision for the whole read.

        (This first said "the rail is for short task pages" and named /apply
        among them. /apply is fourteen fields and promises five minutes —
        short in scroll, long in attention, and the one page on the site where
        that attention converts. Length was the wrong axis.)

        Every instance of it is also borrowed against a sign-off the 2026
        guide has not given: it bans gradients on the marks outright.

      Measures match the letter: header at max-w-3xl, body at max-w-2xl, both
      starting on the container's left edge so they line up with the wordmark
      in the navbar.
    */
    <Section tone="bone">
      <header className="mb-12 max-w-3xl">
        <Eyebrow>Questions</Eyebrow>
        {/*
          "HOW IT WORKS", ANSWERING THE HOMEPAGE'S "WHAT WE ARE".

          That section states the institution — "The institution behind San
          Antonio's startup community. Geekdom runs a members' club and a
          venture fund." This page is the follow-up question, so the two titles
          pair across the site rather than each labelling itself.

          It replaces "The practical stuff.", which was in the right register —
          the same terse utility voice as /events' "What's on." — but carried
          the one word on the page doing no work. The voice rules ban filler,
          and "stuff" was filler set at 48px.

          THE H1 DOES NOT ENUMERATE, because the line under it already does:
          joining the Club, how the Studio works, where to park. Naming them
          twice in three lines is a list, not a heading.
        */}
        <h1 className={cn("mt-4", HEADING.heading, "text-graphite")}>
          How it <span className="text-clay">works.</span>
        </h1>
        {/*
          NO DESK IN THE SUBTITLE. It read "This covers the
          what-happens-to-my-desk", which is the wrong register on this page in
          two ways.

          The desk belongs to the LETTER. "The desk was never the point" is the
          backward-facing line, written for people who had one, and /whats-
          changing is where it lives. Borrowing it here pointed a forward-facing
          page at an audience that stops existing on September 25.

          It was also describing a page that has since grown. The FAQ now
          covers both engines and how to get to the building, so the subtitle
          names those instead — which happens to make it evergreen, and the
          phase branch that used to be here unnecessary.
        */}
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Joining the Club, how the Studio works, and where to park. The why is
          in the letter.
        </p>
      </header>

      {/*
        BORROWED FROM VERCEL SHIP'S FAQ, and it is worth saying which part.

        Theirs is a flat list of eight questions in a collapsed accordion. The
        ACCORDION is the idea worth taking: seventeen answers left open is
        roughly four screens of prose that somebody looking for "where do I
        park" has to scroll past. Collapsed, all seventeen questions fit in
        about one screen and the page becomes scannable instead of readable.

        THE GROUPS STAY, which is where this departs from the reference. A flat
        list works for eight questions on one topic; these are three — the
        Club, the Studio, getting here — and the groups are the point of the
        page rather than decoration on it.

        NATIVE <details>, NOT A COMPONENT. It is open/closed state with a
        toggle, which the element already is: keyboard accessible, announced
        correctly, findable by the browser's own in-page search, and it works
        with no JavaScript at all. That matters here beyond principle — this
        repo does its interaction in CSS, and an accordion is the classic place
        a React state hook gets added for nothing.

        ANSWERS STAY IN THE DOM whether a row is open or closed, so nothing
        here is hidden from a crawler.

        NO <dl> AROUND THE ACCORDION. The first pass kept one and nested the
        <dt> inside the <summary>, which is invalid: a <dl> may only contain
        dt, dd, div or script-supporting elements, and dt/dd have to be direct
        children of the list or of a div that is. Buried inside
        div > details > summary they are none of those.

        It was not carrying much anyway — <details> already expresses the
        question/answer pairing, and expresses the open/closed state too, which
        a <dl> cannot. ("Who to ask" further down keeps its <dl>, correctly:
        those are topic/contact pairs with dt and dd as direct children.)
      */}
      <div className="flex flex-col gap-14">
        {groups.map((group) => (
          <section
            key={group.title}
            className="lg:grid lg:grid-cols-[9rem_minmax(0,42rem)] lg:gap-10"
          >
            {/*
              The label rides along at lg+, so you always know which group you
              are inside once the answers start opening.
            */}
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-concrete lg:sticky lg:top-24 lg:self-start lg:pt-7">
              {group.title}
            </h2>
            <div className="mt-6 divide-y divide-border border-y border-border lg:mt-0">
              {group.items.map((faq) => (
                <details key={faq.q} className="group">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-7 text-lg font-medium text-graphite transition-colors hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                      {/*
                        A rule, not a chevron glyph: two spans that form a plus
                        and lose the vertical stroke when the row opens. Clay is
                        allowed here because it is a RULE — non-text clears at
                        3:1, which it does on bone, and it never has to carry a
                        word.
                      */}
                    <span
                      aria-hidden="true"
                      className="relative mt-2.5 h-3 w-3 shrink-0"
                    >
                      <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-clay" />
                      <span className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-clay transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                    </span>
                  </summary>
                  <div className="pb-7 pr-9 leading-relaxed text-muted-foreground">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        {/*
          Named people, not a shared inbox. A question about applying, about
          the Studio, or about the building should reach the person who can
          actually answer it, rather than sit in a queue waiting to be routed.

          (This used to say "worried about a lease or a refund", which was the
          right reason while those questions were live and is not the reason
          any more. The section earns its place either way.)
        */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-concrete">
            Who to ask
          </h2>
          <dl className="mt-6 divide-y divide-border border-y border-border">
            {TEAM_CONTACTS.map((contact) => (
              <div
                key={contact.email}
                className="py-6 sm:flex sm:items-baseline sm:justify-between sm:gap-8"
              >
                <dt className="font-medium text-graphite">{contact.topic}</dt>
                <dd className="mt-1 text-muted-foreground sm:mt-0 sm:text-right">
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite"
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

      <div className="mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row">
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
    </Section>
  );
}

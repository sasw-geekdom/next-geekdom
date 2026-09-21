import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import {
  Eyebrow,
  HEADING,
  Section,
  SectionTitle,
} from "@/components/site/section";
import { cn } from "@/lib/utils";
import { PullQuote } from "@/components/site/editorial";
import {
  CLUB_OPENS,
  CONTRACTS_END,
  CONTACT_EMAIL,
  LETTER_AUTHOR,
  SITE_NAME,
  transitionPhase,
} from "@/lib/site";
import { formatLongDate } from "@/lib/format";

/*
  THIS PAGE CHANGES JOB ON ITS OWN, and revalidate is what lets it.

  Rendered once at build time it would freeze in whichever window the build
  happened to run in, and the two dates that matter are ten days apart with
  Startup Week between them. An hour is far finer than needed for a boundary
  measured in days, and it costs one render.
*/
export const revalidate = 3600;

/*
  Dynamic because the description flips tense with the transition, and a
  description that says Geekdom "becomes" a club is wrong in every search
  result served after October 5.
*/
export function generateMetadata(): Metadata {
  const opened = transitionPhase() === "after";
  return pageMetadata({
    ownCard: true,
    title: "What's Changing",
    path: "/whats-changing",
    description: opened
      ? `Geekdom became a membership club for serious founders and builders in ${CLUB_OPENS.toLocaleDateString("en-US", { month: "long", year: "numeric" })}. Coworking has ended and everything is on the third floor. The letter to our members, in full.`
      : "Geekdom becomes a membership club for serious founders and builders. Coworking is sunsetting and we're consolidating to the third floor. The letter to our members, in full.",
  });
}

/**
 * The announcement, kept whole.
 *
 * Deliberately not summarized or broken into marketing beats — this is the
 * letter that went to members, and the people arriving here are looking for
 * exactly what it said. The FAQ page handles the practical questions it raises.
 */
export default function WhatsChangingPage() {
  const phase = transitionPhase();
  return (
    <>
      {/*
        NO MARK BESIDE THE LETTER, and this is the one page on the site where
        that is the right call.

        It used to run CrownPage, which holds a sticky WebGL g-mark in a left
        rail — the reasoning being that the longest read on the site wants
        something for the scroll to travel past. That is a decoration argument,
        and on a letter it is the wrong one twice over.

        EVERY OTHER PAGE IS GEEKDOM SPEAKING IN PRESENT VOICE. This is a
        historical document: a letter that really went out, signed by a person,
        reproduced verbatim and explicitly not to be edited or punched up. The
        design job beside something like that is to get out of the way. A live
        animated brand mark is Geekdom performing while its own letter is being
        read — and after October 5 this page is an ARCHIVE, which is quieter
        still.

        MOVING IT TO THE RIGHT RAIL WAS THE OTHER OPTION and it is a real
        improvement on paper: in left-to-right reading a mark on the right sits
        after the text rather than before every line. It solves neither problem
        though. The gradient is still in peripheral vision for the longest read
        here, and it still spends the gradient-on-a-mark exception the 2026
        guide has not signed off — the same exception that came off the
        homepage hero. Relocating it is not retiring it.

        So: one column, centred, at reading measure. The letter is the content;
        nothing should travel past it.
      */}
      <Section tone="bone">
        {/*
          LEFT-ALIGNED, NOT CENTRED, so the letter starts on the same vertical
          line as the wordmark in the navbar.

          `Section` and the navbar share the same `Container`, so dropping
          `mx-auto` is all it takes — the measure stays at max-w-2xl and the
          left edge lands on the site's grid. Centred, the letter floated at
          its own margin and was the only block on the site that did not line
          up with the logo above it, which reads as a different page rather
          than a quieter one.
        */}
        {/*
          TWO MEASURES, WHICH IS THE SITE'S OWN CONVENTION rather than a
          departure from it: `SectionTitle` runs max-w-3xl and `Lede` runs
          max-w-2xl everywhere else. Inlining this header lost that and set the
          headline at reading measure, which is too narrow for 48px type.

          At max-w-2xl the pre-transition headline breaks over FOUR lines and
          strands "builders." alone on the last one at 194px of 672. At
          max-w-3xl it sets three full lines. The post-transition headline is
          three lines either way, so the wider measure costs nothing and fixes
          the orphan.

          THE LETTER STAYS AT max-w-2xl. 672px of Rubik at 18px is about 75
          characters, the top of the readable range — widening it to match the
          headline would buy a tidier right edge at the cost of the one thing
          this page exists to do, which is be read.
        */}
        <div>
          <header className="mb-12 max-w-3xl">
            <Eyebrow>A letter to our members</Eyebrow>
            {/*
              THE HEADLINE IS THE PAGE'S OWN, NOT THE LETTER'S, which is the
              whole reason it can move while the letter cannot.

              "Starting in October, Geekdom becomes…" is correct right up to
              October 5 and wrong every day after it — a page promising a
              change that already happened reads as an abandoned site, and this
              one is linked from the homepage, the footer and the 404.

              The letter underneath keeps its future tense and that is CORRECT:
              it is dated correspondence, it said "starting in October" because
              in September that was true, and rewriting it would be forging a
              document that really went out. So the frame moves, not the letter.
            */}
            <h1 className={cn("mt-4", HEADING.heading, "text-graphite")}>
              {phase === "after" ? (
                <>
                  In {CLUB_OPENS.getFullYear()}, Geekdom became a membership
                  club for{" "}
                  <span className="text-clay">
                    serious founders and builders.
                  </span>
                </>
              ) : (
                <>
                  Starting in October, Geekdom becomes a membership club for{" "}
                  <span className="text-clay">
                    serious founders and builders.
                  </span>
                </>
              )}
            </h1>
          </header>

          <div className="max-w-2xl text-lg leading-[1.75] text-graphite/85 [&>p]:mt-6">
          <p className="!mt-0">
            Fifteen years ago, Geekdom opened as a coworking space for geeks in
            San Antonio. At that time, a shared desk was the best tool we had for
            putting builders next to each other, and that turned into so much
            more. It turned into programs, events, and activities that brought
            this community together. Hundreds of companies got started because
            someone sat down next to the right person. But the desk was never
            really the point.
          </p>
          <p>
            The point was the person sitting next to you. The connection that
            turned into a co-founder, a customer, a collaborator, an investor.
            The community that makes building a startup in San Antonio possible.
            That&rsquo;s what has always made Geekdom a special place.
          </p>
          <p>
            Over the years, we&rsquo;ve offered more focused support for
            early-stage founders through programming. San Antonio&rsquo;s startup
            community has grown in infrastructure, investor activity, and the
            number of companies that belong on a national stage. The tools
            founders use have changed too. Teams are distributed, products get
            built faster, and the distance between an idea and a first customer
            has never been shorter. What hasn&rsquo;t changed is what founders
            need most: the right people around them at the right moment so they
            can scale.
          </p>

          {/*
            FRAUNCES. This is the sentence the whole letter turns on, and the
            guide names exactly this — "pull quotes... the occasional
            ceremonial line" — as what the editorial face is for. It was set in
            the sans at `text-xl font-medium`, which made it a slightly larger
            paragraph rather than a different register.
          */}
          <PullQuote className="!mt-10">
            So here&rsquo;s what we&rsquo;re doing: starting in October, Geekdom
            becomes a membership club for serious founders and builders. One
            membership. No dedicated desks. No offices.
          </PullQuote>

          <p className="!mt-10">
            We&rsquo;re sunsetting coworking and consolidating our space to the
            third floor only, so everything we do points to one thing: building
            San Antonio, one startup at a time.
          </p>
          <p>
            The third floor becomes the home of the club. A place you come to do
            your best thinking, have your most important conversations, and be
            around people who raise your game. Meetups, build sessions, office
            hours with mentors, fireside chats, pitch nights, and retreats.
            Drop-in workspaces when you need to focus. A cafe for your coffee
            chats. Meeting space reserved for deep dive conversations,
            brainstorms, or offsites with your team. New programming to go deeper
            with the startups shaping our future. Virtual platforms to take the
            energy beyond the rooms.
          </p>
          <p>
            The contracts for offices and dedicated desks will wrap up by{" "}
            {formatLongDate(CONTRACTS_END)}. If that affects you directly,
            we&rsquo;ve either already spoken with you or we&rsquo;ll be in touch
            this week. We&rsquo;re committed to making this transition smooth.
          </p>
          <p>
            Geekdom is still the place in San Antonio for people building things:
            founders, engineers, and creators; the operators and investors
            who&rsquo;ve done it before; and the corporate and civic leaders who
            want a hand in what this city becomes. The space changes. The people
            in it don&rsquo;t.
          </p>
          <p>
            More on the new membership pricing, benefits, and how to apply is
            coming soon. We&rsquo;re excited to make this change, and if it still
            calls to you, we hope you&rsquo;re excited to keep building with us
            too.
          </p>

          {/*
            The signature. An unsigned letter reads as a corporate announcement;
            this one is a person putting their name to a decision, which is the
            whole reason it carries the weight it does.
          */}
          <footer className="!mt-12 border-t border-border pt-8 not-italic">
            <p className="!mt-0 font-medium text-graphite">{LETTER_AUTHOR.name}</p>
            <p className="!mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {LETTER_AUTHOR.role}, {SITE_NAME}
            </p>
            </footer>
          </div>
        </div>
      </Section>

      {/*
        THE "AFFECTED DIRECTLY?" SECTION IS GONE, AHEAD OF ITS OWN EXPIRY.

        It said "we'll be in touch", which is an offer to people whose
        contracts were still running, and it sent them to the FAQ for the
        detail. Both halves have since stopped being true: Geekdom has spoken
        to every member holding an office or a dedicated desk, and the FAQ's
        lease, refund and prorated-credit answers were retired on that basis.
        A section promising outreach that already happened, linking to answers
        that are no longer there, is worse than no section.

        It was built to retire itself on September 25 when contracts ended.
        That date is now the wrong trigger — the outreach finished first — so
        the forward-facing version runs from today.

        THE PHASE CHECK STAYS ON THE HEADLINE, which has a different trigger:
        the club opening on October 5, which has not happened yet.
      */}
      <Section tone="bone-light">
        <Eyebrow>Since the letter</Eyebrow>
        <SectionTitle>
          {phase === "after"
            ? "The club is open."
            : `The club opens ${formatLongDate(CLUB_OPENS)}.`}
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One membership, by application, on the third floor. If you had an
          office or a dedicated desk and something is still unresolved, write
          to us — we&rsquo;d rather answer the question than have you wonder.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/club" size="lg">
            Explore the Club
          </ButtonLink>
          <ButtonAnchor
            href={`mailto:${CONTACT_EMAIL}`}
            size="lg"
            variant="outline"
          >
            Email the team
          </ButtonAnchor>
        </div>
      </Section>
    </>
  );
}

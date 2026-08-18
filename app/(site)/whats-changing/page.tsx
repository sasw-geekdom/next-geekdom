import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import { Eyebrow, Section, SectionTitle } from "@/components/site/section";
import { CrownPage } from "@/components/site/crown-page";
import {
  CONTRACTS_END,
  CONTACT_EMAIL,
  LETTER_AUTHOR,
  SITE_NAME,
} from "@/lib/site";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "What's Changing",
  path: "/whats-changing",
  description:
    "Geekdom becomes a membership club for serious founders and builders. Coworking is sunsetting and we're consolidating to the third floor. The letter to our members, in full.",
});

/**
 * The announcement, kept whole.
 *
 * Deliberately not summarized or broken into marketing beats — this is the
 * letter that went to members, and the people arriving here are looking for
 * exactly what it said. The FAQ page handles the practical questions it raises.
 */
export default function WhatsChangingPage() {
  return (
    <>
      {/*
        The crown holds the rail beside the letter. This is the longest read on
        the site, and a sticky mark gives the scroll something to travel past —
        the same reason it sits beside the forms rather than above them.
      */}
      <CrownPage
        eyebrow="A letter to our members"
        title={
          <>
            Starting in October, Geekdom becomes a membership club for{" "}
            <span className="text-rust">serious founders and builders.</span>
          </>
        }
      >
        <div className="text-lg leading-[1.75] text-ink/85 [&>p]:mt-6">
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

          <p className="!mt-10 border-l-2 border-rust pl-6 text-xl font-medium leading-relaxed text-ink">
            So here&rsquo;s what we&rsquo;re doing: starting in October, Geekdom
            becomes a membership club for serious founders and builders. One
            membership. No dedicated desks. No offices.
          </p>

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
            <p className="!mt-0 font-semibold text-ink">{LETTER_AUTHOR.name}</p>
            <p className="!mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {LETTER_AUTHOR.role}, {SITE_NAME}
            </p>
          </footer>
        </div>
      </CrownPage>

      <Section tone="deep">
        <Eyebrow>Affected directly?</Eyebrow>
        <SectionTitle>
          If you have an office or a dedicated desk, we&rsquo;ll come to you.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          We&rsquo;ve either already spoken with you or we&rsquo;ll be in touch.
          If you&rsquo;d rather not wait, write to us directly — we&rsquo;d
          rather answer the question than have you wonder.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonAnchor href={`mailto:${CONTACT_EMAIL}`} size="lg">
            Email the team
          </ButtonAnchor>
          <ButtonLink href="/faq" size="lg" variant="outline">
            Read the FAQ
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}

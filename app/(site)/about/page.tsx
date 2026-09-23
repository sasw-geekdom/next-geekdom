import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  PageTitle,
  Section,
  Subhead,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { Photo } from "@/components/site/photo";
import { ContactLinks } from "@/components/site/contact-links";
import { PHOTOS } from "@/lib/photos";
import { CONTACT_BLOCKS, FOUNDED_YEAR } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "About",
  path: "/about",
  description:
    "Geekdom started with an email. Fifteen years on, it is a members' club and a venture layer for the people building San Antonio's next generation of companies.",
});

/**
 * THE ORIGIN AND THE CURRENT SHAPE, per `Source Copy v1`.
 *
 * The doc has specified /about since v1 — the footer's Explore column links
 * to it and the homepage's Since 2011 section is meant to close on "Read our
 * story → /about" — and it had never been built. Geekdom's footer feedback
 * named it as missing, so here it is.
 *
 * EVERY SENTENCE BELOW IS THE DOC'S, VERBATIM. Page header, Founding (two
 * paragraphs), Where we are now (three), and the contact block, which the doc
 * says "uses same contacts as the Contact page" — so it reads `CONTACT_BLOCKS`
 * rather than restating three addresses that would then drift.
 *
 * ⚠️ TWO OF THE DOC'S SECTIONS ARE NOT HERE, because the doc marks both
 * `[TBD]` and its own convention says "[TBD] needs to be replaced before
 * launch":
 *
 *   · TEAM — "Grid of team member cards — headshot, name, role, one-line bio.
 *     Placeholder for 6-8 people… We want to find a way to make this section
 *     feel really warm and playful to reflect our culture and personality as
 *     a staff." Needs headshots or working shots and eight bios.
 *   · ADVISORY BOARD — "Brief placeholder for board members."
 *
 * Rendering either as an empty grid or with invented names would be the
 * failure `data/mock/voices.ts` is written about. The eyebrows are ready —
 * THE PEOPLE and STEWARDSHIP — and both sections slot in between "Where we
 * are now" and the contact block the moment the content exists.
 *
 * THE FOUNDING COUNT IS COMPUTED, not typed. The doc writes "Fifteen years
 * ago"; hardcoding that makes the sentence false on 1 January, so it spells
 * the number derived from `FOUNDED_YEAR` — the same call the homepage's
 * Since 2011 section makes, for the same reason.
 */
const YEAR_WORDS: Record<number, string> = {
  14: "Fourteen",
  15: "Fifteen",
  16: "Sixteen",
  17: "Seventeen",
  18: "Eighteen",
  19: "Nineteen",
  20: "Twenty",
};

export default function AboutPage() {
  const years = new Date().getFullYear() - FOUNDED_YEAR;
  const spelled = YEAR_WORDS[years] ?? String(years);

  return (
    <>
      <Section tone="bone-light">
        <Eyebrow>About</Eyebrow>
        <PageTitle className="mt-6">Since {FOUNDED_YEAR}.</PageTitle>
        {/*
          The doc marks this line "Opening tagline (Fraunces italic)" — the
          same treatment and the same sentence the homepage's Since 2011
          section leads on.
        */}
        <Editorial className="mt-6 max-w-2xl text-2xl leading-[1.45] text-graphite/90">
          Geekdom started with an email.
        </Editorial>
      </Section>

      <Section tone="bone">
        <Eyebrow>Founding</Eyebrow>
        <h2 className="sr-only">Founding</h2>
        <div className="mt-6 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {spelled} years ago, Graham Weston received an email from a founder
            that said San Antonio was missing a startup and tech community.
            Geekdom was born as the answer. Today, it powers the next
            generation of venture companies in San Antonio and the builders
            behind them.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            From the start, the point wasn&rsquo;t the space. It was the people
            the space brought together — the founders who found their
            co-founders, the engineers who joined the companies that would
            later go on to raise, hire, and stay rooted here.
          </p>
        </div>

        {/*
          The doc's note: "Full-width placeholder photograph after this
          section. Graham + Nick photo or another from early Geekdom days at
          Weston Centre." `grahamNick` is that photograph — 2011, both men
          under the original wall sign.

          16:9 rather than a taller crop, and uncropped: it is a symmetrical
          two-subject portrait with the sign above them, and all three are
          load-bearing. The homepage note on this frame has the full reasoning.
        */}
        {/* No caption — Geekdom has asked for photographs without them. The
            alt text still names both men. */}
        <Photo
          photo={PHOTOS.grahamNick}
          aspect="aspect-[16/9]"
          sizes="(min-width: 1152px) 1088px, 100vw"
          className="mt-12"
        />
      </Section>

      <Section tone="bone-light">
        <Eyebrow>Where we are now</Eyebrow>
        <h2 className="sr-only">Where we are now</h2>
        <div className="mt-6 max-w-2xl">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {spelled} years in, Geekdom is a members&rsquo; club for the people
            building San Antonio&rsquo;s next generation of scalable companies
            — founders, builders, and the operators, investors, and partners
            who invest in their success.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Alongside the Club, we operate the Studio, our venture layer that
            backs the founders we go all in with. Together with the Community
            Fund, Startup + Tech Week, Accelerate South Texas, and our work
            operating LaunchSA in partnership with the City of San Antonio,
            we&rsquo;re one part of a broader startup community — and we work
            to make sure the whole thing reinforces itself.
          </p>
          <p className="mt-5 text-lg leading-relaxed text-graphite">
            We put founders at the center of everything we do. Give them what
            they need. And build San Antonio, one startup at a time.
          </p>
        </div>
      </Section>

      {/*
        THE DOC'S CONTACT BLOCK: "Three-line contact list for membership,
        partnerships, and press. Uses same contacts as the Contact page." So it
        reads the same constant /contact does, filtered to `onAbout`. It
        showed General instead of Press, under an intro line written here
        rather than by Geekdom; both are fixed.
      */}
      <Section tone="bone">
        <Eyebrow>Get in touch</Eyebrow>
        <h2 className="sr-only">Contact</h2>
        <ul className="mt-6 max-w-3xl">
          {CONTACT_BLOCKS.filter((b) => b.onAbout).map((block) => (
            <li key={block.heading} className="border-t border-border py-6">
              <Subhead className="text-xl">{block.heading}</Subhead>
              <p className="mt-2 leading-relaxed text-muted-foreground">
                <ContactLinks block={block} />
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

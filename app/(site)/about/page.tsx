import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  HEADING,
  PageTitle,
  Section,
  Subhead,
} from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { Photo } from "@/components/site/photo";
import { ContactLinks } from "@/components/site/contact-links";
import { PHOTOS } from "@/lib/photos";
import { CONTACT_BLOCKS, FOUNDED_YEAR } from "@/lib/site";
import { cn } from "@/lib/utils";

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

const BODY = "text-lg leading-relaxed text-muted-foreground";

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
        {/*
          GEEKDOM'S FOUNDING STORY, VERBATIM, in two parts under their own
          subheads. It replaced the source copy's two paragraphs ("Fifteen
          years ago, Graham Weston received an email…"). Company names are as
          Geekdom wrote them — "Parlevel", where PORTFOLIO lists "ParLevel
          Systems". "In 2009" was "Around 2010" in their draft; they changed
          it to match the homepage's origin section.
        */}
        {/*
          THE ARCHIVE, SPRINKLED — Geekdom sent older photographs "to sprinkle
          throughout this top section or two". One beside each part of the
          story rather than a grid (they have pushed back on photo-heavy rows),
          in black and white like the 2011 portrait below: this section is the
          past. On a phone each photo follows its text.
        */}
        <div className="mt-6 grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
          <div>
            <h3 className={cn(HEADING.subhead, "text-graphite")}>The email</h3>
            <p className={cn("mt-4", BODY)}>
              In 2009, a founder whose company Rackspace had just acquired
              sent Graham Weston a now-infamous email explaining why he
              wasn&rsquo;t moving to San Antonio. The city, he wrote, had no
              startups and no developers to speak of.
            </p>
            <p className={cn("mt-5", BODY)}>
              That email set Graham on the path that led to Geekdom.
            </p>

          </div>
          <Photo
            photo={PHOTOS.about2013}
            aspect="aspect-[3/2]"
            sizes="(min-width: 1024px) 360px, 100vw"
            className="w-full max-w-[24rem] lg:mt-12"
          />

          <div className="lg:mt-6">
            <h3 className={cn(HEADING.subhead, "text-graphite")}>
              The place where startups are born
            </h3>
            <p className={cn("mt-4", BODY)}>
              Graham brought in Nick Longo to help build what came next.
              Together they visited New York, Philadelphia, and San Francisco to
              see how the strongest startup communities actually worked. In
              2011, they opened Geekdom downtown with a single promise: be the
              place where startups are born.
            </p>
            <p className={cn("mt-5", BODY)}>
              Soon after, Geekdom hosted Techstars Cloud, which brought founders
              from around the world to San Antonio.
            </p>
            <p className={cn("mt-5", BODY)}>
              From the beginning, the point wasn&rsquo;t the space. It was the
              people the space brought together. Founders met their co-founders
              here. Developers joined companies that went on to raise, hire, and
              build in San Antonio — Parlevel, Promoter.io, FloatMe, PorchPass,
              and more.
            </p>
          </div>
          {/*
            PORTRAIT, centered on the speaker: the full frame has an Apple
            laptop at its right edge, and this crop leaves it out.
          */}
          <Photo
            photo={PHOTOS.about2014}
            aspect="aspect-[4/5]"
            sizes="(min-width: 1024px) 360px, 100vw"
            className="w-full max-w-[24rem] lg:mt-6"
            imageClassName="object-[55%_50%]"
          />
        </div>

        {/*
          The doc's note: "Full-width placeholder photograph after this
          section. Graham + Nick photo or another from early Geekdom days at
          Weston Centre." `grahamNick` is that photograph — 2011, both men
          under the original wall sign, which reads "The Place Where Startups
          Are Born." — so it lands directly under the part that quotes it.

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
        {/*
          GEEKDOM'S COPY, VERBATIM, replacing the source copy's three
          paragraphs. The mission line is the lede, as on /club and /studio;
          the closing line keeps Graphite, the weight the old closing line
          had. "Fifteen" is computed from FOUNDED_YEAR, so it reads "Sixteen"
          next year rather than going stale.

          The relationships here are Geekdom's own words and they settle two
          of ECOSYSTEM's verbs: they OPERATE LaunchSA with the City, and they
          HELPED CREATE Accelerate South Texas (lib/site.ts had "a fund
          Geekdom is backed by"). LaunchSA stays a separate program, named —
          nothing here offers its resources to Club members.
        */}
        {/*
          Today's frames, in COLOR — the Founding section above is the past in
          black and white. Beside the text on desktop, after it on a phone.
        */}
        <div className="mt-6 grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)]">
          <div>
            <p className="text-2xl leading-snug text-graphite sm:text-[1.75rem]">
              Geekdom is on a mission to build San Antonio one startup at a time.
            </p>
            <p className={cn("mt-8", BODY)}>
              {spelled} years in, we&rsquo;ve gone from providing a place to work
              to deliberately building a place where companies get built.
            </p>
            <p className={cn("mt-5", BODY)}>
              Today, Geekdom has two parts. The Club is the community for the
              people building San Antonio&rsquo;s future — founders, engineers,
              creators, operators, and the corporate and civic leaders who want a
              hand in what the city becomes. The Studio is where we go all in
              with a small number of founders each year, investing through our
              Community Fund and working alongside them for the next six to
              twelve months.
            </p>
            <p className={cn("mt-5", BODY)}>
              Around the Club and Studio, we run a few things that make the whole
              ecosystem stronger. We operate LaunchSA with the City of San
              Antonio, the open front door for anyone starting something. We
              helped create Accelerate South Texas, a fund at the San Antonio
              Area Foundation that supports the organizations serving
              entrepreneurs across the region. And we run San Antonio Startup +
              Tech Week every fall to give our community a bigger stage.
            </p>
            <p className={cn("mt-5", BODY)}>
              Founders rarely succeed alone. So we bring entrepreneurs,
              investors, universities, corporations, and local government
              together to clear the path for startups in San Antonio. We&rsquo;re
              one part of a broader startup community, and we work to make every
              part of it stronger.
            </p>
            <p className="mt-8 text-lg leading-relaxed text-graphite">
              The email named what San Antonio was missing. We made it our
              mission.
            </p>
          </div>
          <div className="flex flex-col gap-6 lg:mt-24">
            <Photo
              photo={PHOTOS.about2021}
              aspect="aspect-[3/2]"
              sizes="(min-width: 1024px) 360px, 100vw"
              className="w-full max-w-[24rem]"
            />
            <Photo
              photo={PHOTOS.aboutChair}
              aspect="aspect-[3/2]"
              sizes="(min-width: 1024px) 360px, 100vw"
              className="w-full max-w-[24rem]"
            />
          </div>
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

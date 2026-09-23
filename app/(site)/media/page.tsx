import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  Lede,
  LINK,
  PageTitle,
  Section,
  MONO,
} from "@/components/site/section";
import { CopyButton } from "@/components/site/copy-button";
import {
  BOILERPLATE_SHORT,
  FACT_SHEET,
  PRESS_EMAIL,
  PROGRAMS_OPERATED,
} from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Media",
  path: "/media",
  description:
    "Press resources for journalists, writers, and researchers covering San Antonio's startup community — boilerplate, fact sheet, brand assets, and how to reach us.",
});

/**
 * THE PRESS PAGE, from `Source Copy v1`.
 *
 * Named by Geekdom as missing from the footer. Built with the parts of the
 * doc's spec that have real content behind them, and without the parts that
 * do not — because a press page is the one page on this site where a guessed
 * number becomes somebody else's published number.
 *
 * ⚠️ FOUR OF THE DOC'S SEVEN SECTIONS ARE NOT HERE, and each needs something
 * only Geekdom has:
 *
 *   · FACT SHEET, the five numeric rows — current members, companies started,
 *     capital raised, jobs created, companies acquired since 2020. All five
 *     are `[TBD]` in the doc. The two rows that ARE known render below.
 *   · LEADERSHIP BIOS — "[TBD] Cards for CEO and MD with photo, name, role,
 *     one-paragraph bio, download link."
 *   · PRESS RELEASES and IN THE NEWS — both are described as chronological
 *     lists in the doc and neither has a single entry in it. An empty "Recent
 *     announcements" heading says something worse than no heading.
 *
 * THREE DOWNLOAD LINKS ARE `[Drive URL TBD]` in the doc — the fact-sheet PDF,
 * the brand kit ZIP, and the photo library. The brand assets section below
 * links the marks this repo actually serves instead, which is strictly better
 * than a list of files with no way to get them; the palette one-pager and the
 * photography usage guide are not in the repo and are listed as pending.
 */
export default function MediaPage() {
  const boilerplate = BOILERPLATE_SHORT.join("\n\n");

  return (
    <>
      <Section tone="bone-light">
        <Eyebrow>Media</Eyebrow>
        <PageTitle className="mt-6">
          For journalists, writers, and researchers covering San
          Antonio&rsquo;s startup community.
        </PageTitle>
        <Lede>
          Everything you need to write about Geekdom, our members, and the
          founders building San Antonio&rsquo;s next generation of companies.
        </Lede>
      </Section>

      <Section tone="bone">
        <Eyebrow>Press inquiries</Eyebrow>
        <h2 className="sr-only">Press contact</h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          For all media and press inquiries, reach out to{" "}
          <a href={`mailto:${PRESS_EMAIL}`} className={LINK}>
            {PRESS_EMAIL}
          </a>
          . We respond to press inquiries within one business day.
        </p>
      </Section>

      {/*
        THE BOILERPLATE, WITH THE DOC'S COPY BUTTON. The prose is
        server-rendered from the same constant the button copies, so the
        clipboard cannot ship something the page does not say.
      */}
      <Section tone="bone-light">
        <Eyebrow>Boilerplate — short</Eyebrow>
        <h2 className="sr-only">Boilerplate</h2>
        <div className="mt-6 max-w-2xl">
          {BOILERPLATE_SHORT.map((para, i) => (
            <p
              key={para}
              className={cn(
                "text-lg leading-relaxed text-muted-foreground",
                i > 0 && "mt-5",
              )}
            >
              {para}
            </p>
          ))}
        </div>
        <CopyButton text={boilerplate} className="mt-8" />
      </Section>

      <Section tone="bone">
        <Eyebrow>By the numbers</Eyebrow>
        <h2 className="sr-only">Fact sheet</h2>
        <dl className="mt-8 max-w-2xl">
          {FACT_SHEET.map((fact) => (
            <div
              key={fact.label}
              className="flex flex-wrap items-baseline justify-between gap-x-6 border-t border-border py-4"
            >
              <dt className={cn(MONO.label, "text-muted-foreground")}>
                {fact.label}
              </dt>
              <dd className="text-lg font-medium leading-snug text-graphite">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className={cn("mt-12", MONO.label, "text-muted-foreground")}>
          Programs operated
        </h3>
        <ul className="mt-4 max-w-2xl">
          {PROGRAMS_OPERATED.map((program) => (
            <li
              key={program}
              className="border-t border-border py-4 text-lg leading-snug text-graphite"
            >
              {program}
            </li>
          ))}
        </ul>
      </Section>

      {/*
        THE MARKS THIS REPO ACTUALLY SERVES. The doc wants a brand kit ZIP
        behind a Drive URL that does not exist yet; these files are already
        public at these paths, so naming them is the difference between a
        usable page and a list of things you cannot have.

        NOT LINKED: the brand color one-pager and the photography usage guide,
        which the doc lists and the repo does not hold.
      */}
      <Section tone="bone-light">
        <Eyebrow>Assets</Eyebrow>
        <h2 className="sr-only">Logos and brand assets</h2>
        <Lede>
          Please follow our logo usage guidelines when using any Geekdom marks.
          The marks may appear in Geekdom Red, Graphite, or Bone, and should
          never be recolored, rotated, stretched, or placed in a gradient.
        </Lede>
        <ul className="mt-10 max-w-2xl">
          {[
            { label: "Full wordmark", href: "/brand/geekdom_logo_full.svg" },
            { label: "Crown mark", href: "/brand/crown.svg" },
            { label: "G mark", href: "/brand/g-mark.svg" },
          ].map((asset) => (
            <li key={asset.href} className="border-t border-border py-4">
              <a
                href={asset.href}
                download
                className={cn("text-lg leading-snug", LINK)}
              >
                {asset.label}
              </a>
              <span className={cn("ml-3", MONO.micro, "text-muted-foreground")}>
                SVG
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 max-w-2xl leading-relaxed text-muted-foreground">
          Questions about usage, or need a format that isn&rsquo;t here?{" "}
          <a href={`mailto:${PRESS_EMAIL}`} className={LINK}>
            {PRESS_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section tone="bone">
        <Eyebrow>Approved press photos</Eyebrow>
        <h2 className="sr-only">Photography</h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Press-quality photography of the Geekdom space, events, and (with
          member consent) named members. Available for editorial use with
          credit to Geekdom. To request access to the photo library, email{" "}
          <a href={`mailto:${PRESS_EMAIL}`} className={LINK}>
            {PRESS_EMAIL}
          </a>
          .
        </p>
      </Section>
    </>
  );
}

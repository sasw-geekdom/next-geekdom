import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  ARROW,
  Eyebrow,
  LINK_ARROW,
  PageTitle,
  Section,
  Subhead,
  MONO,
} from "@/components/site/section";
import { ArrowUpRight } from "lucide-react";
import { ContactLinks } from "@/components/site/contact-links";
import { CONTACT_BLOCKS, LOCATION } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Contact",
  path: "/contact",
  description:
    "How to reach Geekdom — membership questions, partnerships and Studio, press, and everything else. 110 E Houston St, 3rd Floor, San Antonio.",
});

/**
 * THE CONTACT PAGE THE SOURCE DOC HAS ALWAYS SPECIFIED.
 *
 * `Source Copy v1` lists /contact among the site's pages and the footer's
 * Explore column links to it; it had never been built. That absence has been
 * propping things up elsewhere — AGENTS.md records the address, the Maps link
 * and the elevator line living on /club "as a stopgap… they belong on
 * /contact, which the source copy specifies and nobody has built", and
 * /studio's corporate-partner block falls back to a mailto where the doc says
 * "Contact us → /contact".
 *
 * EVERY BLOCK AND EVERY SENTENCE IS THE DOC'S. Four blocks — membership,
 * partnerships and Studio, press, general — each naming the address for one
 * kind of question rather than pointing everyone at one inbox.
 *
 * PRESS IS A LINK, NOT AN ADDRESS, because that is what the doc says: "For
 * press and media inquiries: See our Media page → /media". It renders as
 * prose until /media exists, so this page never points at a 404.
 */
export default function ContactPage() {
  return (
    <>
      <Section tone="bone-light">
        <Eyebrow>Contact</Eyebrow>
        <PageTitle className="mt-6">Get in touch.</PageTitle>
        {/* No lede. The doc's header is the eyebrow and the headline; the
            line that sat here ("Four ways in…") was written here, not by
            Geekdom. */}
      </Section>

      <Section tone="bone">
        <h2 className="sr-only">Contact blocks</h2>
        <ul className="max-w-3xl">
          {CONTACT_BLOCKS.map((block, i) => (
            <li
              key={block.heading}
              className={cn(
                "border-t border-border py-7",
                i === CONTACT_BLOCKS.length - 1 && "border-b",
              )}
            >
              <Subhead className="text-xl">{block.heading}</Subhead>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {block.body} <ContactLinks block={block} />.
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {/*
        THE ADDRESS LIVES HERE. /club carried it as a stopgap until this page
        existed; it has moved off /club.

        The doc's note asks to "consider embedding a small map or directions
        link". A link, not an embed: a Maps iframe is a third-party frame with
        its own cookies on a page that otherwise loads nothing, which is the
        same trade `VideoCard` declines on /studio.
      */}
      <Section tone="bone-light">
        <Eyebrow>Location</Eyebrow>
        <h2 className="sr-only">Location</h2>
        <address className="mt-6 not-italic">
          <p className={cn(MONO.label, "text-muted-foreground")}>
            {LOCATION.building} · {LOCATION.floorShort}
          </p>
          <p className="mt-3 text-lg leading-relaxed text-graphite">
            {LOCATION.street}
            <br />
            {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
          </p>
          {/* Moved here from /club, where it sat as a stopgap. */}
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Elevator to the {LOCATION.floor.toLowerCase()}.
          </p>
        </address>
        {/* Same construction /club uses, so both land on the same pin. */}
        {/* A link, not a button — buttons on this site are for Apply. */}
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `Geekdom, ${LOCATION.postal}`,
          )}`}
          target="_blank"
          rel="noreferrer noopener"
          className={cn("mt-7 inline-flex", LINK_ARROW)}
        >
          Open in Maps
          <ArrowUpRight aria-hidden="true" className={ARROW.external} />
        </a>
      </Section>
    </>
  );
}

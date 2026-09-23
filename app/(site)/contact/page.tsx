import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  Lede,
  LINK,
  PageTitle,
  Section,
  Subhead,
  MONO,
} from "@/components/site/section";
import { ButtonAnchor } from "@/components/ui/button";
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
        <Lede>
          Four ways in, so a question reaches the person who can answer it
          rather than a shared inbox.
        </Lede>
      </Section>

      <Section tone="bone">
        <h2 className="sr-only">Contact blocks</h2>
        <ul className="max-w-3xl">
          {CONTACT_BLOCKS.map((block) => (
            <li key={block.heading} className="border-t border-border py-7">
              <Subhead className="text-xl">{block.heading}</Subhead>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {block.body}{" "}
                <a href={`mailto:${block.email}`} className={LINK}>
                  {block.email}
                </a>
                {"alsoEmail" in block && block.alsoEmail ? (
                  <>
                    {" or "}
                    <a href={`mailto:${block.alsoEmail}`} className={LINK}>
                      {block.alsoEmail}
                    </a>
                  </>
                ) : null}
                .
              </p>
            </li>
          ))}

          {/*
            THE PRESS BLOCK, AS THE DOC WRITES IT — "For press and media
            inquiries: See our Media page → /media", a pointer rather than an
            address, so press resources live in one place.
          */}
          <li className="border-t border-b border-border py-7">
            <Subhead className="text-xl">Press</Subhead>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              For press and media inquiries, see our{" "}
              <Link href="/media" className={LINK}>
                Media page
              </Link>
              .
            </p>
          </li>
        </ul>
      </Section>

      {/*
        THE ADDRESS, ON THE PAGE IT BELONGS TO. /club carries this today as a
        stopgap — see the note in AGENTS.md. Moving it is a separate change to
        that page; this is the destination it moves to.

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
        </address>
        {/* Same construction /club uses, so both land on the same pin. */}
        <ButtonAnchor
          external
          href={`https://maps.google.com/?q=${encodeURIComponent(
            `Geekdom, ${LOCATION.postal}`,
          )}`}
          variant="outline"
          className="mt-7"
        >
          Open in Maps
        </ButtonAnchor>
      </Section>
    </>
  );
}

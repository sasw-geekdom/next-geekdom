import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getGalleryImages } from "@/lib/gallery";
import { SinceHero } from "@/components/site/since-hero";
import { MemoryLane } from "@/components/site/memory-lane";
import { ARROW, Container, Eyebrow, LINK_ARROW_ON_INK, SectionTitle, Section } from "@/components/site/section";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CONTACT_EMAIL, FOUNDED_YEAR, LOCATION, SITE_NAME } from "@/lib/site";

const years = new Date().getFullYear() - FOUNDED_YEAR;

export const metadata: Metadata = pageMetadata({
  // Its own card. See the note in lib/og.ts — the card deliberately carries no
  // year count, because it is a static PNG and `years` above is not.
  ownCard: true,
  // "15 years", not "15 years of Geekdom" — the title template appends
  // "· Geekdom", and the long form rendered the name twice.
  title: `${years} years`,
  path: "/since-2011",
  description: `${years} years of Geekdom — the people, the pitches, the late nights, and the community that showed up. A photo wall from the third floor and beyond.`,
});

/**
 * THE EASTER EGG. Hidden behind "15 years of Geekdom" in the footer.
 *
 * Ported from the sibling next-sasw repo, where the same page runs for Startup
 * Week. It is not in the nav and not in the sitemap: it's a reward for reading
 * to the bottom of the page, and an easter egg that ranks in search has
 * stopped being one.
 *
 * THE BRAND GUIDE ASKS FOR THIS PAGE, which is why it survived the port rather
 * than being logged as a novelty. Its photography section: "Vintage. Honoring
 * the history of Geekdom and its people with throwback photos." Nothing else
 * on the site does that — every frame in lib/photos.ts is from three shoots in
 * one year. And a retrospective is the "ceremonial moment" the guide reserves
 * Fraunces and black-and-white for.
 *
 * `force-dynamic` because the wall reads a Firestore manifest that an admin
 * re-syncs whenever photos are added. Static generation would freeze the wall
 * at whatever was in the archive the day of the last deploy, and the whole
 * point is that Geekdom can keep filling it.
 *
 * IT RENDERS WITHOUT THE GALLERY. `getGalleryImages()` swallows a missing
 * manifest, an unset key or a Firestore outage and returns []. The hero then
 * stands alone, which reads as deliberate rather than broken — and is exactly
 * what ships until someone uploads the archive.
 */
export const dynamic = "force-dynamic";

export default async function SincePage() {
  const images = await getGalleryImages();

  return (
    <>
      <SinceHero />

      {images.length > 0 ? (
        <MemoryLane images={images} />
      ) : (
        /*
          The empty state is a real section rather than nothing, for the same
          reason the events section on the homepage never renders empty: a page
          that silently drops half its content gives nobody a way to notice
          that something is misconfigured.
        */
        <Section tone="bone">
          <Container className="max-w-2xl px-0 text-center">
            <Eyebrow>Down memory lane</Eyebrow>
            <SectionTitle className="mx-auto">
              The photographs are coming.
            </SectionTitle>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {/* "Weston Centre", with the British spelling, is the building's
                  actual name — Geekdom's first home before the Rand. Not a
                  typo; leave it alone on the next US-English sweep. */}
              {years} years of them, from the Weston Centre to the third floor.
              We&rsquo;re still digging them out of the archive.
            </p>
          </Container>
        </Section>
      )}

      {/* ── Close: ask for the photos ────────────────────────────────── */}
      {/*
        THE PEOPLE READING THIS WERE THERE. They arrive from the footer's old
        wordmark, from the 404 (following a link to the coworking-era site),
        or from the member dashboard ("You might be in a few"). The close
        used to sell them a membership under a line borrowed from the members
        letter. Now it asks for what the page is missing: the archive's
        dated frames run 2018–2025 and the founding years are thin. A mailto
        for now — an upload form is the next step if photos start arriving.
        Apply stays, as an arrow link, not the ask.
      */}
      <Section tone="graphite">
        <div className="mx-auto max-w-2xl text-center">
          <SectionTitle className="mx-auto text-bone">Were you there?</SectionTitle>
          <p className="mt-6 text-lg leading-relaxed text-bone/70">
            We&rsquo;re still filling in {years} years — the early ones most of
            all. If you have photos from the Weston Centre, {LOCATION.building.replace(/^The /, "the ")},
            or a Startup Week, send them our way.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-x-10 gap-y-4 sm:flex-row">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Photos for Since ${FOUNDED_YEAR}`)}`}
              className={`text-lg ${LINK_ARROW_ON_INK}`}
            >
              Send us yours
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
            </a>
            <Link href="/apply" className={LINK_ARROW_ON_INK}>
              Apply to {SITE_NAME}
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

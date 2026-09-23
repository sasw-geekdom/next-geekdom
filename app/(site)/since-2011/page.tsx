import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getGalleryImages } from "@/lib/gallery";
import { SinceHero } from "@/components/site/since-hero";
import { MemoryLane } from "@/components/site/memory-lane";
import { Container, Eyebrow, SectionTitle, Section } from "@/components/site/section";
import { ButtonLink } from "@/components/ui/button";
import { FOUNDED_YEAR, SITE_NAME } from "@/lib/site";

const years = new Date().getFullYear() - FOUNDED_YEAR;

export const metadata: Metadata = pageMetadata({
  // Its own card. See the note in lib/og.ts — the card deliberately carries no
  // year count, because it is a static PNG and `years` above is not.
  ownCard: true,
  title: `${years} years of ${SITE_NAME}`,
  path: "/since-2011",
  description: `${years} years of Geekdom — the people, the pitches, the late nights, and the community that showed up. A photo wall from the third floor and everywhere else it happened.`,
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

      {/* ── Close ────────────────────────────────────────────────────── */}
      <Section tone="graphite">
        <div className="mx-auto max-w-2xl text-center">
          <SectionTitle className="mx-auto text-bone">
            The space changes. The people in it don&rsquo;t.
          </SectionTitle>
          <p className="mt-6 text-lg leading-relaxed text-bone/70">
            {years} years in, and the next one starts the same way the first
            did — somebody sitting down next to the right person.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/apply" size="lg" variant="on-ink">
              Apply to {SITE_NAME}
            </ButtonLink>
            {/* "Read the letter" came out with /whats-changing. */}
          </div>
        </div>
      </Section>
    </>
  );
}

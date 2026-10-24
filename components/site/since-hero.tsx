import { Container, Eyebrow, HEADING } from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { FOUNDED_YEAR, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The hero for /since-2011 — "15 years of" and the wordmark.
 *
 * SHORT ON PURPOSE. It held 82% of the first screen with the wordmark at
 * 768px — the largest block of Geekdom Red on the site — and the first
 * photograph started at 1.13 screens, so the page about the photos opened
 * on none. Now it sizes to its content — one mono line (the eyebrow carries
 * "Since 2011 · San Antonio"; there were two), the wordmark capped at 448px —
 * and the wall starts inside the first screen down to a 1280×720 laptop.
 *
 * PORTED FROM THE SIBLING next-sasw REPO, where it is the easter egg hiding
 * behind "15 years of Geekdom" in the footer. Two things changed on the way
 * over, and both matter:
 *
 * BONE, NOT BLACK. The original sits on a black field, which is right for
 * Startup Week and wrong here — the 2026 brand guide gives Geekdom one ground
 * and it is Bone. The mark survives the swap without touching its colors:
 * the flow runs Graphite through Geekdom Red to a held-back Bone crest, and
 * the mask paints only the glyphs, so on a light page it reads as a dark red
 * mark catching light rather than a glowing one on black.
 *
 * THE COUNT IS COMPUTED. The original hardcodes "15 Years of", which is true
 * for exactly one year. This derives from FOUNDED_YEAR, the same constant the
 * homepage's origin section uses, so the page is still correct in 2031 — and
 * the route is /since-2011 rather than /15-years for the same reason.
 *
 * THE WORDMARK IS FLAT GEEKDOM RED. It carried a WebGL shader — color
 * flowing through the mark — which the guide bans ("Never in other colors,
 * gradients, or effects"). The shader is gone from the site.
 */
export function SinceHero() {
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <section className="relative overflow-hidden bg-bone">
      <Container className="flex flex-col items-center justify-center pb-10 pt-12 text-center sm:pt-14">
        <Eyebrow>
          Since {FOUNDED_YEAR} · San Antonio
        </Eyebrow>

        {/*
          The real heading is screen-reader-only and the visible type is
          decorative — because the mark below is half the sentence and a
          mask cannot be read. "15 years of Geekdom" reaches assistive tech
          as one string rather than as a fragment followed by an image.
        */}
        <h1 className="sr-only">
          {years} years of {SITE_NAME}
        </h1>

        <p
          aria-hidden="true"
          className={cn("mt-5", HEADING.display, "text-graphite")}
        >
          {years} years of
        </p>

        {/*
          THE STAR. `aspect-[375/142]` is the lockup's own ratio — the mask is
          `contain`, so any other box letterboxes the mark inside it.

          max-w-md rather than full width: at the container's 1152px the
          wordmark is 1152 wide and 436 tall, which puts its baseline below the
          fold on a laptop and separates it from the line it completes. (It
          was max-w-3xl, then max-w-xl; both kept the photographs off the
          first screen of a 720px-tall laptop.)
        */}
        <div aria-hidden="true" className="mt-5 w-full max-w-md sm:mt-6">
          {/*
            The wordmark flat, in Geekdom Red — the outline mask filled with
            one approved color. It was `WordmarkShader`, the largest instance
            of the gradient-on-a-mark exception the guide bans; the page's
            celebration is the photo wall below, not an effect on the logo.
          */}
          <div className="geekdom-mask aspect-[375/142] w-full bg-geekdom-red" />
        </div>

        {/*
          Fraunces. The guide reserves the editorial face for "the occasional
          ceremonial line", and a fifteen-year retrospective is the most
          ceremonial thing on the site.
        */}
        <Editorial className="mx-auto mt-7 max-w-xl text-pretty text-xl leading-[1.5] text-graphite/80">
          The people, the pitches, the late nights, and the community that
          showed up. Scroll back through it.
        </Editorial>

      </Container>
    </section>
  );
}

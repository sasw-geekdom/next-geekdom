import { WordmarkShader } from "@/components/site/crown-shader";
import { Container, Eyebrow, HEADING, MONO } from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { FOUNDED_YEAR, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The hero for /since-2011 — the wordmark, lit from inside.
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
 * ⚠️ THE SHADER INSIDE THE WORDMARK IS A KNOWN BRAND EXCEPTION. The guide
 * allows the marks in Geekdom Red, Graphite or Bone and bans gradients on
 * them outright. Every color here is approved; the gradient is not. This is
 * the largest instance of an exception that already exists on the crown and
 * the g-mark, and it goes into the same sign-off. See crown-shader.tsx.
 */
export function SinceHero() {
  const years = new Date().getFullYear() - FOUNDED_YEAR;

  return (
    <section className="relative overflow-hidden bg-bone">
      <Container className="flex min-h-[82svh] flex-col items-center justify-center py-24 text-center">
        <Eyebrow>The throwback</Eyebrow>

        {/*
          The real heading is screen-reader-only and the visible type is
          decorative — because the mark below is half the sentence and a
          canvas cannot be read. "15 years of Geekdom" reaches assistive tech
          as one string rather than as a fragment followed by an image.
        */}
        <h1 className="sr-only">
          {years} years of {SITE_NAME}
        </h1>

        <p
          aria-hidden="true"
          className={cn("mt-6", HEADING.display, "text-graphite")}
        >
          {years} years of
        </p>

        {/*
          THE STAR. `aspect-[375/142]` is the lockup's own ratio — the mask is
          `contain`, so any other box letterboxes the mark inside it.

          max-w-3xl rather than full width: at the container's 1152px the
          wordmark is 1152 wide and 436 tall, which puts its baseline below the
          fold on a laptop and separates it from the line it completes.
        */}
        <div aria-hidden="true" className="mt-6 w-full max-w-3xl sm:mt-8">
          <WordmarkShader className="w-full" />
        </div>

        {/*
          Fraunces. The guide reserves the editorial face for "the occasional
          ceremonial line", and a fifteen-year retrospective is the most
          ceremonial thing on the site.
        */}
        <Editorial className="mx-auto mt-12 max-w-xl text-pretty text-xl leading-[1.5] text-graphite/80">
          The people, the pitches, the late nights, and the community that
          showed up. Scroll back through it.
        </Editorial>

        <p className={cn("mt-10", MONO.label, "text-muted-foreground")}>
          Since {FOUNDED_YEAR} · San Antonio
        </p>
      </Container>
    </section>
  );
}

import Image from "next/image";
import { Container } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * A full-width photographic band: the picture IS the ground, the copy sits on
 * top of it.
 *
 * ⚠️ NOT CURRENTLY RENDERED ANYWHERE. It held the homepage's origin section
 * and was taken back out — not because the treatment failed but because the
 * only photograph available for that slot is a posed, symmetrical portrait
 * with both subjects centered and no dead space to put copy in.
 *
 * WHAT IT NEEDS BEFORE IT GOES BACK ON A PAGE: a frame with its subject off
 * to ONE SIDE and room on the other, and enough pixels for a full-width
 * background — call it 1760px wide as a floor, since that is what a 1920
 * display asks for. Check the frame against those two things first; a band
 * with nowhere for the copy to go turns into a scrim over the subject, which
 * is the failure that parked this.
 *
 * ADAPTED FROM THE TWO SIBLING REPOS — `GroupsHero` in next-devsa and
 * `PysaBand` in next-sasw, which build the same composition. Worth naming what
 * that composition actually is, because it is not the column bleed this
 * replaced:
 *
 *   section   relative, overflow-hidden, dark ground
 *   image     absolute inset-0, object-cover  — fills the section, not a column
 *   scrims    stacked gradients that carve a readable zone out of the left
 *   copy      relative z-20, floating over the image
 *
 * The copy and the photograph OVERLAP. A column bleed puts them side by side
 * and pushes one off the edge; this lays one over the other and lets a
 * gradient decide where the photograph is allowed to be seen. That overlap is
 * the whole reason it reads as cinematic rather than as a big picture.
 *
 * THREE SCRIMS, EACH DOING A DIFFERENT JOB:
 *   1. horizontal — near-opaque behind the text, clear on the right. This is
 *      what guarantees contrast: the copy never leaves the 0.95+ zone, so its
 *      legibility does not depend on what the photograph happens to be doing
 *      underneath it.
 *   2. vertical — dark at top and bottom, clear through the middle. Settles
 *      the band into the sections above and below instead of butting against
 *      them with a hard seam.
 *   3. a soft right-edge fade, so the picture does not end on a cut.
 *
 * GRAPHITE, NOT BLACK. Both reference implementations use near-black
 * (`rgba(10,10,10,…)`); this uses Geekdom's own dark ground so the band reads
 * as the same brand as the graphite sections either side of it.
 *
 * NOT GRAYSCALED, which is where it departs from DEVSA. Theirs desaturates
 * fully. The 2026 guide does ask for roughly 30% of the library in black and
 * white for "editorial gravity" — but the subject here is a wall sign whose
 * red "dom" is half of what makes the original mark recognizable, and the
 * guide's own grading note asks for "slightly desaturated (-10 to -15)"
 * rather than none. So it keeps its color.
 */
export function StoryBand({
  photo,
  eyebrow,
  title,
  children,
  caption,
  priority = false,
}: {
  photo: PhotoData;
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  children: React.ReactNode;
  /** Credit or date line, bottom of the copy column. */
  caption?: string;
  priority?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-graphite">
      {/*
        `fill` + `object-cover` so the photograph adopts whatever height the
        copy gives the section, rather than the section adopting the
        photograph's ratio. `sizes="100vw"` because it genuinely is.

        `object-right` matters: the band reveals its RIGHT side, so a centerd
        crop on a wide monitor pushes the subject under the scrim. Anchoring
        right keeps whatever the photograph is about in the part you can see.
      */}
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="100vw"
        placeholder="blur"
        priority={priority}
        className="object-cover object-right"
      />

      {/* 1 — the readable zone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            /*
              THESE STOPS ARE SET BY A CONTRAST FLOOR, NOT BY EYE, and the
              measurement is worth keeping because the obvious tweak is wrong.

              Behind the copy the wall in this photograph sits around 184 —
              bright. Body text at bone/80 over a scrim of S composites to:

                  S = 0.92   7.9:1   PASS
                  S = 0.78   7.1:1   PASS
                  S = 0.60   4.4:1   FAIL
                  S = 0.30   2.5:1   FAIL

              A first pass pulled the falloff forward to 0.30 by 52%, because
              Graham Weston sits at roughly 33-42% across the frame and the
              heavy scrim had him in shadow under his own caption. It lifted
              him out and dropped the second paragraph to 2.5:1. Both subjects
              and the copy occupy the same third of the picture, so one of them
              has to give, and it cannot be the words.

              So: 0.78 or higher across the whole measure the copy occupies
              (to 50%), then a fast falloff. What the band reveals is the
              crown, the red "dom" and Nick Longo; Graham stays in shadow. The
              caption still names them both because it describes the
              photograph, not the lighting.
            */
            "linear-gradient(to right, rgba(27,27,27,0.95) 0%, rgba(27,27,27,0.9) 34%, rgba(27,27,27,0.78) 50%, rgba(27,27,27,0.3) 70%, rgba(27,27,27,0.05) 88%, rgba(27,27,27,0) 100%)",
        }}
      />
      {/* 2 — settle it into the bands above and below. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-graphite/80 via-transparent to-graphite/80"
      />
      {/*
        3 — on a phone there is no room to put copy beside a photograph, so the
        horizontal scrim above would sit the text on the clearest part of the
        picture. Below `sm` the band goes almost solid and the photograph
        becomes texture rather than subject.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-graphite/80 sm:hidden"
      />

      <Container className="relative z-20 py-24 sm:py-32 lg:py-40">
        <div className="max-w-lg">
          {eyebrow}
          {title}
          <div className="mt-6 flex flex-col gap-5">{children}</div>
          {caption && (
            <p
              className={cn(
                "mt-12 font-mono text-xs uppercase tracking-[0.14em] text-bone/45",
              )}
            >
              {caption}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}

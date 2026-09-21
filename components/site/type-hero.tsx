import Image from "next/image";
import { Container, Eyebrow, HEADING, MONO } from "@/components/site/section";
import type { Photo as PhotoData } from "@/lib/photos";
import { cn } from "@/lib/utils";

/**
 * Type carries the fold. No photograph.
 *
 * LEFT-ALIGNED, like everything else in the app. This was centered, and centering
 * was the single thing that made the hero read as a template: BleedHero,
 * CrownPage and every Section are left-aligned, so the homepage was the one
 * screen running a different alignment from the site around it. The break
 * became obvious the moment a left-aligned logo strip was added to its base —
 * two alignment systems, one viewport.
 *
 * For pages whose job is to make a CLAIM rather than show a room. The headline
 * runs to 8xl — roughly half again the size the old hero used — because a
 * cautious size undercuts an assertive sentence, and with no image competing
 * for the fold there is nothing else for the eye to land on.
 *
 * Pairs with BleedHero; see the note there on which pages get which.
 */
export function TypeHero({
  eyebrow,
  title,
  children,
  tail,
  size = "full",
  footer,
  aside,
  media,
  side,
  fill = false,
}: {
  eyebrow: React.ReactNode;
  /** Accent spans inside this use `text-clay` — this is a light ground. */
  title: React.ReactNode;
  children?: React.ReactNode;
  /**
   * Optional quiet line under everything — a price, an address, a scroll cue.
   *
   * RENDERS INSIDE A <p>, so pass PHRASING content: a string, a fragment, a
   * <span>. A block element here — a <p>, a <div>, a list — nests inside that
   * paragraph, which is invalid HTML: React refuses to hydrate it and the
   * browser silently reparents the node, so server and client markup disagree.
   * The styling is already applied by the wrapper; a caller does not need to
   * restate it.
   */
  tail?: React.ReactNode;
  /**
   * `full` gives the claim the whole viewport. `compact` is a page header with
   * a list under it — a listing page that pushes its first row below the fold
   * is hiding the thing the visitor came for.
   */
  size?: "full" | "compact";
  /**
   * Pinned to the BASE of the hero, below the content.
   *
   * For the logo strip, which the reference site puts at the bottom of its own
   * hero. The content stays optically centered in the space that remains — the
   * wrapper takes `flex-1`, so the footer is subtracted from the box the
   * headline centers within rather than pushing it up.
   */
  footer?: React.ReactNode;
  /**
   * PROTOTYPE — a field in the hero's empty right.
   *
   * Absolutely positioned so it costs no layout, `pointer-events-none` because
   * it is atmosphere, and hidden below 1152px where that space does not exist
   * at all. Measured: at 1024 anything here collides with the headline.
   */
  aside?: React.ReactNode;
  /**
   * A real second column, in flow — not decoration.
   *
   * Distinct from `aside` on purpose. That one is absolutely positioned,
   * `pointer-events-none` and hidden below 1152px, which is right for a mark
   * and wrong for anything a visitor needs to read: content in an overlay
   * cannot reflow, and vanishing it on a phone would hide the argument. This
   * renders as a grid column that stacks underneath on narrow screens.
   */
  /**
   * A PHOTOGRAPH AS THE GROUND. Full bleed, type over it, dark.
   *
   * The composition is DEVSA's /buildingtogether and Startup Week's schedule
   * pages, and the thing that makes it work is not the scrim strength — it is
   * that the scrim is a RAMP ACROSS THE FRAME rather than a flat wash. Heavy
   * where the copy is, gone where the subject is. A flat 80% over the whole
   * picture is the failure mode: it reads as a gray rectangle and you have
   * paid for a photograph to obtain a background color.
   *
   * WHAT A FRAME NEEDS TO SURVIVE THIS, in order:
   *
   *   1. ITS SUBJECT ON THE RIGHT. The left is spent on the copy. A centered
   *      or left-weighted subject gets buried under the heavy end of the ramp,
   *      which is how `graham-nick-2011` failed in StoryBand.
   *   2. DEPTH ON THE LEFT, not blank wall. Shadow with structure in it — a
   *      column, a receding corridor — stays legible as texture at 0.96.
   *      Blown highlights there go to mud and take the copy with them.
   *   3. TONAL RANGE. Dark subject, bright window. The ramp has to have
   *      somewhere to travel.
   *
   * `conversation.jpg` was picked against those three and is the only frame in
   * the library that meets all of them — it is also natively black and white,
   * so it lands in the reference's photographic language without a `grayscale`
   * filter fighting a warm palette.
   *
   * MEASURED, in the copy zone after the ramp: Bone reaches 14.8:1 median,
   * 13.1:1 at p95, and 9.2:1 at the single worst pixel. That is AAA across the
   * whole block, not a scrape past AA. Clay sits at 3.7:1, which clears the
   * 3:1 bar for large text and is why the h1 keeps its accent here.
   */
  media?: {
    photo: PhotoData;
    /**
     * Which part of the frame survives the crop.
     *
     * Default is centred below xl and left-anchored at xl, where the box is
     * inset from the left — see the note on the image.
     */
    objectPosition?: string;
  };
  side?: React.ReactNode;
  /**
   * Hold the viewport, whatever the type size.
   *
   * Deliberately separate from `size`, which controls the type scale. They were
   * one knob and that was wrong: the membership hero wants `compact` TYPE — its
   * headline shares the fold with a price and a list — and `full` HEIGHT, so
   * the photograph below stays off screen until you scroll. Fused together, the
   * only way to get the height was to take a 72px headline with it.
   *
   * Without this the hero is a fixed 644px on every display, so a laptop shows
   * the photograph just below the fold while a 1440-tall monitor shows 730px of
   * it — the page opens completely differently depending on the screen.
   */
  fill?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative flex flex-col justify-center overflow-hidden",
        // The ground flips with the photograph. `isolate` keeps the image
        // and its ramp in their own stacking context so the sticky navbar
        // above still wins.
        media ? "isolate bg-graphite" : "bg-bone",
        // `short:py-10` halves the vertical padding on a laptop-height
        // screen — 80px of the ~100px that has to come out for the hero to
        // fit above the fold there.
        size === "full"
          ? "min-h-[calc(100svh-4rem)] py-20 short:py-10"
          : "pt-20 pb-14 sm:pt-24",
        // `fill` is independent of the type scale — see the prop's note.
        fill && size !== "full" && "min-h-[calc(100svh-4rem)] py-20 short:py-10",
      )}
    >
      {media && (
        <>
          {/*
            THE FRAME SLIDES RIGHT AT xl, AND object-position CANNOT DO IT.

            `object-cover` only has slack on the axis it overflows. This source
            is 1.50 and the fold is ~1.87, so cover scales to WIDTH and crops
            HEIGHT — there is no horizontal overflow at all, and every value of
            `object-position` renders identically. The picture was pinned, and
            the left of its two subjects sat under the copy with no setting
            that would move him.

            Narrowing the BOX is what moves it. From 38% the image is laid out
            in the right 62% of the fold, which both shifts the content right
            and gives cover something to crop horizontally, so `object-left`
            starts working too. The strip this leaves on the left is bare
            graphite — invisible, because the ramp is at 0.97 there anyway.

            ONLY AT xl. Below 1280 the fold is not wide enough to hold the copy
            column AND both subjects clear of it; at 1024 the copy alone takes
            69% of the width. There the picture stays full-bleed and centred,
            which is what it has always done.
          */}
          <div
            className="absolute inset-0 -z-10 xl:left-[38%]"
            /*
              THE SEAM, AND WHY A MASK RATHER THAN A RAMP STOP.

              Inset from the left, the picture began at a hard vertical edge.
              Left of it: bare graphite. Right of it: the ramp is at 0.926, so
              roughly 7% of the image punched through IMMEDIATELY. In absolute
              luminance that step is small — about 0.007 to 0.018 — but it runs
              the full height of the fold as a straight line, and a straight
              line is the one thing the eye never misses.

              The fix has to travel WITH the box. Closing the gap by driving
              the ramp to 1.0 before 38% would work today and silently break
              the moment anyone moves the inset, because the ramp is measured
              against the VIEWPORT and the box against itself. A mask on the
              image's own left edge is expressed in the box's coordinates, so
              the two can never drift apart.

              It is applied at every width, not just xl. Below xl the box is
              full-bleed and the mask simply darkens the outer left edge —
              where the scrim is already 0.85 to 0.97, so there is nothing
              there to lose, and the frame gains an edge instead of ending.

              -webkit- included: Safari only dropped the prefix in 15.4, and an
              unprefixed-only mask degrades to NO mask, which is the seam back.
            */
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, #000 22%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, #000 22%)",
            }}
          >
            <Image
              src={media.photo.src}
              alt={media.photo.alt}
              fill
              /*
                62vw AT xl, BECAUSE THE BOX IS INSET THERE — not 100vw.

                This said `100vw` from before the image was moved right, and
                the mismatch cost bytes on exactly the displays where they are
                expensive: told the picture is full width, a retina MacBook
                asks for the 3840w variant to fill a box that is 911 CSS px
                wide. `sizes` describes the BOX, not the viewport, and the box
                is `xl:left-[38%]`.

                THIS IS THE LCP ELEMENT — full-bleed, above the fold, and
                `priority`, so it is preloaded and nothing renders around it
                first. Bytes here are the number that moves the metric.
              */
              sizes="(min-width: 1280px) 62vw, 100vw"
              /* See the note in next.config.ts — this needs `images.qualities`
                 to contain 55, or Next 16 silently rounds it back to 75. */
              quality={55}
              priority
              placeholder="blur"
              className={cn(
                "object-cover",
                media.objectPosition ?? "object-center xl:object-left",
              )}
            />
          </div>
          {/*
            THE RAMP, IN THREE LAYERS, and each one is doing a different job.

            1. A FLAT WASH BELOW lg. The horizontal ramp assumes the copy sits
               in the left half; on a phone it spans the whole width, so the
               right end of every line would land on the bright, unscrimmed
               side. 85% is what the brightest part of this frame needs to keep
               Bone at 4.5:1 — measured, not picked.
            2. THE HORIZONTAL RAMP, lg and up. This is the layer that makes it
               a photograph rather than a dark rectangle, and the stop that
               matters is the one at 46% — it has to hold heavy across the
               WHOLE copy column, which on a 1440 fold runs from 12% to 59%
               because the copy starts at the container edge, not at zero.
               Measuring from zero is how the first pass came out 4.15:1 on
               its worst pixel while looking like it had margin. With the stop
               where it is now, Bone is 9.5:1 at p95 and 5.0:1 at the single
               worst pixel — AA for body across the entire block.
            3. A VERTICAL VIGNETTE, both. It seats the navbar at the top and
               hands off to the next section at the bottom instead of ending on
               a hard seam.
          */}
          <div className="absolute inset-0 -z-10 bg-graphite/85 lg:hidden" />
          <div
            className="absolute inset-0 -z-10 hidden lg:block"
            style={{
              background:
                "linear-gradient(to right, rgba(27,27,27,0.97) 0%, rgba(27,27,27,0.92) 46%, rgba(27,27,27,0.45) 68%, rgba(27,27,27,0.13) 86%, rgba(27,27,27,0.04) 100%)",
            }}
          />
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                "linear-gradient(to bottom, rgba(27,27,27,0.55) 0%, rgba(27,27,27,0) 30%, rgba(27,27,27,0) 60%, rgba(27,27,27,0.80) 100%)",
            }}
          />
        </>
      )}

      <div className="flex flex-1 flex-col justify-center">
        <Container className="relative">
          {/*
            Inside the Container, so the mark shares the measure the navbar and
            the copy use — it was anchored to the section and ran to the
            viewport edge, 176px past where every other element stops.

            `right-8` rather than `right-0`: an absolutely positioned child
            offsets from the PADDING box, so right-0 would sit at 1296 — outside
            the 1264 content edge the headline aligns to.

            Vertical centering comes free here. The Container's box is exactly
            the copy block, so `inset-y-0` centers the mark on the copy rather
            than on the section, whose height includes the footer strip and made
            the crown look bottom-weighted.
          */}
          {aside && (
            <div className="pointer-events-none absolute inset-y-0 right-6 hidden items-center [@media(min-width:1152px)]:flex [@media(min-width:1152px)]:right-8">
              {aside}
            </div>
          )}

          <div
            className={cn(
              side &&
                "grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16",
              // The copy stays in the heavy end of the ramp. Past ~45% of
              // the viewport it walks into the part of the frame that is
              // deliberately NOT scrimmed.
              media && "lg:max-w-[42rem]",
            )}
          >
            <div>
          {/*
            CLAY AS A RULE, NOT AS WORDS — the guide's own prescribed fix, and
            this hero is the case it was written for.

            The h1 elsewhere on the site sets its second half in Clay. It
            cannot here: the ramp leaves a residual image luminance under the
            copy, so the ground is LIGHTER than flat graphite, and Clay — which
            is lighter than graphite — loses contrast as the ground rises. It
            measures 2.30:1 across the copy column against a 3:1 bar for large
            text. Bone on the same ground is 9.5:1.

            So the accent moves to a rule, where the bar is 3:1 for non-text
            and Clay clears it comfortably, and the words stay Bone. The
            headline loses nothing but its second colour; the accent is still
            on the fold.
          */}
          {media && <div className="mb-6 h-px w-12 bg-clay" />}
          <Eyebrow onInk={!!media}>{eyebrow}</Eyebrow>

          {/*
            `max-w-4xl` rather than 5xl. At 5xl the display size sets three
            words on the first line and the rag goes shapeless; capping the
            measure is what makes a two-line headline break where it should.
          */}
          <h1
            className={cn(
              "mt-6 max-w-4xl text-balance",
              media ? "text-bone" : "text-graphite",
              // A shared fold takes the smaller ramp; see HEADING.title.
              media
                ? HEADING.title
                : size === "full"
                  ? HEADING.display
                  : HEADING.heading,
            )}
          >
            {title}
          </h1>

          {/*
            max-w-xl, not 2xl. The lede was running to three lines with two
            words orphaned on the last — at this measure it sets in two even
            ones under the headline it belongs to.
          */}
          {children && <div className="mt-8 max-w-xl">{children}</div>}

          {tail && (
            <p
              className={cn(
                "mt-14",
                MONO.eyebrow,
                // Concrete is a light-ground colour — 3.2:1 on graphite, and
                // it fails outright. See globals.css.
                media ? "text-bone/75" : "text-muted-foreground",
              )}
            >
              {tail}
            </p>
          )}
            </div>

            {side && <div className="lg:pt-2">{side}</div>}
          </div>
        </Container>
      </div>
      {footer}
    </section>
  );
}


"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";
import { cn } from "@/lib/utils";

/**
 * A Geekdom mark with the flow running through it.
 *
 * EVERY VALUE IN IT IS NOW AN APPROVED MARK COLOR. The 2026 brand guide
 * allows the marks in Geekdom Red, Graphite or Bone and nothing else, and this
 * used to run Red into GOLD — a color that is not in the brand palette at
 * all. The flow is now Graphite in the troughs, Geekdom Red through the body,
 * and Bone catching the crests: dark, mark, light.
 *
 * The crest mix drops from 0.55 to 0.26 and the pointer glow from 0.35 to
 * 0.16 with that swap. Gold sat close to Red in hue, so it could be laid on
 * thickly and still read as the same mark warming up; Bone is the opposite end
 * of the palette, and at the old strength the crests went pink. At 0.26 it
 * reads as light falling across the mark rather than as a second color.
 *
 * WHAT THIS DOES NOT FIX: the guide also says "no gradients" on the marks
 * outright. This is still a gradient — it is just a gradient built from three
 * approved colors instead of an unapproved one. It is a smaller exception
 * than it was, and it is a deliberate one pending sign-off, not an oversight.
 *
 * The base is Graphite rather than pure black. #000 is not in the palette, and
 * mixing up from it drains the red toward gray in the troughs so the mark ends
 * up looking dirty rather than dark.
 *
 * SIZING IS THE CALLER'S JOB. Each shape contributes only its aspect ratio; a
 * caller passes the height or width. An earlier version baked rail sizing in
 * here, including `lg:` variants — and those survived twMerge against a
 * caller's unprefixed `h-20`, so the footer mark came out five times its
 * intended size. Geometry here, layout there.
 */

const SHAPES = {
  crown: {
    mask: "crown-mask",
    fallback: "/brand/crown.svg",
    aspect: "aspect-[55/41]",
  },
  "g-mark": {
    mask: "g-mark-mask",
    fallback: "/brand/g-mark.svg",
    aspect: "aspect-[40/127]",
  },
  /*
    THE FULL LOCKUP. One placement only: the /since-2011 hero, where the
    wordmark is the whole picture rather than a mark beside something.

    This is the largest the exception below gets — a gradient inside the
    PRIMARY wordmark, which is the most protected mark in the system and the
    one rendering flat and correct in the navbar three inches above it. It is
    here deliberately and it needs to go into the same sign-off conversation as
    the crown. Don't reach for it anywhere else.
  */
  wordmark: {
    mask: "geekdom-mask",
    fallback: "/brand/geekdom_logo_full.svg",
    aspect: "aspect-[375/142]",
  },
} as const;

export type MarkShape = keyof typeof SHAPES;

export function CrownShader({
  shape = "crown",
  onDark = false,
  className,
}: {
  shape?: MarkShape;
  /** The mark sits on a graphite ground. See the note below — required there. */
  onDark?: boolean;
  className?: string;
}) {
  const { mask, fallback, aspect } = SHAPES[shape];
  /*
    THE BASE HAS TO DIFFER FROM THE GROUND, and getting that wrong is what
    broke the footer mark.

    On a light ground the flow runs Graphite in the troughs, through Geekdom
    Red, to a Bone crest — dark mark, light page. Correct on the hero and on
    /since-2011.

    The footer is Graphite. With a Graphite base, base and background were
    rgb(27,27,27) against rgb(27,27,27) — a difference of ZERO. Every trough
    in the mark was exactly the colour of the page behind it, so the crown
    stopped reading as a crown and became a few disconnected red patches
    floating in the footer. It looked broken because half of it was missing.

    `onDark` keeps the mark IN RED rather than inverting it. `color` is the
    BODY of the flow, not an accent, so the first attempt at this — Geekdom Red
    as the base, Bone as the colour — turned most of the crown pale. Its ramp
    ran #C93625 → #EBC8BF: red at the troughs and near-white everywhere else,
    which is not a red mark, it is a pink one.

    What runs now is a deep crimson base through Geekdom Red, with Bone held
    to the crests at 0.26 where it reads as light falling on the mark rather
    than as a second colour. The whole ramp stays crimson:

        #5A1612 → #6C1B15 → #92261C → #BD4032 → #D36052

    #5A1612 IS A SHADE OF GEEKDOM RED, not a fourth colour — the same licence
    `--geekdom-red-deep` takes in globals.css for the button hover. The mark
    needs a dark end to have any depth at all, Graphite is unavailable here
    because it is the page, and the only honest place left to go is down the
    red itself.

    CHECK THE BASE AGAINST THE GROUND whenever this is placed somewhere new.
    The failure is silent: the canvas renders perfectly and the mark simply is
    not there.
  */
  /*
    ONLY THE DARK END MOVES. Geekdom Red is the body and Bone the crest on
    both grounds — what changes is the floor the flow starts from, because
    that is the value that has to stay distinguishable from the page.
  */
  const base: [number, number, number] = onDark
    ? [0.353, 0.086, 0.071] // #5A1612 — deep crimson, on a graphite page
    : [0.106, 0.106, 0.106]; // #1B1B1B — Graphite, on a bone page
  return (
    <ShaderCanvas
      color="#CA3625"
      accent="#F4F1EB"
      base={base}
      maskClassName={mask}
      fallbackSrc={fallback}
      className={cn(aspect, className)}
    />
  );
}

/**
 * The g-mark, same flow. A named wrapper because `shape="g-mark"` at a call
 * site says less than the component name does, and the two marks are chosen
 * for different reasons — the crown is wide and shallow, the g is tall.
 */
export function GMarkShader({ className }: { className?: string }) {
  return <CrownShader shape="g-mark" className={className} />;
}

/**
 * The full wordmark, same flow. /since-2011 only — see the note on the shape.
 *
 * IT WORKS ON A LIGHT GROUND UNCHANGED, which is worth stating because it
 * looks like it shouldn't. The flow runs Graphite in the troughs through
 * Geekdom Red to a Bone crest, and the mask paints only the glyphs — so on
 * bone the mark reads as dark red catching light, and the page behind it never
 * shows through. The crest is held at 0.26 for exactly this reason: any
 * stronger and the highlights approach the page color and punch holes in the
 * letterforms.
 */
export function WordmarkShader({ className }: { className?: string }) {
  return <CrownShader shape="wordmark" className={className} />;
}

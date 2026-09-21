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
} as const;

export type MarkShape = keyof typeof SHAPES;

export function CrownShader({
  shape = "crown",
  className,
}: {
  shape?: MarkShape;
  className?: string;
}) {
  const { mask, fallback, aspect } = SHAPES[shape];
  return (
    <ShaderCanvas
      // Geekdom Red, Bone, Graphite — the three colors the guide allows a
      // mark to appear in. Base is Graphite as linear-ish 0-1 RGB (27/255).
      color="#CA3625"
      accent="#F4F1EB"
      base={[0.106, 0.106, 0.106]}
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

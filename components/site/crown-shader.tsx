"use client";

import { ShaderCanvas } from "@/components/site/shader-canvas";
import { cn } from "@/lib/utils";

/**
 * A Geekdom mark with the flow running through it.
 *
 * Rust as the body of the flow, gold on the crests. Those are the two brand
 * colours that work on a dark ground — rust alone would read as one colour
 * lightening and darkening, which is flatter than the mark deserves.
 *
 * The base is a near-black warm, not pure black: mixing up from #000 drains the
 * rust toward grey in the troughs and the mark ends up looking dirty rather
 * than dark.
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
      color="#CA3625"
      accent="#FCB316"
      base={[0.09, 0.028, 0.024]}
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

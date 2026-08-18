import { InkField } from "@/components/site/ink-field";
import { Logo } from "@/components/site/logo";
import { OG_CARDS, OG_SIZE } from "@/lib/og";
import { SITE_NAME, TAGLINE } from "@/lib/site";

/**
 * A share card, at exactly 1200×630, built from the real design system.
 *
 * This is a REAL PAGE that gets photographed, not an image generator. Both of
 * the server-side options render the wrong picture:
 *
 *   Satori (`next/og`, what this replaced) has no canvas and no GL, so it
 *   cannot draw the pigment crown at all — its version of the card was a flat
 *   white logo on ink. It also can't reach next/font, so the type was whatever
 *   system grotesk the renderer had, on a site whose whole type argument is
 *   Geist.
 *
 *   A hand-built HTML file in scripts/ could run the shader, but only by
 *   duplicating the GLSL, the mask, the colour tokens and the type scale — four
 *   copies to keep in step with a design system built specifically to stop that
 *   happening.
 *
 * Rendering inside the app costs one dev-only route and duplicates nothing: the
 * crown below is the same InkField the homepage hero runs, masked by the same
 * crown-mask.svg, over the same --ink, in Geist. What ships is what the browser
 * saw.
 *
 * FIXED PIXELS THROUGHOUT, and no responsive variants. The canvas is 1200×630
 * on every machine that will ever see it; a `sm:` here would be a breakpoint
 * that can never fire.
 */
export function OgCard({ slug }: { slug: string }) {
  const card = OG_CARDS[slug];
  if (!card) return null;

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden bg-ink"
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        padding: 72,
      }}
    >
      {/*
        The crown, bled off the right edge.

        Cropped rather than contained, on purpose. A share card is a 1200-wide
        image that a feed renders at maybe 500 — a mark sitting politely inside
        its own margin disappears at that size, while one running off the edge
        still reads as a shape. The hero does the same thing with the same mark.

        The box carries the mask's own 55:41 aspect, because the mask is
        `contain`: a mismatched box letterboxes the crown inside it and the
        pigment stops filling the shape.

        It also has to CLEAR THE FOOTER RULE at y≈490. A taller crown crosses
        the hairline, and since both are positioned in the same stacking
        context the rule simply vanishes into the pigment for the right half of
        its length — which reads as a rendering fault rather than as overlap.
      */}
      <div
        className="pointer-events-none absolute"
        style={{ width: 502, height: 374, right: -80, top: 96 }}
      >
        <InkField
          maskClassName="crown-mask"
          className="h-full w-full"
          frozenTime={card.seed}
        />
      </div>

      {/*
        Mono, not brand rust — this is an ink ground, where the logo's two rusts
        measure 3.3:1 and turn to mud at thumbnail size. `tone="mono"` takes
        currentColor, so the white below drives it.
      */}
      <Logo tone="mono" className="relative h-[54px] w-auto self-start text-white" />

      <div className="relative">
        <p
          className="font-mono uppercase text-gold"
          style={{ fontSize: 22, letterSpacing: "0.18em" }}
        >
          {card.eyebrow}
        </p>

        {/*
          The type scale's `display` tier, transposed to the one size this
          canvas has. Tracking and leading follow the same rule the scale runs
          on — as size grows, both tighten.
        */}
        <p
          className="mt-6 font-bold text-white"
          style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.035em" }}
        >
          {card.lines[0]}
        </p>
        <p
          className="font-bold text-gold"
          style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.035em" }}
        >
          {card.lines[1]}
        </p>
      </div>

      <div
        className="relative flex items-end justify-between border-t border-white/15"
        style={{ paddingTop: 26 }}
      >
        <span className="text-white/65" style={{ fontSize: 25 }}>
          {TAGLINE}
        </span>
        <span
          className="font-mono uppercase text-white/45"
          style={{ fontSize: 20, letterSpacing: "0.14em" }}
        >
          {SITE_NAME}.com
        </span>
      </div>
    </div>
  );
}

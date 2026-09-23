import { Logo } from "@/components/site/logo";
import { OG_CARDS, OG_SIZE } from "@/lib/og";
import { SITE_NAME, TAGLINE } from "@/lib/site";

/**
 * A share card, at exactly 1200×630, built from the real design system.
 *
 * This is a REAL PAGE that gets photographed (see scripts/og.mjs), so the
 * type is Rubik through next/font and the colors are the tokens — nothing is
 * redrawn by an image generator that can't reach either.
 *
 * BONE, TYPE-LED, AND THE WORDMARK IS THE ONLY MARK. The cards used to run on
 * Graphite with the WebGL pigment crown bled off the right edge. That crown
 * broke the 2026 guide twice over — "Marks appear only in Geekdom Red,
 * Graphite, or Bone. Never in other colors, gradients, or effects" and
 * "Don't use the crown as a bullet, divider, or decorative icon" — and the
 * cards were its most widely distributed placement. So it is not replaced
 * with a flat crown in the same slot, which would still be the mark used as
 * decoration: the card is a headline on Bone, signed with the primary
 * wordmark in Geekdom Red, whole and with its clear space.
 *
 * CLAY CARRIES THE SECOND LINE, which is legal here and nowhere small: Clay
 * on Bone is 3.5:1, clear of the 3:1 bar for large text, and this is 76px.
 * The eyebrow is Concrete, as it is on every light ground on the site.
 *
 * FIXED PIXELS THROUGHOUT, and no responsive variants. The canvas is 1200×630
 * on every machine that will ever see it.
 */
export function OgCard({ slug }: { slug: string }) {
  const card = OG_CARDS[slug];
  if (!card) return null;

  return (
    <div
      className="relative flex flex-col justify-between overflow-hidden bg-bone"
      style={{
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        padding: 72,
      }}
    >
      {/*
        The primary lockup in its own colors. 64px tall — a feed shows the card at
        roughly 500px wide, where 54px left the name about 20px tall — is past the
        guide's 80px-wide digital minimum, and the 72px padding gives it more
        than the "height of the lowercase g" clear space on every side.
      */}
      <Logo className="h-16 w-auto self-start" />

      <div>
        <div className="h-0.75 w-14 bg-clay" />
        <p
          className="mt-7 font-mono uppercase text-concrete"
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
          className="mt-6 font-medium text-graphite"
          style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.02em" }}
        >
          {card.lines[0]}
        </p>
        <p
          className="font-medium text-clay"
          style={{ fontSize: 76, lineHeight: 1.04, letterSpacing: "-0.02em" }}
        >
          {card.lines[1]}
        </p>
      </div>

      <div
        className="flex items-end justify-between border-t border-graphite/15"
        style={{ paddingTop: 26 }}
      >
        <span className="text-concrete" style={{ fontSize: 25 }}>
          {TAGLINE}
        </span>
        <span
          className="font-mono uppercase text-concrete"
          style={{ fontSize: 20, letterSpacing: "0.14em" }}
        >
          {SITE_NAME}.com
        </span>
      </div>
    </div>
  );
}

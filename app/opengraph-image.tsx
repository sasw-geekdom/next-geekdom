import { ImageResponse } from "next/og";
import { TAGLINE } from "@/lib/site";
import { LOGO_PATHS, LOGO_VIEWBOX } from "@/components/site/logo";

export const alt =
  "Geekdom — Make people your unfair advantage. A space for problem solvers in San Antonio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Default share card.
 *
 * System fonts only — Satori can't reach next/font, so using Geist here would
 * mean fetching and embedding the woff on every render. The card is mostly the
 * logo and two lines of display type, and a system grotesk carries those
 * acceptably; the alternative is a network round trip inside image generation.
 *
 * Satori has no access to the CSS custom properties in globals.css either, so
 * the brand colours are repeated as literals and must be kept in step by hand.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#1D1D1D",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/*
          The full mark, drawn from the shared path data. Satori needs explicit
          width/height — it ignores className, so the h-* utilities <Logo/>
          relies on would render a zero-sized element here.

          White, not the two-tone brand rust: a share card gets scaled into a
          small thumbnail in a feed, where the crown's deep-rust band on ink
          turns to mud. One flat colour survives the downscale, and the whole
          lockup (crown + wordmark) is identifiable at that size in a way the
          crown alone is not.
        */}
        <svg width={222} height={84} viewBox={LOGO_VIEWBOX}>
          {LOGO_PATHS.map((d) => (
            <path key={d} fill="#FFFFFF" d={d} />
          ))}
        </svg>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* HOOK, split by hand. Satori has no text-balancing, so the break
              point is chosen rather than measured — keep any edit to two lines
              at this size or the mark below gets crowded. */}
          <p
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Make people your
          </p>
          <p
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#FCB316",
              margin: 0,
            }}
          >
            unfair advantage.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "2px solid rgba(255,255,255,0.15)",
            paddingTop: 28,
          }}
        >
          <span style={{ fontSize: 26, color: "rgba(255,255,255,0.7)" }}>
            A space for problem solvers. {TAGLINE}
          </span>
          {/*
            Rust reads as muddy on ink (3.3:1) — fine for a decorative label at
            this size on a share card, but keep type that matters in white/gold.
          */}
          <span style={{ fontSize: 24, color: "#CA3625", fontWeight: 600 }}>
            San Antonio
          </span>
        </div>
      </div>
    ),
    size,
  );
}

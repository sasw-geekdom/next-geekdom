import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The Geekdom logo.
 *
 * Path data lifted verbatim from the marks on geekdom.com
 * (`geekdom_logo_full.svg` / `geekdom_logo_crown.svg`, kept in `public/brand/`
 * as the originals). Inlined as JSX rather than loaded through next/image for
 * three reasons: no second request on every page, no layout shift, and — the
 * one that matters — the fills stay addressable, so the mark can go white on
 * the ink footer and each glyph can animate independently.
 *
 * The original SVG carries its colours in a `<style>` block (`.st0` / `.st1`).
 * That form is unusable here: those class names are global once inlined, so two
 * logos on one page in different tones would fight over the same rule. Colour
 * is a prop instead.
 *
 * TONE — the brand mark is two rusts, and rust on ink measures 3.3:1. WCAG
 * exempts logotypes from contrast minimums so it isn't a violation, but it
 * still reads as muddy against `--ink`. Use `tone="mono"` in dark bands and let
 * `currentColor` take the surrounding text colour.
 */

const RUST = "#CA3625";
const RUST_DEEP = "#AA2D29";

/**
 * The full lockup, one entry per path — and crucially, one entry per GLYPH.
 *
 * The source art keeps every letter of "geekdom" as its own path, which is what
 * makes the staggered intro possible without a Lottie: the letterforms are
 * already separated, so they can be revealed independently. Verified by reading
 * each path's absolute moveto anchor — the x values ascend left to right
 * (34, 70, 118, 203, 236, 286, 353) in exactly the order the word is spelled.
 *
 * `crown` marks the two pieces of the crown that sits above the "g". They are
 * NOT the same as `deep`: the crown's lower band is the dark rust, but its top
 * is the same rust as the letters.
 */
export const LOGO_VIEWBOX = "0 0 375 142";
export const LOGO_GEOMETRY = [
  { d: "M36.58,27.28c-0.02,0-0.05,0-0.07,0c-0.99,0.23-1.98,0.43-2.97,0.59c-5.43,0.88-10.99,0.68-16.35-0.59 c-0.02,0-0.05,0-0.07,0c-3.42,0.82-6.76,2.07-9.94,3.76c-0.11,0.06-0.11,0.21,0,0.27c8.19,4.3,17.45,5.73,26.36,4.31 c4.47-0.71,8.86-2.15,12.97-4.31c0.11-0.06,0.11-0.21,0-0.27C43.34,29.35,40,28.1,36.58,27.28", deep: true, crown: true } /* crown band */,
  { d: "M33.54,92.9V62.83c0-0.24-0.19-0.43-0.43-0.43h-8.95c-2.08,0-4,1.74-4,4V88.9c0,2.44,1.99,4.43,4.43,4.43h8.52 C33.35,93.33,33.54,93.14,33.54,92.9 M33.54,48.75v-3.48c0-0.24,0.19-0.43,0.43-0.43h12.34c0.24,0,0.43,0.19,0.43,0.43v74.04 c0,7.53-6.11,13.64-13.64,13.64H20.59c-0.24,0-0.43-0.19-0.43-0.43v-12.34c0-0.24,0.19-0.43,0.43-0.43h8.95c2.09,0,4-1.74,4-4v-8.78 c0-0.24-0.19-0.43-0.43-0.43H20.59c-7.54,0-13.65-6.11-13.65-13.64V62.83c0-7.53,6.11-13.64,13.65-13.64h12.51 C33.35,49.19,33.54,48.99,33.54,48.75", deep: false, crown: false } /* g */,
  { d: "M69.95,71.26h12.51c0.24,0,0.43-0.19,0.43-0.43v-4.43c0-2.26-1.91-4-4-4h-5.39c-2.08,0-4,1.74-4,4v4.43 C69.52,71.06,69.71,71.26,69.95,71.26 M82.47,49.19c7.53,0,13.64,6.11,13.64,13.64v21.21c0,0.24-0.19,0.43-0.43,0.43H69.95 c-0.24,0-0.43,0.19-0.43,0.43v4c0,2.44,1.99,4.43,4.43,4.43h15.12c0.24,0,0.43,0.19,0.43,0.43v12.34c0,0.24-0.19,0.43-0.43,0.43 H69.95c-7.54,0-13.65-6.11-13.65-13.64V62.83c0-7.53,6.11-13.64,13.65-13.64H82.47z", deep: false, crown: false } /* e */,
  { d: "M118.27,71.26h12.51c0.24,0,0.43-0.19,0.43-0.43v-4.43c0-2.26-1.91-4-4-4h-5.39c-2.08,0-4,1.74-4,4v4.43 C117.84,71.06,118.03,71.26,118.27,71.26 M130.79,49.19c7.53,0,13.64,6.11,13.64,13.64v21.21c0,0.24-0.19,0.43-0.43,0.43h-25.72 c-0.24,0-0.43,0.19-0.43,0.43v4c0,2.44,1.99,4.43,4.43,4.43h15.12c0.24,0,0.43,0.19,0.43,0.43v12.34c0,0.24-0.19,0.43-0.43,0.43 h-19.12c-7.54,0-13.65-6.11-13.65-13.64V62.83c0-7.53,6.11-13.64,13.65-13.64H130.79z", deep: false, crown: false } /* e */,
  { d: "M202.62,49.92l-15.75,15.92c-0.12,0.12-0.16,0.31-0.09,0.47l16.33,39.63c0.12,0.29-0.09,0.6-0.4,0.6h-13.31 c-0.17,0-0.33-0.11-0.4-0.27l-12.33-29.55c-0.12-0.29-0.49-0.36-0.71-0.14l-8.8,8.8c-0.08,0.08-0.13,0.19-0.13,0.31v20.42 c0,0.24-0.19,0.43-0.43,0.43h-12.34c-0.24,0-0.43-0.19-0.43-0.43V27.55c0-0.24,0.19-0.43,0.43-0.43h12.34 c0.24,0,0.43,0.19,0.43,0.43v38.14c0,0.39,0.47,0.58,0.74,0.31l16.69-16.69c0.08-0.08,0.19-0.13,0.31-0.13h17.55 C202.7,49.18,202.89,49.65,202.62,49.92", deep: false, crown: false } /* k */,
  { d: "M235.78,92.9V62.83c0-0.24-0.19-0.43-0.43-0.43H227c-2.45,0-4.43,1.98-4.43,4.43v22.51c0,2.08,1.74,4,4,4h8.78 C235.58,93.33,235.78,93.14,235.78,92.9 M235.78,48.75V27.55c0-0.24,0.19-0.43,0.43-0.43h12.34c0.24,0,0.43,0.19,0.43,0.43v78.56 c0,0.24-0.19,0.43-0.43,0.43H223c-7.54,0-13.65-6.11-13.65-13.64V62.83c0-7.53,6.11-13.64,13.65-13.64h12.34 C235.58,49.19,235.78,48.99,235.78,48.75", deep: false, crown: false } /* d */,
  { d: "M285.83,66.39c0-2.26-1.74-4-3.82-4h-4.95c-2.45,0-4.43,1.98-4.43,4.43v22.51c0,2.08,1.74,4,4,4h4.78 c2.44,0,4.43-2,4.43-4.43V66.39z M285.4,49.19c7.63,0,13.82,6.19,13.82,13.82v29.9c0,7.53-6.11,13.64-13.64,13.64h-12.51 c-7.54,0-13.65-6.11-13.65-13.64V62.83c0-7.53,6.11-13.64,13.65-13.64H285.4z", deep: false, crown: false } /* o */,
  { d: "M353.36,49.19c7.53,0,13.64,6.11,13.64,13.64v43.28c0,0.24-0.19,0.43-0.43,0.43h-12.34 c-0.24,0-0.43-0.19-0.43-0.43V66.83c0-2.45-1.98-4.43-4.43-4.43c-2.45,0-4.43,1.98-4.43,4.43v39.28c0,0.24-0.19,0.43-0.43,0.43 h-12.34c-0.24,0-0.43-0.19-0.43-0.43V66.83c0-2.45-1.98-4.43-4.43-4.43c-2.45,0-4.43,1.98-4.43,4.43v39.28 c0,0.24-0.19,0.43-0.43,0.43h-12.34c-0.24,0-0.43-0.19-0.43-0.43V45.27c0-0.24,0.19-0.43,0.43-0.43h12.34 c0.24,0,0.43,0.19,0.43,0.43v3.48c0,0.24,0.19,0.43,0.43,0.43h8.43c2.19,0,4.37,0.49,6.4,1.62c0.13,0.07,0.28,0.07,0.41,0 c2.03-1.13,4.21-1.62,6.4-1.62H353.36z", deep: false, crown: false } /* m */,
  { d: "M37.57,13.73L26.94,5.8c-0.05-0.04-0.12-0.04-0.18,0l-10.63,7.93c-0.05,0.04-0.11,0.04-0.16,0.01l-8.8-5.15 C7.07,8.53,6.95,8.6,6.95,8.71v17.25c0,0.11,0.12,0.18,0.21,0.13c3.19-1.7,6.55-2.96,9.99-3.78c5.38-1.28,10.95-1.48,16.39-0.6 c1.01,0.16,2.01,0.36,3.01,0.6c3.44,0.82,6.8,2.08,9.99,3.78c0.1,0.05,0.21-0.02,0.21-0.13V8.71c0-0.11-0.12-0.19-0.22-0.13 l-8.8,5.15C37.68,13.77,37.62,13.77,37.57,13.73", deep: false, crown: true } /* crown top */,
] as const;

/**
 * Paths only, for renderers that can't use the component.
 *
 * The OG image route draws through Satori, which understands `<svg>`/`<path>`
 * but ignores `className` entirely — so it can't reuse <Logo/> and needs raw
 * geometry plus explicit dimensions. Same source of truth, two renderers.
 */
export const LOGO_PATHS = LOGO_GEOMETRY.map((p) => p.d);

const CROWN_VIEWBOX = "0 0 55 41";
const CROWN_GEOMETRY = [
  { d: "M36.58,27.28c-0.02,0-0.05,0-0.07,0c-0.99,0.23-1.98,0.43-2.97,0.59c-5.43,0.88-10.99,0.68-16.35-0.59 c-0.02,0-0.05,0-0.07,0c-3.42,0.82-6.76,2.07-9.94,3.76c-0.11,0.06-0.11,0.21,0,0.27c8.19,4.3,17.45,5.73,26.36,4.31 c4.47-0.71,8.86-2.15,12.97-4.31c0.11-0.06,0.11-0.21,0-0.27C43.34,29.35,40,28.1,36.58,27.28", deep: true },
  { d: "M37.57,13.73L26.94,5.8c-0.05-0.04-0.12-0.04-0.18,0l-10.63,7.93c-0.05,0.04-0.11,0.04-0.16,0.01l-8.8-5.15 C7.07,8.53,6.95,8.6,6.95,8.71v17.25c0,0.11,0.12,0.18,0.21,0.13c3.19-1.7,6.55-2.96,9.99-3.78c5.38-1.28,10.95-1.48,16.39-0.6 c1.01,0.16,2.01,0.36,3.01,0.6c3.44,0.82,6.8,2.08,9.99,3.78c0.1,0.05,0.21-0.02,0.21-0.13V8.71c0-0.11-0.12-0.19-0.22-0.13 l-8.8,5.15C37.68,13.77,37.62,13.77,37.57,13.73", deep: false },
] as const;

type Tone = "brand" | "mono";

function fills(tone: Tone) {
  return tone === "mono"
    ? { main: "currentColor", deep: "currentColor" }
    : { main: RUST, deep: RUST_DEEP };
}

/**
 * Per-glyph delays, in ms, indexed to LOGO_GEOMETRY.
 *
 * Index order is [crown band, g, e, e, k, d, o, m, crown top].
 *
 * IN — the seven letters sweep left to right on a 40ms stagger; the two crown
 * pieces land last, once the word they cap actually exists. Reading order
 * first, then the flourish — the reverse reads as the crown waiting around for
 * the letters to catch up. Last glyph starts at 310ms over 460ms, so the intro
 * settles inside ~770ms; longer and it stops feeling like part of page load.
 *
 * OUT — the same sweep in reverse, right to left, so "m" leaves first and "g"
 * last. That direction matters: the crown sits above the "g" at the far left,
 * so unspooling toward it makes the word look like it's being drawn into the
 * mark that survives. Left-to-right would strand the crown alone at the end of
 * an empty run.
 *
 * Tighter than the intro (26ms vs 40ms) because each glyph's own animation is
 * also shorter — the whole exit clears in ~365ms so the crown can take over
 * without a wait.
 */
const GLYPH_DELAYS_MS = {
  in: [270, 0, 40, 80, 120, 160, 200, 240, 310],
  out: [185, 156, 130, 104, 78, 52, 26, 0, 195],
} as const;

/**
 * Which way the glyphs are moving.
 *
 * `"none"` renders statically with no animation classes at all — the default,
 * and what the footer, login and 404 marks use.
 */
export type LogoPhase = "none" | "in" | "out";

export interface LogoProps {
  tone?: Tone;
  className?: string;
  /** Accessible name. Pass "" for a decorative mark beside visible text. */
  title?: string;
  /**
   * Inline styles, for animated properties.
   *
   * The navbar drives opacity/transform from React state with per-direction
   * timings, which can't be expressed as static Tailwind classes.
   */
  style?: React.CSSProperties;
  /**
   * Drive the per-glyph animation.
   *
   * Used by exactly one instance — the navbar, which flips between `"in"` and
   * `"out"` as the page scrolls. Everything else leaves it at `"none"`: an
   * intro on a logo below the fold is motion nobody asked for and nobody sees.
   */
  phase?: LogoPhase;
}

/** Crown + wordmark. The primary mark — navbar, footer, login. */
export function Logo({
  tone = "brand",
  className,
  title = "Geekdom",
  style,
  phase = "none",
}: LogoProps) {
  const { main, deep } = fills(tone);
  const animated = phase !== "none";
  const delays = animated ? GLYPH_DELAYS_MS[phase] : null;

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn("h-10 w-auto", className)}
      style={style}
    >
      {LOGO_GEOMETRY.map((p, i) => (
        <path
          key={p.d}
          fill={p.deep ? deep : main}
          d={p.d}
          className={
            animated
              ? cn(
                  "logo-glyph",
                  p.crown && "logo-glyph--crown",
                  phase === "out" && "logo-glyph--out",
                )
              : undefined
          }
          style={delays ? { animationDelay: `${delays[i]}ms` } : undefined}
        />
      ))}
    </svg>
  );
}

/** Crown only. For tight spots — the navbar's scrolled state, share cards. */
export function LogoCrown({
  tone = "brand",
  className,
  title = "Geekdom",
  style,
}: LogoProps) {
  const { main, deep } = fills(tone);

  return (
    <svg
      viewBox={CROWN_VIEWBOX}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      className={cn("h-8 w-auto", className)}
      style={style}
    >
      {CROWN_GEOMETRY.map((p) => (
        <path key={p.d} fill={p.deep ? deep : main} d={p.d} />
      ))}
    </svg>
  );
}

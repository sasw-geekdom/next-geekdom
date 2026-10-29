"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { FrameView, Lockup } from "@/components/field-notes/frame-view";
import { FRAUNCES_VARIABLE } from "@/components/site/editorial";
import { useWheelSideways } from "@/components/field-notes/side-scroller";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Frame, NoteImage } from "@/lib/field-notes/types";

/*
  THE FIELD NOTES READER — one frame at a time, on a stage, in two modes.

  "scroll" (the note page): SCROLL-DRIVEN. The page scrolls normally; the
  stage PINS under the navbar while you scroll through the note's section,
  and the vertical scroll slides the frames sideways — wheel, trackpad,
  space, the scrollbar, a phone's swipe up. A sideways swipe (trackpad or
  finger) moves it too. When you stop between two frames it SETTLES on the
  nearest one. When the last frame is centered the pin lets go and the page
  carries on. The arrows, ←/→ and the progress segments scroll the page to
  each frame's exact position — the accessible, precise way through.

  "stage" (the admin preview, reduced motion, a one-frame note): the same
  stage with a native horizontal scroll-snap track and no pinning.

  The ONE scroll effect lives here too: in scroll mode the cover photo
  drifts a few percent slower than its frame as you scroll off it
  (`--fn-drift`, `.fn-drift` in globals.css). Tied to the scroll position,
  never to a timer, and absent in stage mode and for reduced motion.

  Both: the current frame centered and as LARGE AS THE WINDOW ALLOWS — sized
  from the window's HEIGHT less `chrome` (a 4:5 frame is height-bound on
  every laptop and monitor: MacBook Air ≈ 600×750, 2560×1440 ≈ 990×1230).
  Type is in `cqw` of the frame, so it scales; photos have 2400px copies.
  Neighbors stay as dimmed slivers, 96px off the stage with the arrows
  centered in that gap; on a phone 86% width and a 12px gap so the next one
  still peeks. DIMMED BY GROUND: a Bone frame's big type at 45% still read
  and competed with the frame on stage, so Bone frames dim to 30%; Graphite
  and photo frames stay at 45% (a Graphite frame at 35% went flat grey).
  Off-stage frames are `inert`, so focus and screen readers stay on the
  frame being shown. ←/→ work page-wide unless you're typing.

  THE NOTE'S EDGES. On the cover, "Scroll to read →" sits by the count
  until the first move (the scroll-to-go-sideways mapping is new to most
  readers). After the last frame, an UP NEXT card (`next`) links the next
  note — one more stop on the track, not a frame of the note, so the
  progress counts the note's frames and then reads "Up next". And the
  pinned header's title stays hidden while the cover is on stage
  (`group-data-[cover]/reader` — the cover already prints it).
*/

/** The note after this one, for the reader's closing card. */
export type NextNote = { href: string; title: string; dek: string; series: string; image?: NoteImage };

type Props = {
  frames: Frame[];
  label?: string;
  /** Height taken by everything else on screen around the frame. */
  chrome?: string;
  /** "scroll" pins and scrubs with the page; "stage" is a swipeable track. */
  mode?: "scroll" | "stage";
  /** Rendered above the stage — inside the pin in scroll mode, so it stays. */
  header?: React.ReactNode;
  /** The closing "Up next" card, after the last frame. */
  next?: NextNote | null;
  className?: string;
};

export function FrameReader({ mode = "stage", ...props }: Props) {
  const reduce = useReducedMotion();
  if (mode === "scroll" && !reduce && props.frames.length > 1) return <ScrollReader {...props} />;
  return <StageReader {...props} />;
}

/** `.fn-fw` in globals.css turns this into `--fw`, the frame's width. */
const fwVar = (chrome: string) => ({ "--fn-chrome": chrome }) as React.CSSProperties;

/** How far a neighbor dims — by its ground (see the header). */
const dimOf = (f: Frame) =>
  f.type === "image" || f.type === "video" || (f.type === "cover" && (f.image || f.ground === "graphite")) || ("ground" in f && f.ground === "graphite")
    ? "opacity-45 hover:opacity-70"
    : "opacity-30 hover:opacity-60";

/** The closing card: the next note, as one more stop on the track. */
function UpNext({ next }: { next: NextNote }) {
  const series = next.series.split("│")[0].trim();
  return (
    <Link
      href={next.href}
      className={cn(
        "fn-frame group flex w-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone",
        FRAUNCES_VARIABLE,
      )}
      data-ground="graphite"
    >
      {next.image ? (
        <span className="block h-[52%] shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- graded WebP/JPEG */}
          <img src={next.image.srcSm} alt="" width={next.image.width} height={next.image.height} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        </span>
      ) : null}
      <span className="flex flex-1 flex-col p-[8cqw] pb-[15cqw]">
        <span className="font-mono text-[2.6cqw] uppercase tracking-[0.18em] text-bone/70">
          Up next{series ? ` · ${series}` : ""}
        </span>
        <span className="mt-[3cqw] text-balance text-[7cqw] font-medium leading-[1.08] tracking-[-0.02em] decoration-clay decoration-[0.4cqw] underline-offset-[1cqw] group-hover:underline">
          {next.title}
        </span>
        {next.dek && !next.image && (
          <span className="mt-[3cqw] text-[4.4cqw] leading-[1.35] text-bone/80" style={{ fontFamily: "var(--font-fraunces), Georgia, serif", fontStyle: "italic" }}>
            {next.dek}
          </span>
        )}
        <span className="mt-auto inline-flex items-center gap-[1.5cqw] pt-[4cqw] text-[3.6cqw] font-medium">
          Read it
          <ArrowRight aria-hidden="true" className="size-[4cqw] transition-transform group-hover:translate-x-[0.6cqw]" />
        </span>
      </span>
      <Lockup dark />
    </Link>
  );
}

const SIDE =
  "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-border bg-bone-light/90 text-graphite backdrop-blur transition-[opacity,border-color] duration-300 hover:border-graphite disabled:pointer-events-none disabled:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay md:flex";

/** Hidden while scrolling — but never from a keyboard user who's on it. */
const QUIET = "opacity-0 pointer-events-none focus-visible:opacity-100 focus-visible:pointer-events-auto";

/** ← / → anywhere on the page, unless typing or using a modifier. */
function usePageArrows(step: (d: 1 | -1) => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [step]);
}

/** The frames, the side arrows and the progress — shared by both modes. */
function Stage({
  frames,
  next,
  index,
  go,
  reduce,
  trackRef,
  trackProps,
  quiet = false,
  hint,
}: {
  frames: Frame[];
  next?: NextNote | null;
  index: number;
  go: (i: number) => void;
  reduce: boolean;
  /** Hide the side arrows (while the page is scrolling). */
  quiet?: boolean;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackProps: React.HTMLAttributes<HTMLDivElement>;
  /** "Scroll to read →" by the count, until the reader first moves. */
  hint?: boolean;
}) {
  const n = frames.length;
  const total = n + (next ? 1 : 0);
  const slide = (key: string, i: number, dim: string, body: React.ReactNode, label: string) => {
    const on = i === index;
    return (
      <div
        key={key}
        role="group"
        aria-roledescription="slide"
        aria-label={label}
        aria-current={on ? "true" : undefined}
        onClick={on ? undefined : () => go(i)}
        className={cn("shrink-0 snap-center", !on && "cursor-pointer", !reduce && "transition-opacity duration-300", on ? "opacity-100" : dim)}
        style={{ width: "var(--fw)" }}
      >
        <div inert={!on}>{body}</div>
      </div>
    );
  };
  return (
    <>
      <div className="relative">
        <div ref={trackRef} {...trackProps}>
          {frames.map((f, i) => slide(f.id, i, dimOf(f), <FrameView frame={f} className="w-full border border-border" />, `${i + 1} of ${n}`))}
          {next && slide("up-next", n, "opacity-45 hover:opacity-70", <UpNext next={next} />, "Up next")}
        </div>
        {/*
          Centered in the 96px gap beside the stage — never over a frame.
          QUIET while the page scrolls: they fade out as scrolling starts and
          back in once it stops. A KEYBOARD-focused arrow never hides.
        */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous frame"
          className={cn(SIDE, quiet && QUIET)}
          style={{ left: "calc(50% - var(--fw) / 2 - 4.5rem)" }}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index >= total - 1}
          aria-label="Next frame"
          className={cn(SIDE, quiet && QUIET)}
          style={{ right: "calc(50% - var(--fw) / 2 - 4.5rem)" }}
        >
          <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
        </button>
      </div>

      {/* Progress, as segments under the frame — one per frame, filled to here. */}
      <div className="mx-auto mt-5 flex items-center gap-4" style={{ width: "var(--fw)" }}>
        <div className="flex flex-1 gap-1">
          {frames.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to frame ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              className="group flex-1 py-2 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block h-[3px] transition-colors group-focus-visible:ring-2 group-focus-visible:ring-clay",
                  i <= index ? "bg-clay" : "bg-graphite/15 group-hover:bg-graphite/30",
                )}
              />
            </button>
          ))}
        </div>
        {hint && (
          <p aria-hidden="true" className="flex shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-graphite">
            <span className="sm:hidden">Swipe up</span>
            <ArrowUp className="size-3.5 sm:hidden" strokeWidth={1.7} />
            <span className="hidden sm:inline">Scroll to read</span>
            <ArrowRight className="hidden size-3.5 sm:block" strokeWidth={1.7} />
          </p>
        )}
        <p aria-live="polite" className="shrink-0 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {index < n ? `${index + 1} / ${n}` : "Up next"}
        </p>
      </div>
    </>
  );
}

// ─── Stage: a swipeable scroll-snap track, no pinning ───────────────────────

function StageReader({ frames, next, label = "Field Note", chrome = "14rem", header, className }: Props) {
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const indexRef = React.useRef(0);
  const reduce = useReducedMotion();
  const n = frames.length + (next ? 1 : 0);

  const measure = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    ([...el.children] as HTMLElement[]).forEach((k, i) => {
      const d = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    indexRef.current = best;
    setIndex(best);
  }, []);

  const go = React.useCallback(
    (i: number, smooth = true) => {
      const el = track.current;
      const target = el?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined;
      if (!el || !target) return;
      el.scrollTo({ left: target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [n, reduce],
  );

  useWheelSideways(track);
  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => go(indexRef.current, false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [go]);
  usePageArrows(React.useCallback((d: 1 | -1) => go(indexRef.current + d), [go]));

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      data-cover={index === 0 ? "" : undefined}
      className={cn("group/reader @container", className)}
    >
      {header}
      {/* `--fw` sits INSIDE the container: container units in an element's
          own style resolve against its parent, not itself. */}
      <div className="fn-fw" style={fwVar(chrome)}>
        <Stage
          frames={frames}
          next={next}
          index={index}
          go={go}
          reduce={reduce}
          trackRef={track}
          trackProps={{
            // Lenis would move the PAGE under a swipeable track; in scroll
            // mode the page's own scroll is the point, so only here.
            ...({ "data-lenis-prevent": "" } as React.HTMLAttributes<HTMLDivElement>),
            onScroll: measure,
            className: cn(
              "relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scrollbar-none sm:gap-24 [&::-webkit-scrollbar]:hidden",
              !reduce && "scroll-smooth",
            ),
            style: { paddingInline: "calc((100cqw - var(--fw)) / 2)" },
          }}
        />
      </div>
    </section>
  );
}

// ─── Scroll: pinned, scrubbed by the page's vertical scroll ─────────────────

/** Vertical scroll per frame, as a fraction of the window's height. */
const STEP = 0.8;
const NAVBAR = 64; // the site navbar is sticky at 4rem

function ScrollReader({ frames, next, label = "Field Note", chrome = "14rem", header, className }: Props) {
  const outer = React.useRef<HTMLElement>(null);
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const indexRef = React.useRef(0);
  // Stops on the track: the frames, plus the Up next card.
  const n = frames.length + (next ? 1 : 0);
  // The hint goes for good at the first move off the cover (set in `update`).
  const [moved, setMoved] = React.useState(false);

  // Where the pinned stretch starts and ends, in page scroll pixels.
  const range = React.useCallback(() => {
    const el = outer.current;
    if (!el) return { start: 0, end: 1 };
    const start = el.getBoundingClientRect().top + window.scrollY - NAVBAR;
    const end = start + el.offsetHeight - (window.innerHeight - NAVBAR);
    return { start, end: Math.max(end, start + 1) };
  }, []);

  /** The horizontal distance between two frames' centers. */
  const pitch = React.useCallback(() => {
    const k = track.current?.children;
    return k && k.length > 1 ? (k[1] as HTMLElement).offsetLeft - (k[0] as HTMLElement).offsetLeft : 0;
  }, []);

  // Scroll position → horizontal position. Written straight to the track's
  // transform each frame; React only re-renders when the INDEX changes.
  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const { start, end } = range();
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      const pos = p * (n - 1);
      if (track.current) {
        track.current.style.transform = `translate3d(${-pos * pitch()}px, 0, 0)`;
        // The cover's drift: 0 on the cover, 1 once the next frame is on stage.
        track.current.style.setProperty("--fn-drift", String(Math.min(pos, 1)));
      }
      const i = Math.round(pos);
      if (i !== indexRef.current) {
        indexRef.current = i;
        setIndex(i);
        if (i > 0) setMoved(true);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [n, range, pitch]);

  const scrollToY = React.useCallback((y: number) => {
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(y, { duration: 0.7 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  const go = React.useCallback(
    (i: number) => {
      const { start, end } = range();
      const c = Math.max(0, Math.min(n - 1, i));
      scrollToY(start + (c / (n - 1)) * (end - start));
    },
    [n, range, scrollToY],
  );

  /*
    SETTLE ON THE NEAREST FRAME. Not "when scroll events stop": Lenis's glide
    keeps firing them for a second after the wheel does, so that waited out
    the whole glide, then animated, then corrected — ~3s. Lenis already knows
    where a glide will END (`targetScroll`), so 140ms after the last wheel or
    touch input the glide is REDIRECTED to the nearest frame: one motion,
    landing exactly. Scroll events stay as the fallback for the scrollbar,
    keyboard paging and no-Lenis (touch) scrolling.
  */
  React.useEffect(() => {
    let t: number | undefined;
    const settle = () => {
      const { start, end } = range();
      const lenis = window.__lenis;
      const dest = lenis ? lenis.targetScroll : window.scrollY;
      if (dest <= start + 1 || dest >= end - 1) return;
      const target = start + (Math.round(((dest - start) / (end - start)) * (n - 1)) / (n - 1)) * (end - start);
      if (Math.abs(target - dest) > 1) scrollToY(target);
    };
    const after = (ms: number) => () => {
      window.clearTimeout(t);
      t = window.setTimeout(settle, ms);
    };
    const onInput = after(140);
    const onScroll = after(220);
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("touchend", onInput, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("touchend", onInput);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, [n, range, scrollToY]);

  // A SIDEWAYS swipe moves it too: trackpad horizontal wheel, and a finger
  // dragged sideways, mapped to page scroll so one frame across is one step.
  React.useEffect(() => {
    const el = outer.current;
    if (!el) return;
    const ratio = () => (STEP * window.innerHeight) / Math.max(pitch(), 1);
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const lenis = window.__lenis;
      const dy = e.deltaX * ratio();
      if (lenis) lenis.scrollTo(lenis.targetScroll + dy, { immediate: true });
      else window.scrollBy(0, dy);
    };
    let x0 = 0;
    let y0 = 0;
    let sideways: boolean | null = null;
    const onStart = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
      sideways = null;
    };
    const onMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - x0;
      const dy = e.touches[0].clientY - y0;
      if (sideways === null && Math.hypot(dx, dy) > 8) sideways = Math.abs(dx) > Math.abs(dy);
      if (!sideways) return;
      e.preventDefault();
      window.scrollBy(0, -dx * ratio());
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [pitch]);

  usePageArrows(React.useCallback((d: 1 | -1) => go(indexRef.current + d), [go]));

  // Scrolling right now? The side arrows step aside while it is.
  const [moving, setMoving] = React.useState(false);
  React.useEffect(() => {
    let t: number | undefined;
    const onScroll = () => {
      setMoving(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMoving(false), 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <section
      ref={outer}
      aria-roledescription="carousel"
      aria-label={label}
      data-cover={index === 0 ? "" : undefined}
      className={cn("group/reader relative", className)}
      // The pinned stretch: one window, plus a step of scroll per frame after the first.
      style={{ height: `calc(100svh - ${NAVBAR}px + ${(n - 1) * STEP * 100}svh)` }}
    >
      {/* Top-aligned on a phone (the frame is width-bound there, and centering
          left ~115px empty above the title); centered from sm up. */}
      <div className="@container sticky flex h-[calc(100svh-4rem)] flex-col justify-start overflow-hidden pt-4 sm:justify-center sm:pt-0" style={{ top: NAVBAR }}>
        {header}
        <div className="fn-fw" style={fwVar(chrome)}>
          <Stage
            frames={frames}
            next={next}
            hint={index === 0 && !moved}
            index={index}
            go={go}
            reduce={false}
            quiet={moving}
            trackRef={track}
            trackProps={{
              // `fn-drifting` turns on the cover photo's drift (globals.css).
              className: "fn-drifting relative flex gap-3 will-change-transform sm:gap-24",
              style: { paddingInline: "calc((100cqw - var(--fw)) / 2)" },
            }}
          />
        </div>
      </div>
    </section>
  );
}

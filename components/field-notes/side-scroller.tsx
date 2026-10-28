"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/*
  THE SIDEWAYS TRACK behind Field Notes — the reader's frames and the index's
  shelf of notes both scroll this way, read left to right like an Instagram
  carousel (Jesse's reference).

    · A horizontal scroll-snap track. Touch swipes natively; nothing here
      reimplements a gesture.
    · ← / → (when the track has focus), the arrow buttons, and a "3 / 9"
      counter, which is also announced.
    · A VERTICAL WHEEL MOVES IT SIDEWAYS on a desktop with a mouse — a reader
      who scrolls down shouldn't have to discover shift+wheel — but only
      while the track can still move that way, so the page scroll is never
      trapped at either end.
    · `data-lenis-prevent`: the public site's scroll glide (Lenis) listens on
      the window and would otherwise move the page underneath.
    · Reduced motion: no smooth scrolling.
    · "Next" disables at the END OF THE TRACK, not on the last item: on a
      shelf several items fit on screen, so the last one is never "current".

  Semantics: a region with `aria-roledescription="carousel"`, each item a
  group labeled "3 of 9" — the WAI carousel pattern, minus auto-rotation,
  which it should never have. `@container`, so item widths follow the
  track's width, not the window's (the admin preview's phone toggle).
*/

/**
 * A vertical wheel moves a horizontal track sideways — while it can still
 * move that way, so the page scroll is never trapped at either end. Shared by
 * the shelf and the reader's stage.
 */
export function useWheelSideways(track: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      const canMove = e.deltaY > 0 ? el.scrollLeft < max - 1 : el.scrollLeft > 1;
      if (!canMove) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [track]);
}

export function SideScroller({
  label,
  noun,
  items,
  itemClassName,
  className,
}: {
  label: string;
  /** "frame", "note" — for the buttons' labels. */
  noun: string;
  items: { key: string; node: React.ReactNode }[];
  /** Width of each item, in `cqw` of the track. */
  itemClassName: string;
  className?: string;
}) {
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [atEnd, setAtEnd] = React.useState(false);
  const reduce = useReducedMotion();
  const n = items.length;

  const measure = React.useCallback(() => {
    const el = track.current;
    if (!el) return;
    const kids = [...el.children] as HTMLElement[];
    let best = 0;
    let dist = Infinity;
    kids.forEach((k, i) => {
      const d = Math.abs(k.offsetLeft - el.offsetLeft - el.scrollLeft);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setIndex(best);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2);
  }, []);

  React.useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const go = React.useCallback(
    (i: number) => {
      const el = track.current;
      const target = el?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined;
      if (!el || !target) return;
      el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    },
    [n, reduce],
  );

  useWheelSideways(track);

  const button =
    "flex h-11 w-11 items-center justify-center border border-border bg-bone-light text-graphite transition-colors hover:border-graphite disabled:opacity-30 disabled:hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone";

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn("@container flex flex-col gap-5", className)}>
      <div
        ref={track}
        tabIndex={0}
        data-lenis-prevent
        onScroll={measure}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return; // let a focused link keep its keys
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        aria-label={`${label} — use the arrow keys to move between ${noun}s`}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone sm:gap-5",
          !reduce && "scroll-smooth",
        )}
      >
        {items.map((it, i) => (
          <div
            key={it.key}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            className={cn("shrink-0 snap-start", itemClassName)}
          >
            {it.node}
          </div>
        ))}
      </div>

      {n > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p aria-live="polite" className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
            {Math.min(index + 1, n)} / {n}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label={`Previous ${noun}`} className={button}>
              <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
            </button>
            <button type="button" onClick={() => go(index + 1)} disabled={atEnd} aria-label={`Next ${noun}`} className={button}>
              <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

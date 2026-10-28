"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FrameView } from "@/components/field-notes/frame-view";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { Frame } from "@/lib/field-notes/types";

/*
  THE FIELD NOTES READER — a note read SIDEWAYS, frame by frame, the way an
  Instagram carousel is (Jesse's reference). Built now because the admin's
  preview needs it; the public page will render this same component.

    · A horizontal scroll-snap track. Touch swipes natively; nothing here
      reimplements a gesture.
    · ← / → (when the track has focus), the arrow buttons, and a "3 / 9"
      counter, which is also announced.
    · A VERTICAL WHEEL MOVES IT SIDEWAYS on a desktop with a mouse — a
      reader who scrolls down shouldn't have to discover shift+wheel — but
      only while the track can still move that way, so the page scroll is
      never trapped at either end.
    · `data-lenis-prevent`: the public site's scroll glide (Lenis) listens
      on the window and would otherwise move the page underneath.
    · Reduced motion: no smooth scrolling between frames.

  Semantics: a region with `aria-roledescription="carousel"`, each frame a
  group labeled "3 of 9" — the WAI carousel pattern, minus auto-rotation,
  which it should never have.
*/

export function FrameReader({ frames, label = "Field Note", className }: { frames: Frame[]; label?: string; className?: string }) {
  const track = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const reduce = useReducedMotion();
  const n = frames.length;

  // Which frame is in view: the one whose left edge is nearest the track's.
  const onScroll = React.useCallback(() => {
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
  }, []);

  const go = React.useCallback(
    (i: number) => {
      const el = track.current;
      const target = el?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined;
      if (!el || !target) return;
      el.scrollTo({ left: target.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
    },
    [n, reduce],
  );

  // Vertical wheel → sideways, while there's room to move.
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
  }, []);

  const button =
    "flex h-11 w-11 items-center justify-center border border-border bg-bone-light text-graphite transition-colors hover:border-graphite disabled:opacity-30 disabled:hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone";

  return (
    // `@container`: frame widths are set from the READER's width, not the
    // window's, so the preview's phone toggle shows true phone proportions.
    <section aria-roledescription="carousel" aria-label={label} className={cn("@container flex flex-col gap-5", className)}>
      <div
        ref={track}
        tabIndex={0}
        data-lenis-prevent
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(index + 1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(index - 1);
          }
        }}
        aria-label={`${label} — use the arrow keys to move between frames`}
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-4 focus-visible:ring-offset-bone sm:gap-5",
          !reduce && "scroll-smooth",
        )}
      >
        {frames.map((f, i) => (
          <div
            key={f.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${n}`}
            className="w-[min(86cqw,calc((100svh-14rem)*0.8))] shrink-0 snap-start @2xl:w-[min(44cqw,calc((100svh-14rem)*0.8),34rem)]"
          >
            <FrameView frame={f} className="w-full border border-border" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p aria-live="polite" className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
          {Math.min(index + 1, n)} / {n}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous frame" className={button}>
            <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index >= n - 1} aria-label="Next frame" className={button}>
            <ArrowRight className="h-4 w-4" strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </section>
  );
}

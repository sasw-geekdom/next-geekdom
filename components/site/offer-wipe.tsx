"use client";

import { useEffect, useRef } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

type Edge = "top" | "right" | "bottom" | "left";

/*
  The wipe collapsed against each edge. `inset()` runs top, right, bottom,
  left; a 100% inset on the side OPPOSITE an edge leaves a zero-height (or
  zero-width) sliver lying along that edge, which is where the fill grows
  from or shrinks back to.
*/
const COLLAPSED: Record<Edge, string> = {
  top: "inset(0 0 100% 0)",
  right: "inset(0 0 0 100%)",
  bottom: "inset(100% 0 0 0)",
  left: "inset(0 100% 0 0)",
};

/** Whichever edge of the box the pointer is nearest to. */
function nearestEdge(box: DOMRect, x: number, y: number): Edge {
  const d: Record<Edge, number> = {
    top: y - box.top,
    right: box.right - x,
    bottom: box.bottom - y,
    left: x - box.left,
  };
  return (Object.keys(d) as Edge[]).reduce((a, b) => (d[b] < d[a] ? b : a));
}

/**
 * THE HOVER FILL FOR AN `Offering` PANEL, AND IT FOLLOWS THE POINTER. It
 * grows in from whichever edge the mouse crossed on the way in and retreats
 * toward whichever edge it left by, so the fill reads as pushed by the
 * cursor rather than switched on.
 *
 * `clip-path: inset()`, not `scale`: the four insets interpolate
 * independently, so a fill can arrive from the left and leave through the
 * bottom without the transform-origin jumping mid-flight.
 *
 * Starting a new entry means placing the fill against the new edge WITHOUT
 * animating — otherwise it would sweep across from wherever the last exit
 * left it. Transition off, set the edge, force a reflow, transition back on,
 * then open.
 *
 * WITHOUT THIS SCRIPT the panel still works: `.offer:not([data-wipe])`
 * falls back to a plain bottom-up wipe on :hover (globals.css), which is
 * what renders before hydration. Keyboard focus opens it fully via CSS.
 * Touch is ignored — a tap follows the link, and a fill flashing in on the
 * way to the next page is noise.
 */
export function OfferWipe({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wipe = ref.current;
    const panel = wipe?.parentElement;
    if (!wipe || !panel) return;
    panel.dataset.wipe = "js";

    const enter = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const from = COLLAPSED[nearestEdge(panel.getBoundingClientRect(), e.clientX, e.clientY)];
      wipe.style.transition = "none";
      wipe.style.clipPath = from;
      void wipe.offsetWidth;
      wipe.style.transition = "";
      wipe.style.clipPath = "inset(0)";
    };
    const leave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      wipe.style.clipPath =
        COLLAPSED[nearestEdge(panel.getBoundingClientRect(), e.clientX, e.clientY)];
    };

    panel.addEventListener("pointerenter", enter);
    panel.addEventListener("pointerleave", leave);
    return () => {
      panel.removeEventListener("pointerenter", enter);
      panel.removeEventListener("pointerleave", leave);
      delete panel.dataset.wipe;
    };
  }, []);

  /*
    ABOVE the real layer, not behind it — it carries the inverted type, so it
    has to paint over the original. `pointer-events-none` lets every click
    fall through to the link's stretched hit area underneath.
  */
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("offer-wipe pointer-events-none absolute inset-0", className)}
    >
      {children}
    </div>
  );
}

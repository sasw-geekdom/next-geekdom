"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * THE GLIDE. Wheel and trackpad scrolling eases to a stop instead of moving
 * 1:1 with the input — Geekdom asked for "soft scrolling" and, asked whether
 * that meant content easing in or the page gliding, the answer was both. The
 * easing-in half is `.reveal` / `reveal-children` in globals.css and needs no
 * JS; this is the other half, and it is the one piece that must.
 *
 * WHAT IT LEAVES ALONE, on purpose:
 *
 *   · TOUCH. `syncTouch` stays off, so phones and tablets scroll natively.
 *     Their scrolling already has momentum, and replacing it is what makes
 *     smooth-scroll sites feel wrong on a phone.
 *   · REDUCED MOTION. Checked once at mount and Lenis never starts, so the
 *     page is the browser's own. (Not `useReducedMotion`: this renders
 *     nothing, so there is no hydration branch to protect, and a one-shot
 *     read inside an effect is all it needs.)
 *   · NESTED SCROLLERS. `allowNestedScroll` hands the wheel to any scrollable
 *     element under the pointer — the combobox list on /apply, the mobile
 *     drawer — rather than gliding the page behind it.
 *   · ADMIN. Mounted in the (site) layout only.
 *
 * IT STILL SCROLLS THE WINDOW. Lenis animates `window.scrollTo`, so scroll
 * events, IntersectionObserver, the navbar's hide-on-scroll, motion's
 * `useScroll` on /since-2011 and CSS `animation-timeline: view()` all see an
 * ordinary scroll and need nothing from here.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      // Soft, not floaty: ~1s to settle from a flick.
      lerp: 0.1,
      anchors: true,
      allowNestedScroll: true,
    });
    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  /*
    ON NAVIGATION, ADOPT WHEREVER THE ROUTER PUT THE WINDOW. Lenis may still
    be mid-glide from the last page and would carry on toward its old target,
    dragging the new page with it. Not `scrollTo(0)`: that would override
    Back/Forward restoring your position and any #hash link. One frame's wait
    lets the router finish its own scroll first; `immediate` then snaps
    Lenis's target to it without animating.
  */
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      window.__lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

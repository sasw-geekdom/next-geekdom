"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/site";
import { ButtonLink } from "@/components/ui/button";
import { Logo, LogoCrown } from "@/components/site/logo";
import { Container } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/*
  Logo slot, in px. Derived from the marks' own aspect ratios so neither
  distorts:

    full lockup  375 × 142  → at 36px tall, 95.1px wide  → 96
    crown         55 ×  41  → at 28px tall

  The crown is set shorter than the lockup on purpose. Matching their total
  heights would render a crown three times the size of the one sitting above the
  "g" in the full mark, which reads as a different logo rather than a condensed
  one.

  THE SLOT WIDTH NEVER CHANGES, and that's the whole point. An earlier version
  animated it 96 → 38 to make the box "collapse". `width` is a LAYOUT property:
  every frame of that transition forced a reflow of the header's flex row and
  physically shoved the nav links sideways. That reflow — not the crossfade —
  is what read as a hard jump.

  Checked against anthropic.com/claude/fable, which prompted this: their header
  animates NOTHING about the logo on scroll. `logoDesktop`/`logoMobile` swap on
  `@media (min-width: 1250px)`, and there is not one transition, transform, or
  width rule on any logo class in their stylesheet. The only scroll motion is
  the whole header sliding on `transform: translateY(-100%)`. Their smoothness
  comes from staying off the layout path entirely, which is what this now does:
  opacity and transform only, both composited, zero reflow.
*/
const LOGO_BOX = { width: 96, height: 36 } as const;

/*
  Motion for the lockup → crown handoff. Plain CSS; no animation library.

  THE LOCKUP HAS NO OPACITY OF ITS OWN. That's the whole design: its nine glyphs
  animate themselves, staggered, via the `logo-glyph` classes in globals.css.
  An earlier version faded the whole <svg> out in 140ms, which meant the letters
  were gone before any per-letter stagger could be seen — the exit animation
  would have run entirely underneath an already-invisible element.

  So the sequence is a relay, not a crossfade:

    0–326ms   letters lift away right-to-left, "m" first, "g" last
    185–365   the lockup's own crown pieces follow
    240–460   the standalone crown arrives, growing from CROWN_ENTER_SCALE

  The 125ms where both crowns are on screen is deliberate, not sloppy timing.
  They share a left edge, so the small one fading while the large one grows out
  of it is the bridge between the two elements — kill the overlap and the crown
  visibly disappears before its replacement shows up.

  CROWN_ENTER_SCALE is the number that sells it. The crown inside the full
  lockup renders about 8px tall against the standalone one's 28px, so starting
  the big crown at just over half size and letting it scale up reads as that
  same crown enlarging, not a second, larger crown fading in over the top.

  ~460ms end to end. Longer than that and it stops feeling like a response to
  the scroll and starts feeling like something you have to wait out.

  Leaving (scroll back up) is deliberately unbalanced: the crown clears in
  130ms with no delay, because the letters are already sweeping back in behind
  it and a slow crown exit would collide with the "g".
*/
const EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const CROWN_ENTER_DELAY_MS = 240;
const CROWN_ENTER_MS = 220;
const CROWN_LEAVE_MS = 130;
const CROWN_ENTER_SCALE = 0.55;

/*
  Hide-on-scroll, copied in spirit from the Fable header.

  This is the part doing most of the work in the reference: scroll down and the
  whole header slides away on `transform: translateY(-100%)`; scroll up and it
  comes straight back. One composited property on one element, so it can't jank
  regardless of what's rendering below it.

  HIDE_AFTER_PX keeps it visible through the hero — hiding a header on the first
  flick of the wheel reads as a glitch. DELTA_NOISE_PX ignores sub-pixel scroll
  and iOS rubber-banding, which otherwise flip the direction several times a
  second and make the header flicker at the top and bottom of the page.
*/
const HIDE_AFTER_PX = 160;
const DELTA_NOISE_PX = 4;

export function SiteNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  /*
    Collapse the lockup to the crown once the page moves.

    An IntersectionObserver on a 1px sentinel at the top of the document, not a
    scroll listener. Three reasons: the callback fires off the main thread's
    scroll path so there's no per-frame work and no need to debounce; it reports
    the correct state on mount, so a page restored mid-scroll (a refresh, a
    back-navigation, an #anchor) starts collapsed instead of popping on the
    first wheel event; and because setState happens in an external
    subscription's callback rather than synchronously in the effect body, it's
    the shape `react-hooks/set-state-in-effect` actually wants.
  */
  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  /*
    Scroll DIRECTION, for the hide-on-scroll slide.

    A listener rather than another observer, because direction is the one thing
    IntersectionObserver can't report — it tells you whether something crossed a
    line, not which way you were going.

    Kept cheap: `passive: true` so it never blocks scrolling, and coalesced into
    a single rAF so a burst of scroll events does at most one state update per
    frame. The handler itself only compares two numbers.
  */
  React.useEffect(() => {
    let lastY = window.scrollY;
    let queued = false;

    const update = () => {
      queued = false;
      const y = window.scrollY;
      const delta = y - lastY;
      if (Math.abs(delta) < DELTA_NOISE_PX) return;

      lastY = y;
      setHidden(delta > 0 && y > HIDE_AFTER_PX);
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * Close the drawer on navigation — the navbar survives the route change, so
   * without this the menu stays open over the new page.
   *
   * Adjusted during render rather than in an effect. React's own guidance is
   * that resetting state when a value changes belongs here: an effect would
   * paint the new page with the menu still open and then immediately re-render
   * to close it, which is both a visible flash and the cascading render the
   * `react-hooks/set-state-in-effect` rule exists to catch.
   */
  const [lastPath, setLastPath] = React.useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock body scroll while the drawer is open, so scrolling the overlay
  // doesn't scroll the page behind it.
  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Scroll sentinel. Sits above the sticky header in normal flow, so it
          leaves the viewport the moment the page moves. aria-hidden — it's a
          measurement device, not content. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />

      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border/70 bg-sand/85 backdrop-blur supports-backdrop-filter:bg-sand/70",
          "transition-transform duration-300 ease-out",
          // focus-within pulls the header back when someone tabs into it — a
          // keyboard user must never be moving focus through links parked
          // off-screen. `open` keeps it put while the mobile drawer is up,
          // which otherwise slides the drawer away mid-scroll.
          "focus-within:translate-y-0",
          hidden && !open && "-translate-y-full",
        )}
      >
        <Container>
          <nav
            aria-label="Main"
            className="flex h-16 items-center justify-between gap-6"
          >
            <Link
              href="/"
              className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-2"
            >
              {/*
                Both marks are always mounted and crossfade — swapping one for the
                other with a conditional would pop, since there'd be nothing to
                transition between.

                The slot is a fixed width, so nothing beside it ever reflows.
                `pointer-events-none` on the marks lets the whole area belong to
                the Link, including whichever one is currently transparent.

                title="" on both: the sr-only text is the link's accessible name.
                Leaving the default labels on would have a screen reader announce
                "Geekdom, Geekdom, Geekdom home".
              */}
              <span
                className="relative flex items-center"
                style={{ width: LOGO_BOX.width, height: LOGO_BOX.height }}
              >
                {/*
                  No inline opacity on the lockup — deliberately. Its glyphs
                  animate themselves from `phase`, and an <svg>-level fade would
                  hide them before the stagger could be seen. Flipping `phase`
                  swaps the keyframes, which is what restarts the animation.
                */}
                <Logo
                  title=""
                  phase={scrolled ? "out" : "in"}
                  className="pointer-events-none absolute left-0 h-9"
                />
                <LogoCrown
                  title=""
                  className="pointer-events-none absolute left-0 h-7"
                  style={{
                    opacity: scrolled ? 1 : 0,
                    // Grows in from roughly the size the crown renders at inside
                    // the lockup, so it reads as that crown enlarging rather
                    // than a second, bigger one appearing over it.
                    transform: scrolled
                      ? "none"
                      : `scale(${CROWN_ENTER_SCALE})`,
                    transformOrigin: "left center",
                    transition: scrolled
                      ? `opacity ${CROWN_ENTER_MS}ms ${EASE} ${CROWN_ENTER_DELAY_MS}ms, transform ${CROWN_ENTER_MS + 80}ms ${EASE} ${CROWN_ENTER_DELAY_MS}ms`
                      : `opacity ${CROWN_LEAVE_MS}ms ${EASE}, transform ${CROWN_LEAVE_MS}ms ${EASE}`,
                  }}
                />
              </span>
              <span className="sr-only">Geekdom home</span>
            </Link>

            <ul className="hidden items-center gap-8 md:flex">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-rust",
                        active ? "text-rust" : "text-ink/75",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              <ButtonLink href="/apply" size="sm" className="hidden sm:inline-flex">
                Apply
              </ButtonLink>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                className={buttonClass("ghost", "icon", "-mr-2 md:hidden")}
              >
                {open ? (
                  <X className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </nav>
        </Container>

        {open && (
          <div
            id="mobile-nav"
            className="border-t border-border bg-sand md:hidden"
          >
            <Container className="py-4">
              <ul className="flex flex-col">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-3 text-base font-medium text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/apply" size="lg" className="mt-3 w-full">
                Apply for membership
              </ButtonLink>
            </Container>
          </div>
        )}
      </header>
    </>
  );
}

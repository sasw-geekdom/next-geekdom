"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV } from "@/lib/site";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/site/logo";
import { Container } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button";

/*
  THE WORDMARK STAYS PUT. No scroll swap, no animation on the logo.

  It used to collapse to the solo crown once the page moved — first as a
  relay (the wordmark's glyphs lifting away one by one, the crown growing in),
  then, briefly, as a crossfade of the two whole marks. Captured mid-flight,
  the relay broke the primary mark apart: letters out of their lockup, "dom"
  shrunk, single glyphs in half-opacity red reading as pink. The 2026 guide
  says the marks are "never altered, rotated, or stretched" and never in
  "effects" — the rule that took the WebGL shader off the site. The crossfade
  kept the marks whole but still passed through a pink double exposure.

  And the swap barely earned it: the whole bar already slides away on scroll
  down (below), so the crown was mostly seen as the bar came back — two
  motions stacked on one moment. The wordmark, whole and in Geekdom Red,
  always, is the quieter answer.
*/

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
  const [hidden, setHidden] = React.useState(false);

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

      <header
        className={cn(
          // SOLID BONE, not a translucent blur. `bg-bone/70` + backdrop-blur
          // mixed with whatever scrolled beneath it: over the graphite hero it
          // rendered #B3B1AD, a grey that isn't in the palette, and Geekdom
          // flagged it as off-brand. A solid ground is #F4F1EB everywhere.
          "sticky top-0 z-50 border-b border-border/70 bg-bone",
          "transition-transform duration-300 ease-out",
          // KEYBOARD focus pulls the header back when someone tabs into it —
          // a keyboard user must never be moving focus through links parked
          // off-screen. `:focus-visible`, NOT `focus-within`: a mouse click on
          // a nav link leaves that link focused across the client-side
          // navigation, and `focus-within` then pinned the bar open for the
          // whole next page — "the navbar is always visible". `open` keeps it
          // put while the mobile drawer is up, which otherwise slides the
          // drawer away mid-scroll.
          "has-[:focus-visible]:translate-y-0",
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
              className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
            >
              {/*
                The wordmark alone, static — see "THE WORDMARK STAYS PUT" above.
                title="": the sr-only text is the link's accessible name.
              */}
              <Logo title="" className="h-9 w-auto" />
              <span className="sr-only">Geekdom home</span>
            </Link>

            {/*
              THE LINKS SIT WITH THE APPLY BUTTON, not in the middle of the bar.

              The nav used to be three children under `justify-between` — logo,
              links, button — which parks the links dead center. That reads as
              a site with a lot of sections, and this one has two: the Club and
              the Studio. Two words floating alone in the middle of a wide bar
              look stranded rather than restrained, and the gap between them
              and the Apply button grew with the viewport, so on a large
              external monitor they were nowhere near the action they belong
              to. The Club, Studio and Apply are one group — the three things
              the Geekdom team asked the nav to say — so they are one group in
              the markup.

              Two children now, so `justify-between` puts the logo hard left
              and this whole cluster hard right, at any width.

              A SIDE EFFECT WORTH KEEPING: the links are anchored to the RIGHT
              edge now, so the logo's width has no bearing on them at all.

              `gap-8` between the links and `gap-10` before the button: a CTA
              set at the same interval as the links reads as a third link that
              happens to have a background. The wider step is what makes it
              land as the end of the group rather than a member of it.
            */}
            <div className="flex items-center gap-10">
              <ul className="hidden items-center gap-8 md:flex">
                {NAV.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "text-sm font-medium transition-colors hover:text-graphite",
                          active ? "text-graphite" : "text-concrete",
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center gap-2">
                <ButtonLink
                  href="/apply"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
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
            </div>
          </nav>
        </Container>

        {open && (
          <div
            id="mobile-nav"
            className="border-t border-border bg-bone md:hidden"
          >
            <Container className="py-4">
              <ul className="flex flex-col">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="block py-3 text-base font-medium text-graphite"
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

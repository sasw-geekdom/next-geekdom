import { Container } from "@/components/site/section";
import { MOCK_PARTNERS } from "@/data/mock/partners";
import { cn } from "@/lib/utils";

/**
 * The logo wall — one line, drifting.
 *
 * WHY IT MOVES rather than wraps. These marks run from 7.4:1 (Launch SA) to
 * 0.8:1 (The Creative Futures), so no combination of height and gap fills even
 * rows — every wrap point left a lone logo stranded on a second line. A single
 * track sidesteps the arithmetic entirely, and it also lets the set grow later
 * without re-tuning the layout.
 *
 * WIDTH MATCHES THE PAGE. It sits inside the same Container as the navbar and
 * the hero, so the first mark starts on the headline's left edge and the track
 * ends where the measure does. An earlier version bled to the viewport, which
 * looked deliberate on its own and wrong directly under a hero that doesn't.
 *
 * THE TRACK IS DUPLICATED, and that is what makes the loop seamless: the
 * animation translates exactly -50%, so the second copy lands precisely where
 * the first began and the reset is invisible.
 *
 * Heights are area-balanced per mark, not uniform — the reasoning and the
 * arithmetic are in data/mock/partners.ts.
 */
export function PartnerRow() {
  if (MOCK_PARTNERS.length === 0) return null;

  // Rendered twice. `aria-hidden` on the copy so a screen reader hears the
  // list once rather than stuttering through ten logos twice.
  const track = [
    { items: MOCK_PARTNERS, clone: false },
    { items: MOCK_PARTNERS, clone: true },
  ];

  return (
    <div className="w-full pb-4 pt-10 sm:pt-12 short:pt-6 short:sm:pt-6">
      <Container>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Building this <span className="text-ink">with us</span>
        </p>

        {/*
          `overflow-x-auto`, not `hidden`. The animation does the work, but
          leaving it scrollable means the row is still reachable by hand — on a
          touchscreen, and for anyone who has asked for reduced motion and gets
          a stationary track. The scrollbar itself is hidden; the marks fading
          out at both edges is the affordance.
        */}
        <div
          className={cn(
            "partner-fade relative mt-5 overflow-x-auto overscroll-x-contain",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {/*
            The negative margin cancels the first item's own left padding, so
            the track starts flush with the label above rather than indented by
            one gap. The padding itself has to stay on the items — it is what
            keeps the gap at the loop seam identical to every other gap.
          */}
          <ul className="partner-marquee -ml-5 flex w-max items-center sm:-ml-7">
            {track.map(({ items, clone }) =>
              items.map((partner) => {
                const mark = partner.logo ? (
                  // A plain <img>: small fixed marks that never need a srcset,
                  // and `fill` would demand a positioned wrapper for each.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logo}
                    alt={clone ? "" : partner.name}
                    className={cn("w-auto max-w-none", partner.height ?? "h-8")}
                    loading="lazy"
                  />
                ) : (
                  // The fallback when a partner is agreed before its logo
                  // arrives — a wordmark, not a gap.
                  <span className="font-mono text-base uppercase tracking-[0.12em] text-ink/80">
                    {partner.name}
                  </span>
                );

                return (
                  <li
                    key={`${clone ? "clone" : "a"}-${partner.name}`}
                    aria-hidden={clone || undefined}
                    // Padding rather than a gap: the gap between the last mark
                    // of one copy and the first of the next has to match every
                    // other gap, or the seam shows on each loop.
                    className="shrink-0 px-5 sm:px-7"
                  >
                    {partner.href ? (
                      <a
                        href={partner.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        tabIndex={clone ? -1 : undefined}
                        className="block opacity-90 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                      >
                        {mark}
                      </a>
                    ) : (
                      <span className="block opacity-90">{mark}</span>
                    )}
                  </li>
                );
              }),
            )}
          </ul>
        </div>
      </Container>
    </div>
  );
}

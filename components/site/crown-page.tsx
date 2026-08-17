import { CrownShader, type MarkShape } from "@/components/site/crown-shader";

/*
  How each mark fills the rail. The two are sized on different axes because
  their proportions are opposite: the crown is 1.34 wide and shallow, so width
  is the useful constraint; the g-mark is 0.31, nearly four times taller than
  wide, so height is.

  The g-mark's mobile height is explicit rather than `h-full`. Below lg the rail
  is only max-capped, so its height is indefinite — `h-full` there resolves to
  auto, and paired with `w-auto` the canvas has no intrinsic size and collapses
  to nothing.
*/
const RAIL_SIZE: Record<MarkShape, string> = {
  crown: "w-full max-w-[min(34rem,calc(100svh-10rem))]",
  "g-mark":
    "h-[32svh] w-auto lg:h-full lg:max-h-[min(40rem,calc(100svh-9rem))]",
};
import { Eyebrow } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * Two-column page: the crown holding the left rail, content on the right.
 *
 * Modelled on the SASTW `FormPage` in the sibling repo — but used here for the
 * FAQ, the letter and the 404 as well as the forms, so it takes arbitrary
 * children rather than assuming a form underneath.
 *
 * The rail height is driven by a `--nav` custom property rather than an inline
 * `height`, so the sticky sizing can be scoped to `lg` in a class. An inline
 * style would apply at every width and give a phone a viewport-tall rail
 * holding a crown it isn't even showing.
 */
export function CrownPage({
  eyebrow,
  title,
  subtitle,
  children,
  /**
   * Height of the sticky header above this page. The site navbar is h-16; the
   * admin login renders on its own with no header at all, so it passes 0 and
   * the rail uses the full viewport.
   */
  navOffset = "4rem",
  /**
   * Show the crown above the content on small screens too.
   *
   * Off by default and deliberately so: on the forms and the FAQ a phone-sized
   * decorative canvas competes with the actual task for attention and battery,
   * and the mark is already in the navbar. The 404 turns it on because there
   * is no task there to compete with.
   */
  crownOnMobile = false,
  shape = "g-mark",
  /** Vertically centre the content column and hold the whole page to one screen. */
  fitViewport = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  navOffset?: string;
  crownOnMobile?: boolean;
  /**
   * Which mark holds the rail. The g-mark leads — it is the fuller lockup,
   * and its height gives the flow somewhere to travel; the crown alone is wide
   * and shallow, so the same shader reads as a flat wash inside it.
   */
  shape?: MarkShape;
  fitViewport?: boolean;
}) {
  return (
    <section
      style={{ "--nav": navOffset } as React.CSSProperties}
      className={cn(
        "mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-2 lg:gap-16 lg:py-0",
        fitViewport
          ? "py-8 lg:min-h-[calc(100svh-var(--nav))]"
          : "py-16",
      )}
    >
      {/*
        Left — the crown.

        `max-w-[min(34rem,…)]` caps on viewport height as well as width. Without
        the height term the square overflows its own rail on a short laptop and
        the crown's points get clipped by the sticky container.
      */}
      <div
        className={cn(
          "items-center justify-center lg:sticky lg:top-(--nav) lg:flex lg:h-[calc(100svh-var(--nav))] lg:self-start",
          crownOnMobile
            ? // Below lg it's a plain block in the flow. Capped at 30svh so
              // the copy underneath keeps most of the screen — stacked, the
              // crown and the copy compete for one budget, which is the exact
              // problem the two-column layout solves above lg.
              //
              // `lg:max-h-none` is not optional. Without the reset the mobile
              // cap keeps applying in the two-column layout, which squeezes the
              // rail to 30% of the viewport, start-aligns it against a centred
              // text column, and leaves the crown overflowing its own box with
              // its points clipped.
              "flex max-h-[36svh] lg:max-h-none [@media(max-height:560px)]:hidden"
            : "hidden",
        )}
      >
        <CrownShader shape={shape} className={RAIL_SIZE[shape]} />
      </div>

      {/* Right — the page itself */}
      <div className={cn("flex flex-col justify-center", !fitViewport && "lg:py-20")}>
        <header className="mb-10">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <div className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {subtitle}
            </div>
          )}
        </header>
        {children}
      </div>
    </section>
  );
}

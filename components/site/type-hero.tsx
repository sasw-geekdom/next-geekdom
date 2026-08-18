import { Container, Eyebrow, HEADING } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * Type carries the fold. No photograph.
 *
 * LEFT-ALIGNED, like everything else in the app. This was centred, and centring
 * was the single thing that made the hero read as a template: BleedHero,
 * CrownPage and every Section are left-aligned, so the homepage was the one
 * screen running a different alignment from the site around it. The break
 * became obvious the moment a left-aligned logo strip was added to its base —
 * two alignment systems, one viewport.
 *
 * For pages whose job is to make a CLAIM rather than show a room. The headline
 * runs to 8xl — roughly half again the size the old hero used — because a
 * cautious size undercuts an assertive sentence, and with no image competing
 * for the fold there is nothing else for the eye to land on.
 *
 * Pairs with BleedHero; see the note there on which pages get which.
 */
export function TypeHero({
  eyebrow,
  title,
  children,
  tail,
  size = "full",
  footer,
}: {
  eyebrow: React.ReactNode;
  /** Accent spans inside this use `text-rust` — this is a light ground. */
  title: React.ReactNode;
  children?: React.ReactNode;
  /** Optional quiet line under everything — a price, a scroll cue. */
  tail?: React.ReactNode;
  /**
   * `full` gives the claim the whole viewport. `compact` is a page header with
   * a list under it — a listing page that pushes its first row below the fold
   * is hiding the thing the visitor came for.
   */
  size?: "full" | "compact";
  /**
   * Pinned to the BASE of the hero, below the content.
   *
   * For the logo strip, which the reference site puts at the bottom of its own
   * hero. The content stays optically centred in the space that remains — the
   * wrapper takes `flex-1`, so the footer is subtracted from the box the
   * headline centres within rather than pushing it up.
   */
  footer?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col justify-center bg-sand",
        // `short:py-10` halves the vertical padding on a laptop-height
        // screen — 80px of the ~100px that has to come out for the hero to
        // fit above the fold there.
        size === "full"
          ? "min-h-[calc(100svh-4rem)] py-20 short:py-10"
          : "pt-20 pb-14 sm:pt-24",
      )}
    >
      <div className="flex flex-1 flex-col justify-center">
        <Container>
          <Eyebrow>{eyebrow}</Eyebrow>

          {/*
            `max-w-4xl` rather than 5xl. At 5xl the display size sets three
            words on the first line and the rag goes shapeless; capping the
            measure is what makes a two-line headline break where it should.
          */}
          <h1
            className={cn(
              "mt-6 max-w-4xl text-balance text-ink",
              size === "full" ? HEADING.display : HEADING.heading,
              // See the `.hero-display` rule in globals.css — steps the
              // display size down on a laptop-height viewport.
              size === "full" && "hero-display",
            )}
          >
            {title}
          </h1>

          {/*
            max-w-xl, not 2xl. The lede was running to three lines with two
            words orphaned on the last — at this measure it sets in two even
            ones under the headline it belongs to.
          */}
          {children && <div className="mt-8 max-w-xl">{children}</div>}

          {tail && (
            <p className="mt-14 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {tail}
            </p>
          )}
        </Container>
      </div>
      {footer}
    </section>
  );
}


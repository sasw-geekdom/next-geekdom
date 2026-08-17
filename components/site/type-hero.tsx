import { Container, Eyebrow } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * Type carries the fold. No photograph.
 *
 * For pages whose job is to make a CLAIM rather than show a room. The headline
 * runs to 8xl — roughly half again the size the old hero used — because a
 * cautious size undercuts an assertive sentence, and with no image competing
 * for the fold there is nothing else for the eye to land on.
 *
 * THE FOOTNOTE IS THE POINT. Borrowed from Y Combinator, whose hero cites Paul
 * Graham rather than embellishing itself: the page opens by quoting something
 * instead of claiming something, which is a different and more credible move.
 * Ours cites the letter that actually went out to members, so the citation is a
 * real document rather than a decorative pull quote.
 *
 * It is offset toward the right rather than centred under the headline. A
 * centred block reads as a subhead, which is the one thing it must not look
 * like — it is evidence, not a promise.
 *
 * Pairs with BleedHero; see the note there on which pages get which.
 */
export function TypeHero({
  eyebrow,
  title,
  children,
  footnote,
  tail,
  size = "full",
}: {
  eyebrow: React.ReactNode;
  /** Accent spans inside this use `text-rust` — this is a light ground. */
  title: React.ReactNode;
  children?: React.ReactNode;
  /** The citation hung off the headline's marker. Omit for no marker. */
  footnote?: { quote: React.ReactNode; source: React.ReactNode };
  /** Optional quiet line under everything — a price, a scroll cue. */
  tail?: React.ReactNode;
  /**
   * `full` gives the claim the whole viewport. `compact` is a page header with
   * a list under it — a listing page that pushes its first row below the fold
   * is hiding the thing the visitor came for.
   */
  size?: "full" | "compact";
}) {
  return (
    <section
      className={cn(
        "flex flex-col justify-center bg-sand",
        size === "full"
          ? "min-h-[calc(100svh-4rem)] py-20"
          : "pt-20 pb-14 sm:pt-24",
      )}
    >
      <Container className="text-center">
        <Eyebrow>{eyebrow}</Eyebrow>

        <h1
        className={cn(
          "mx-auto mt-8 max-w-5xl font-bold leading-[0.98] tracking-[-0.035em] text-ink",
          size === "full"
            ? "text-5xl sm:text-7xl lg:text-8xl"
            : "text-4xl sm:text-5xl lg:text-6xl",
        )}
      >
          {title}
        </h1>

        {children && (
          <div className="mx-auto mt-10 max-w-2xl">{children}</div>
        )}

        {footnote && (
          <figure className="mx-auto mt-16 max-w-md text-left sm:ml-[52%] sm:mr-0">
            <blockquote className="flex gap-3 text-base leading-relaxed text-ink/70">
              <span className="font-mono text-xs text-ink/40" aria-hidden="true">
                [1]
              </span>
              <p>{footnote.quote}</p>
            </blockquote>
            <figcaption className="mt-3 pl-8 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {footnote.source}
            </figcaption>
          </figure>
        )}

        {tail && (
          <p className="mt-16 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {tail}
          </p>
        )}
      </Container>
    </section>
  );
}

/**
 * The superscript marker that anchors the footnote, placed inside the headline.
 *
 * Mono because this is scanned rather than read, which is what mono is scoped
 * to here. Not a link: the note it points at is a few inches below it on the
 * same screen, and a jump link to something already visible is noise in a
 * screen reader. `aria-hidden` for the same reason — the quote and its
 * attribution read perfectly well on their own.
 */
export function FootnoteMark() {
  return (
    <span
      className="align-super font-mono text-[0.3em] tracking-normal text-ink/40"
      aria-hidden="true"
    >
      [1]
    </span>
  );
}

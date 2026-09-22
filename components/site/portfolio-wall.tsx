import { ArrowUpRight } from "lucide-react";
import { PORTFOLIO, type PortfolioCompany } from "@/lib/site";
import { ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * BUILT AT GEEKDOM — the companies, with their stage and their year.
 *
 * THE PROOF THE SITE DID NOT HAVE. Everything else on the homepage argues that
 * the room works; this is the only thing that shows what came out of it.
 *
 * NOT THE PARTNER MARQUEE. That row is ecosystem organizations — H-E-B, DEVSA,
 * Tech Bloc — and it says who endorses Geekdom. This says what Geekdom
 * produced. They make opposite arguments and the second one is stronger, which
 * is why this is a static grid you can read rather than a row that drifts past.
 *
 * `sortBy year` runs oldest first, which is the order that makes the point:
 * 2012 to 2025 is the claim, and a list that opens on four acquisitions and
 * closes on this year's pre-seeds reads as fifteen unbroken years.
 *
 * ── Why the whole row is the link ───────────────────────────────────────────
 *
 * NOT A SLUG PAGE PER COMPANY, deliberately, and not yet. Eighteen internal
 * pages carrying a logo, one sentence and a stage is eighteen thin pages —
 * the shape search engines discount and the shape that has to be migrated the
 * day the CMS lands. An outbound link to a living company is also just better
 * proof than a page Geekdom wrote about it. When there is a CMS with real
 * profiles behind it, this component grows an internal href and nothing else
 * about it changes.
 *
 * ── Logos ───────────────────────────────────────────────────────────────────
 *
 * Optional, per company, with the name as the fallback — so the wall fills in
 * over time instead of waiting on a complete set. Every logo renders through a
 * CSS mask in one flat color: the source copy asks for the grid monochrome,
 * and these eighteen logos exist in every polarity and palette there is. A
 * mask reads alpha and throws color away, which fixes the white-logo problem
 * and the sponsor-wall mismatch at once. See `logo` in lib/site.ts.
 */
export function PortfolioWall({
  /** Only the companies the Studio has backed. */
  studioOnly = false,
  className,
}: {
  studioOnly?: boolean;
  className?: string;
}) {
  const companies = studioOnly ? PORTFOLIO.filter((c) => c.studio) : PORTFOLIO;

  return (
    <ul
      /*
        TWO-UP ON A PHONE, not one. Eighteen single-column cells with a
        description each ran about 3,560px — roughly four phone screens for one
        section, and the section is only asking the reader to believe a list.

        The fix is not to hide companies behind a "show more": the COUNT is the
        argument this section makes, and a reader who never taps sees a third
        of the evidence. It is to drop what is actually taking the height. Two
        columns plus no descriptions below `sm` takes it to roughly 1,100px —
        a bigger cut than the button would have made, with nothing hidden.

        `gap-x-5` on the narrowest screens rather than the `gap-x-8` used
        higher up: at 390px the container has 342px to divide, and eight of
        those points back per column is the difference between a wordmark
        fitting and being scaled down by `contain`.
      */
      className={cn(
        "grid grid-cols-2 gap-x-5 gap-y-px sm:gap-x-8 lg:grid-cols-3",
        className,
      )}
    >
      {[...companies]
        .sort((a, b) => a.founded - b.founded)
        .map((company) => (
          <Company key={company.name} company={company} />
        ))}
    </ul>
  );
}

/** What the link goes to, said before the click rather than after it. */
const DESTINATION: Record<NonNullable<PortfolioCompany["link"]>, string> = {
  site: "Website",
  story: "Read the story",
  video: "Watch the interview",
};

function Company({ company }: { company: PortfolioCompany }) {
  const isSymbol = company.logoMark === "symbol";

  const name = (
    <span className="text-lg font-medium leading-snug text-graphite">
      {company.name}
    </span>
  );

  /*
    The mask does the shape, `bg-graphite` supplies the only color. The
    element needs its own height because a masked div has no intrinsic size —
    there is no image in the box, just a painted rectangle being cut out.

    `w-full` for a wordmark, which should run the cell and set its own width
    from the aspect; `aspect-square` for a symbol, which sits beside the name
    and must not claim the row.
  */
  const painted = company.logo ? (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-graphite transition-colors",
        company.logoHeight ?? "h-6 sm:h-7",
        isSymbol ? "aspect-square shrink-0" : "w-full",
      )}
      style={{
        WebkitMaskImage: `url(${company.logo})`,
        maskImage: `url(${company.logo})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: isSymbol ? "center" : "left center",
        maskPosition: isSymbol ? "center" : "left center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  ) : null;

  /*
    A BARE MARK GETS THE NAME BESIDE IT. RentBamboo's stripe and Allosense's
    circled A carry no letterforms, and neither company shows them alone — on
    their own sites both sit next to live text. Reproducing the composition is
    the only way to match it, because there is no combined file to download:
    RentBamboo's header is an <img> and two <span>s.
  */
  const mark = !company.logo
    ? name
    : isSymbol
      ? (
          <span className="flex items-center gap-2.5">
            {painted}
            {name}
          </span>
        )
      : painted;

  /*
    The name is still rendered for a screen reader even when a logo is showing
    — the mask is a painted rectangle with no text in it, so without this the
    row announces as its stage and year alone.
  */
  /*
    A FIXED-HEIGHT SLOT FOR THE MARK, and this is what keeps the columns in
    step.

    Every mark is a different height by design — the heights are area-balanced,
    so a wide wordmark sits at 24px and a square symbol at 36px, and a company
    with no logo renders its name at whatever `text-lg` leads to. Left to size
    themselves, each cell then starts its stage line at a different offset, and
    because a CSS grid aligns rows at the TOP, the "PRE-SEED · 2025" and the
    description in one column drift out of line with its neighbor. It is most
    obvious on a wide screen, where three columns are visible at once.

    Pinning the slot to h-10 and centering the mark inside it means every cell
    hands the same vertical position to whatever follows, whatever mark it
    happens to carry. 40px because the tallest mark is h-9 (36px) and the
    tallest name is about 25px, so nothing is ever clipped.
  */
  const label = (
    <span className="flex h-10 items-center">
      {mark}
      {/* The mask is a painted rectangle with no text in it, so without this
          the row announces as its stage and year alone. Not needed when the
          mark is paired with the name — that would announce it twice. */}
      {company.logo && !isSymbol && (
        <span className="sr-only">{company.name}</span>
      )}
    </span>
  );

  const meta = (
    <p className={cn("mt-1.5", MONO.label, "text-muted-foreground")}>
      {company.stage} · {company.founded}
    </p>
  );

  if (!company.href) {
    /*
      No link, and that is deliberate rather than missing. Some of the acquired
      ones have no live site and no piece of press worth pointing at, and
      sending "ParLevel Systems" to somebody else's homepage is worse than
      sending it nowhere.
    */
    return (
      <li className="border-t border-border py-5">
        {label}
        {meta}
        {company.description && <Description>{company.description}</Description>}
      </li>
    );
  }

  return (
    <li className="border-t border-border">
      {/*
        THE WHOLE ROW IS THE TARGET, not just the name. A grid of eighteen
        3-word links is a hit area the size of the word; the row is the thing
        a reader perceives as the company, so the row is what takes the click.
        `-mx-3 px-3` lets the hover tint bleed slightly past the text without
        moving the grid's alignment.
      */}
      <a
        href={company.href}
        target="_blank"
        rel="noreferrer noopener"
        className="group -mx-3 block rounded-lg px-3 py-5 transition-colors hover:bg-bone-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        {/*
          The hover underline is for the NAME only. On a logo row the same rule
          would run the full width of the masked box — a hairline under a
          wordmark that isn't touching it, which reads as a border rather than
          a link. Logo rows get their cue from the row tint instead.
        */}
        <span
          className={cn(
            "block",
            !company.logo &&
              "decoration-clay decoration-2 underline-offset-4 group-hover:underline",
          )}
        >
          {label}
        </span>
        {meta}
        {company.description && <Description>{company.description}</Description>}
        {/*
          ALWAYS VISIBLE, not revealed on hover. The first draft faded this in
          on `group-hover`, which looked tidier and broke the one job it has:
          there is no hover on a phone, so the label that exists to declare the
          destination before the click would never appear for the readers most
          likely to be surprised by it.
        */}
        {company.link && (
          <p
            className={cn(
              "mt-2 flex items-center gap-1",
              MONO.micro,
              "text-muted-foreground transition-colors group-hover:text-graphite",
            )}
          >
            {DESTINATION[company.link]}
            {/*
              AN ICON, NOT THE "↗" CHARACTER, and the swap is what buys the
              movement. U+2197 is a glyph inside the text run: it cannot
              transform on its own, it inherits the line's metrics rather than
              sitting on the cap height, and it renders differently in every
              font that has it — Geist Mono's is noticeably lighter than the
              uppercase beside it.

              PORTED FROM THE SIBLING next-sasw REPO, where the same mark and
              the same nudge run down the days of the week on the schedule.
              Up and right by 2px each on hover, 200ms — the arrow moves the
              way the destination does. `lucide-react` is already a dependency
              here and ships per icon, so this costs one path.

              CLAY ON HOVER while the label goes Graphite. The guide gives
              Clay markers, rules and borders but not small text; an arrow is
              a marker, so the accent lands on the one part of this line that
              is allowed to carry it. 3.5:1 on bone against a 3:1 bar for
              non-text.
            */}
            <ArrowUpRight
              aria-hidden="true"
              className={ARROW.external}
            />
          </p>
        )}
      </a>
    </li>
  );
}

/*
  HIDDEN BELOW `sm`, and that is a return to the spec rather than a compromise.

  Geekdom's own source copy describes this section as "grid of member company
  logos + names + metadata underneath" — no descriptions. They were added on
  top of that, and they are worth having where there is room: 74px of the
  198px a cell occupied on a phone, which is most of why the section ran four
  screens.

  Not `display: none` on content that matters elsewhere — the link still goes
  to the company, and every description is visible from 640px up.
*/
function Description({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 hidden max-w-prose text-sm leading-relaxed text-muted-foreground sm:block">
      {children}
    </p>
  );
}

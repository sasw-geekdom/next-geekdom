import { PORTFOLIO, type PortfolioCompany } from "@/lib/site";
import { MONO } from "@/components/site/section";
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
 * ── A logo grid, per Geekdom ────────────────────────────────────────────────
 *
 * Geekdom's feedback on the previous version: "way too text heavy and busy.
 * Remove the descriptions. If we link out, it should just be on hover/click
 * of their logo. No need to have a 'WEBSITE' or 'READ THE STORY' below. Full
 * border grid instead of just the top and bottom lines. Maybe a hover effect?"
 *
 * So each cell is the mark, the stage and the year, inside a hairline grid,
 * and the whole cell is the link. `description` and `link` stay in PORTFOLIO
 * because /llms.txt still reads them; this component just doesn't render them.
 *
 * ── Why the whole cell is the link ──────────────────────────────────────────
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
        A FULL HAIRLINE GRID from borders, not `gap-px` over a colored ground.
        The list draws the top and left edges and every cell draws its own
        right and bottom, so each line is exactly one border wide and a cell's
        hover fill can't be clipped by a neighbor.

        2 / 3 / 6 COLUMNS because every count this renders divides by all
        three — 18 on the homepage, 6 on /studio — so no layout ends on a
        half-empty row with an open right edge.
      */
      className={cn(
        "grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 xl:grid-cols-6",
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

/*
  THE HOVER INVERTS THE CELL: Graphite ground, Bone mark. Both are colors the
  guide allows a mark in, and because every logo is a mask painted by
  `bg-*`, the swap is one class rather than a second asset per company.

  Cells without a link get none of it — a hover that inverts and then does
  nothing on click reads as broken.
*/
const CELL =
  "flex h-full min-h-32 flex-col items-center justify-center gap-3 border-b border-r border-border px-4 py-7 text-center sm:min-h-36";

function Company({ company }: { company: PortfolioCompany }) {
  const isSymbol = company.logoMark === "symbol";
  const linked = Boolean(company.href);

  const name = (
    <span
      className={cn(
        "text-lg font-medium leading-snug text-graphite transition-colors duration-200",
        linked && "group-hover:text-bone group-focus-visible:text-bone",
      )}
    >
      {company.name}
    </span>
  );

  /*
    The mask does the shape, `bg-graphite` supplies the only color. The
    element needs its own height because a masked div has no intrinsic size —
    there is no image in the box, just a painted rectangle being cut out.

    A wordmark runs the cell's width and `contain` sets its real size from the
    aspect, centered; a symbol is square and sits beside the name.
  */
  const painted = company.logo ? (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-graphite transition-colors duration-200",
        linked && "group-hover:bg-bone group-focus-visible:bg-bone",
        company.logoHeight ?? "h-6 sm:h-7",
        isSymbol ? "aspect-square shrink-0" : "w-full max-w-40",
      )}
      style={{
        WebkitMaskImage: `url(${company.logo})`,
        maskImage: `url(${company.logo})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  ) : null;

  /*
    A BARE MARK GETS THE NAME BESIDE IT. RentBamboo's stripe and Allosense's
    circled A carry no letterforms, and neither company shows them alone — on
    their own sites both sit next to live text.
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
    A FIXED-HEIGHT SLOT FOR THE MARK, so every cell's stage line sits at the
    same height as its neighbors' whatever mark it carries. 40px because the
    tallest mark is h-10 and nothing is ever clipped.
  */
  const content = (
    <>
      <span className="flex h-10 w-full items-center justify-center">
        {mark}
        {/* The mask is a painted rectangle with no text in it; without this
            the cell announces as its stage and year alone. */}
        {company.logo && !isSymbol && (
          <span className="sr-only">{company.name}</span>
        )}
      </span>
      <span
        className={cn(
          MONO.label,
          "text-muted-foreground transition-colors duration-200",
          linked && "group-hover:text-bone/70 group-focus-visible:text-bone/70",
        )}
      >
        {company.stage} · {company.founded}
      </span>
    </>
  );

  if (!linked) {
    /*
      No link, and that is deliberate rather than missing. Some of the acquired
      ones have no live site and no piece of press worth pointing at, and
      sending "ParLevel Systems" to somebody else's homepage is worse than
      sending it nowhere.
    */
    return <li className={CELL}>{content}</li>;
  }

  return (
    <li className="flex">
      <a
        href={company.href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          CELL,
          "group w-full transition-colors duration-200 hover:bg-graphite focus-visible:bg-graphite focus-visible:outline-none",
        )}
      >
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </li>
  );
}

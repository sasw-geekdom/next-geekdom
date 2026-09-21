import { PORTFOLIO, type PortfolioCompany } from "@/lib/site";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/**
 * BUILT AT GEEKDOM — the companies, with their stage and their year.
 *
 * THE PROOF THE SITE DID NOT HAVE. Everything else on the homepage argues that
 * the room works; this is the only thing that shows what came out of it. The
 * source copy asks for it on the homepage under "BUILT AT GEEKDOM" and again,
 * filtered, on /studio.
 *
 * NOT THE PARTNER MARQUEE. That row is ecosystem organizations — H-E-B, DEVSA,
 * Tech Bloc — and it says who endorses Geekdom. This says what Geekdom
 * produced. They make opposite arguments and the second one is stronger, which
 * is why this is a static grid you can read rather than a row that drifts past.
 *
 * WORDMARKS, NOT LOGOS, until the files arrive. The source copy calls for a
 * monochrome logo grid; a grid of names set in one face is more legible than a
 * row of mismatched marks and it lets a company be added the day it is agreed
 * rather than the day someone digs out an EPS. The metadata under each name is
 * what turns a list into evidence.
 *
 * `sortBy="year"` runs oldest first, which is the order that makes the point:
 * 2012 to 2025 is the claim, and a list that opens on four acquisitions and
 * closes on this year's pre-seeds reads as fifteen unbroken years.
 */
export function PortfolioWall({
  /** Only the companies the Studio has backed. */
  studioOnly = false,
  className,
}: {
  studioOnly?: boolean;
  className?: string;
}) {
  const companies = studioOnly
    ? PORTFOLIO.filter((c) => c.studio)
    : PORTFOLIO;

  return (
    <ul
      className={cn(
        "grid gap-x-8 gap-y-px sm:grid-cols-2 lg:grid-cols-3",
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

function Company({ company }: { company: PortfolioCompany }) {
  const name = (
    <span className="text-lg font-medium leading-snug text-graphite">
      {company.name}
    </span>
  );

  return (
    <li className="border-t border-border py-5">
      {company.href ? (
        /*
          The name is the link, and the underline only appears on hover.
          Eighteen permanently underlined rows would read as a table of
          contents; the rule is Clay, so the accent is present without Clay
          having to carry the words — it is 3.5:1 and cannot. See globals.css.
        */
        <a
          href={company.href}
          target="_blank"
          rel="noreferrer noopener"
          className="decoration-clay decoration-2 underline-offset-4 hover:underline"
        >
          {name}
        </a>
      ) : (
        /*
          No link, and that is deliberate rather than missing. Four of these
          were acquired and their sites now redirect to the acquirer — pointing
          "ParLevel Systems" at somebody else's homepage is worse than pointing
          it nowhere.
        */
        name
      )}
      <p className={cn("mt-1.5", MONO.label, "text-muted-foreground")}>
        {company.stage} · {company.founded}
      </p>
    </li>
  );
}

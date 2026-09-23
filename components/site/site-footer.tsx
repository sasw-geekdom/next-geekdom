import Link from "next/link";
import {
  SOCIALS,
  BEYOND_THE_CLUB,
  FOOTER_EXPLORE,
  FOOTER_PROGRAMS,
  live,
  LEGAL,
  LOCATION,
  FOUNDED_YEAR,
} from "@/lib/site";
import { Container } from "@/components/site/section";

/*
  THE MEMBERSHIP COLUMN IS GONE, at Geekdom's request, and two of its four
  links went with it:

    · "The letter" pointed at /whats-changing, which has been deleted.
    · "Manage membership" pointed at /account, which is hidden for now. The
      route still exists and the Stripe portal still works — it is unlinked,
      not removed, so a member who has the URL is not stranded.

  Apply and FAQ moved into Programs, which is where the doc's own column
  structure puts Apply.
*/

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-graphite text-bone">
      <Container className="py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          {/*
            THE STATIC CROWN, NOT THE SHADER — Geekdom's call, and it settles
            part of a question this repo had open.

            `CrownShader` ran a WebGL flow through the mark — a gradient on a
            mark, which the 2026 guide bans. It came out of the footer first
            and has since been removed from the site entirely.

            THE MASK, NOT `crown.svg`. The asset ships two-tone — #CA3625 and
            #AA2D29 — and the second is not one of the five brand colours, so
            dropping it straight onto graphite would put an off-palette red in
            the footer of every page. `.crown-mask` in globals.css consumes
            only the alpha and lets the fill be a real token: Bone, which the guide permits for the marks and
            which is what everything else in this footer is.

            Aspect is the source viewBox, 55 x 41.
          */}
          <div
            aria-hidden="true"
            className="crown-mask h-14 w-[4.7rem] shrink-0 bg-bone"
          />

          {/*
            FOUR COLUMNS, NAMED AS `Source Copy v1` NAMES THEM. This was
            Explore / Membership / Beyond the club / Follow; the doc's columns
            are Explore / Programs / Related / Social, and Geekdom asked for
            the footer to match.

            "Beyond the club" is kept over the doc's "Related" — the doc's own
            word, but it is the label AGENTS.md argues against at length: it
            holds the four things Geekdom operates, runs, is funded by and
            sits on the team for, and "Related" is the word you reach for when
            you have not decided what a group is. Flagged for Leslie rather
            than changed, since it is her document.
          */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <FooterColumn title="Explore" links={live(FOOTER_EXPLORE)} />
            <FooterColumn title="Programs" links={live(FOOTER_PROGRAMS)} />
            <FooterColumn
              title="Beyond the club"
              links={BEYOND_THE_CLUB}
              external
            />
            <FooterColumn title="Social" links={SOCIALS} external />
          </div>
        </div>

        {/*
          The utility row. Copyright, the legal pages, and the staff door.

          `gap-x-6` on a wrapping flex row rather than a second nested flex:
          on a narrow phone the four items simply wrap, and the copyright line
          stays first in the reading order because it is the only one that is
          not a link.
        */}
        {/*
          13px, not 12. This is Rubik — read, not scanned — and at 12px in
          dimmed Bone on Graphite it was the smallest prose on the site. Mono
          holds 12px because it is tracked out; a proportional face needs the
          extra pixel.
        */}
        <div className="mt-14 flex flex-col gap-3 border-t border-bone/12 pt-6 text-[0.8125rem] text-bone/50 sm:flex-row sm:items-center sm:justify-between">
          {/*
            THE EASTER EGG'S DOOR, and it wears the OLD LOGO.

            The copyright line is the one place on the site where the founding
            year already appears, so the throwback hangs off it rather than
            taking a nav slot or a footer column — which is what makes it an
            easter egg rather than a page. The years are computed, so the label
            is still true in 2031.

            THE CLASSIC MARK IS THE POINT. This is Geekdom's original
            wordmark — the light humanist face with the spiky crown over the
            "d" — not the condensed slab lockup in the navbar six inches above
            it. A door to a fifteen-year retrospective that wears the logo
            those fifteen years were spent under is the joke landing before the
            page loads. Ported from the sibling next-sasw repo, which uses the
            same mark in the same slot.

            IT IS A SECOND WORDMARK ON THE SITE, which is worth being honest
            about: the 2026 guide has one. It is contained on purpose — one
            instance, 16px tall, in the quietest line on the page, and
            historical rather than current by its whole nature. It is not an
            alteration of the current mark, so the guide's "never recolor,
            rotate or stretch" rules aren't what's in play; but it is a second
            wordmark, and anyone auditing the marks should know it is here.

            An <img> rather than an inline SVG: the footer renders on every
            route, and 5.7KB of paths in every document to color one mark that
            never changes color is a bad trade. The file is flattened to Bone
            (#F4F1EB) for that reason — an <img> can't take `currentColor`, so
            the palette color is baked in and the hover runs on opacity.
          */}
          {/*
            THE ADDRESS MOVED HERE, at Geekdom's request. It used to sit in
            the left block under the tagline; the tagline and the membership
            email came out with this change, which left that block holding
            one mark and nothing else.

            `Source Copy v1` writes the location as its own line — "110 E
            Houston St, 3rd Floor · San Antonio, TX 78205" — and its utility
            row as copyright, Privacy, Terms. Geekdom asked for all four on
            one line, so the location line's own middle dot is reused as the
            separator and the whole row reads as one utility strip.

            Built from `LOCATION` rather than typed, so the street and the
            floor cannot drift from the address /club and the email templates
            render. Note `floorShort` — "3rd Floor", the form the doc uses and
            the one an address block wants; lib/site.ts has a note about not
            reconciling it with "Third floor" in prose.
          */}
          <p className="flex flex-wrap items-center gap-x-1.5">
            <span>
              {LOCATION.street}, {LOCATION.floorShort} · {LOCATION.city},{" "}
              {LOCATION.state} {LOCATION.zip}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              © {FOUNDED_YEAR}–{new Date().getFullYear()}
            </span>
            {/*
              THE EASTER EGG'S DOOR, and it wears the OLD LOGO.

              The copyright line is the one place the founding year already
              appears, so the throwback hangs off it rather than taking a nav
              slot or a footer column — which is what makes it an easter egg
              rather than a page. The years are computed, so the label is
              still true in 2031.

              An <img> rather than an inline SVG: the footer renders on every
              route. The file is flattened to Bone because an <img> cannot
              take `currentColor`, so the hover runs on opacity.
            */}
            <Link
              href="/since-2011"
              aria-label={`${new Date().getFullYear() - FOUNDED_YEAR} years of Geekdom`}
              className="group inline-flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-graphite"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/geekdom-classic.svg"
                alt="Geekdom"
                width={59}
                height={16}
                className="h-4 w-auto opacity-55 transition-opacity group-hover:opacity-100"
              />
            </Link>
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-bone/80"
              >
                {l.label}
              </Link>
            ))}
            {/*
              Not in the doc's utility row, kept deliberately: it is the only
              signposted way to the admin sign-in, and the doc does not cover
              staff routes at all. Flagged rather than dropped.
            */}
            <Link
              href="/admin"
              className="transition-colors hover:text-bone/80"
            >
              Staff sign in
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}

/**
 * One footer column.
 *
 * `external` swaps next/link for a plain <a> with the rel that makes
 * target="_blank" safe. It is a prop rather than two components because the
 * columns are otherwise identical, and the "Follow" column used to be a
 * hand-rolled copy of this markup for exactly that one difference — which is
 * how it ended up the only column whose heading was written inline.
 */
function FooterColumn({
  title,
  links,
  external = false,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
  external?: boolean;
}) {
  const linkClass =
    "text-sm text-bone/70 transition-colors hover:text-bone";

  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-bone">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            {external ? (
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className={linkClass}
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className={linkClass}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

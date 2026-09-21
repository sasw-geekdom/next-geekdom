import Link from "next/link";
import {
  NAV,
  EXPLORE,
  SOCIALS,
  BEYOND_THE_CLUB,
  LEGAL,
  LOCATION,
  CONTACT_EMAIL,
  TAGLINE,
  FOUNDED_YEAR,
} from "@/lib/site";
import { Container } from "@/components/site/section";
import { CrownShader } from "@/components/site/crown-shader";

/*
  The Membership column, in the order someone actually meets these: apply,
  then questions about applying, then the letter explaining what they are
  joining, then billing once they have joined.
*/
const SECONDARY = [
  { href: "/apply", label: "Apply" },
  { href: "/faq", label: "FAQ" },
  { href: "/whats-changing", label: "The letter" },
  { href: "/account", label: "Manage membership" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-graphite text-bone">
      <Container className="py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            {/*
              The crown, running the flow, in place of the wordmark.

              Crown and not the g-mark, for two reasons. The slot is wide and
              shallow — it sits above the tagline in a narrow column — and the
              crown's 1.34 fills that where the g-mark's 0.31 is a 25px hairline.
              And the navbar already carries the full wordmark: a crown here
              bookends it instead of repeating it.

              This puts a second WebGL context on every page (the first being
              the rail on the CrownPage routes). Affordable because ShaderCanvas
              pauses on an IntersectionObserver, and a footer is off screen for
              almost the whole visit — it costs nothing until someone scrolls to
              it. Browsers cap contexts around 16; two is not near that.
            */}
            <CrownShader onDark className="h-14 w-auto" />
            <p className="mt-4 text-lg font-medium leading-snug text-bone">
              {TAGLINE}
            </p>
            <address className="mt-6 text-sm not-italic leading-relaxed text-bone/65">
              {LOCATION.line1}
              <br />
              {LOCATION.street}
              <br />
              {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
            </address>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-bone underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-bone"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {/*
            Four columns, per the brand guide's footer spec: address,
            geekdom.com, a LaunchSA reference, social, minimal legal.

            `sm:grid-cols-4` rather than 3 — "Related" is the new one, and it is
            what carries the LaunchSA reference the guide asks for. See ECOSYSTEM
            in lib/site.ts for why that is a name and not a mark.
          */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {/*
              The nav is two items now, so the footer stops mirroring it and
              carries the whole site instead. Everything the nav dropped —
              The Floor, Events, What's Changing — lives here rather than
              being orphaned.
            */}
            {/*
              EVERY ONE OF THESE HEADINGS USED TO SAY NOTHING.

              "Geekdom" labelled a column inside Geekdom's own footer.
              "Members" sat above Apply, which is for people who are not
              members yet. And "Related" — related to what? It held LaunchSA,
              Startup + Tech Week, Accelerate South Texas and MIT REAP: the
              four things Geekdom operates, runs, is funded by and sits on the
              team for. "Related" is the word you reach for when you have not
              decided what a group is.

              "Beyond the club" is Geekdom's own phrase for it, straight out of
              its Media boilerplate: "Beyond the club, Geekdom convenes the
              broader startup community." It is also the one framing that
              stays true across all four relationships without claiming any of
              them — which "Also from Geekdom" would, wrongly, for two.

              NOT "ECOSYSTEM", which is the obvious label and is on the brand
              guide's banned list by name.
            */}
            <FooterColumn title="Explore" links={[...NAV, ...EXPLORE]} />
            <FooterColumn title="Membership" links={SECONDARY} />
            <FooterColumn
              title="Beyond the club"
              links={BEYOND_THE_CLUB}
              external
            />
            <FooterColumn title="Follow" links={SOCIALS} external />
          </div>
        </div>

        {/*
          The utility row. Copyright, the legal pages, and the staff door.

          `gap-x-6` on a wrapping flex row rather than a second nested flex:
          on a narrow phone the four items simply wrap, and the copyright line
          stays first in the reading order because it is the only one that is
          not a link.
        */}
        <div className="mt-14 flex flex-col gap-3 border-t border-bone/12 pt-6 text-xs text-bone/50 sm:flex-row sm:items-center sm:justify-between">
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
            rotate or stretch" rules aren't what's in play; but anyone doing
            the shader sign-off should know this is here too.

            An <img> rather than an inline SVG: the footer renders on every
            route, and 5.7KB of paths in every document to color one mark that
            never changes color is a bad trade. The file is flattened to Bone
            (#F4F1EB) for that reason — an <img> can't take `currentColor`, so
            the palette color is baked in and the hover runs on opacity.
          */}
          <p className="flex flex-wrap items-center gap-x-1.5">
            <span>
              © {FOUNDED_YEAR}–{new Date().getFullYear()}
            </span>
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
            <span>· San Antonio, Texas.</span>
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

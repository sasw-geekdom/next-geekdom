import Link from "next/link";
import {
  NAV,
  EXPLORE,
  SOCIALS,
  RELATED,
  LEGAL,
  LOCATION,
  CONTACT_EMAIL,
  TAGLINE,
  FOUNDED_YEAR,
} from "@/lib/site";
import { Container } from "@/components/site/section";
import { CrownShader } from "@/components/site/crown-shader";

const SECONDARY = [
  { href: "/apply", label: "Apply" },
  { href: "/account", label: "Manage membership" },
  { href: "/faq", label: "FAQ" },
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
            <CrownShader className="h-14 w-auto" />
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
            what carries the LaunchSA reference the guide asks for. See RELATED
            in lib/site.ts for why that is a name and not a mark.
          */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {/*
              The nav is two items now, so the footer stops mirroring it and
              carries the whole site instead. Everything the nav dropped —
              The Floor, Events, What's Changing — lives here rather than
              being orphaned.
            */}
            <FooterColumn title="Geekdom" links={[...NAV, ...EXPLORE]} />
            <FooterColumn title="Members" links={SECONDARY} />
            <FooterColumn title="Related" links={RELATED} external />
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
          <p>
            © {FOUNDED_YEAR}–{new Date().getFullYear()} Geekdom. San Antonio,
            Texas.
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

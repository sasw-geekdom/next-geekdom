import Link from "next/link";
import {
  NAV,
  SOCIALS,
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
    <footer className="mt-auto bg-ink text-white">
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
            <p className="mt-4 text-lg font-medium leading-snug text-white">
              {TAGLINE}
            </p>
            <address className="mt-6 text-sm not-italic leading-relaxed text-white/65">
              {LOCATION.floor}
              <br />
              {LOCATION.street}
              <br />
              {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
            </address>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-block text-sm text-gold hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <FooterColumn title="Explore" links={NAV} />
            <FooterColumn title="Members" links={SECONDARY} />
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
                Follow
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5">
                {SOCIALS.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/12 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {FOUNDED_YEAR}–{new Date().getFullYear()} Geekdom. San Antonio,
            Texas.
          </p>
          <Link href="/admin" className="transition-colors hover:text-white/80">
            Staff sign in
          </Link>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
        {title}
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-white/70 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

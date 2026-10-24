import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARROW, Eyebrow, HEADING, LINK_ARROW, Section } from "@/components/site/section";
import { Editorial } from "@/components/site/editorial";
import { SiteNavbar } from "@/components/site/site-navbar";
import { SiteFooter } from "@/components/site/site-footer";
import { cn } from "@/lib/utils";

/**
 * Root not-found — every unmatched URL in the app.
 *
 * WHY THE CHROME IS IMPORTED RATHER THAN INHERITED: this file has to live at
 * `app/`, because only the ROOT not-found catches unmatched URLs; one inside
 * the (site) group would handle nothing but `notFound()` thrown within that
 * segment. Living at the root means it renders inside app/layout.tsx but NOT
 * inside app/(site)/layout.tsx, so the navbar and footer are pulled in by hand.
 * Moving this file to inherit them would silently stop it catching 404s at all.
 *
 * WHO LANDS HERE: people following links to the coworking-era site. About
 * 600 of its old URLs 404 on purpose (LEGACY_REDIRECTS in next.config.ts),
 * so the nav is the whole point for them — and so is the archive.
 *
 * IN THE BRAND, like /apply: eyebrow, Section-H1 with its Clay accent, one
 * paragraph. It was a CrownPage — a giant red crown in a side rail (the guide
 * bans the crown as decoration, and it was the largest block of Geekdom Red
 * on the site), a red "Back home" button (Red is for Apply), and an outline
 * "Explore the Club" button. Secondary actions are arrow links everywhere
 * else, and a 404 has no primary one.
 */
export default function NotFound() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:bg-graphite focus:px-4 focus:py-2 focus:text-bone"
      >
        Skip to content
      </a>
      <SiteNavbar />

      <main id="main">
        <Section tone="bone" className="sm:py-32">
          <header className="max-w-3xl">
            <Eyebrow>404</Eyebrow>
            <h1 className={cn("mt-4", HEADING.heading, "text-graphite")}>
              That page <span className="text-clay">moved out.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              A lot of the old site went away with coworking. What&rsquo;s here
              now is the Club and the Studio.
            </p>
          </header>

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { href: "/", label: "Home" },
              { href: "/club", label: "The Club" },
              { href: "/studio", label: "Studio" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={LINK_ARROW}>
                  {l.label}
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </Link>
              </li>
            ))}
          </ul>

          {/*
            THE ARCHIVE, FOR THE PEOPLE MOST LIKELY TO WANT IT. They came
            looking for the old Geekdom; /since-2011 is the old Geekdom, in
            photographs. Two short declaratives, parallel — the page they
            wanted is gone, the thing it was about is kept — and the page's
            one editorial moment, so it's in Fraunces, past a hairline.
          */}
          <div className="mt-16 max-w-3xl border-t border-border pt-10">
            <Editorial className="text-2xl leading-[1.4] text-graphite">
              You found an old link. We kept the photos.
            </Editorial>
            <Link href="/since-2011" className={cn("mt-4", LINK_ARROW)}>
              Geekdom since 2011
              <ArrowRight aria-hidden="true" className={ARROW.internal} />
            </Link>
          </div>
        </Section>
      </main>

      <SiteFooter />
    </>
  );
}

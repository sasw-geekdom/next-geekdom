import { ButtonLink } from "@/components/ui/button";
import { CrownPage } from "@/components/site/crown-page";
import { SiteNavbar } from "@/components/site/site-navbar";
import { SiteFooter } from "@/components/site/site-footer";

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
 * It carries the full chrome because a 404 is the page where a visitor most
 * needs a way out, and on its own it offered two links. next.config.ts
 * deliberately lets the old blog and press URLs 404 rather than soft-404 them
 * at the homepage — so the people landing here arrive from stale links to the
 * coworking-era site, and the nav is the whole point for them.
 *
 * LEFT/RIGHT rather than stacked. Side by side, the crown and the copy stop
 * competing for the same vertical budget: stacked, the two together needed the
 * entire viewport on a MacBook Air and left nothing over. In two columns each
 * one only has to fit the height it's given.
 */
export default function NotFound() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-60 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <SiteNavbar />

      <main id="main">
        <CrownPage
          fitViewport
          crownOnMobile
          eyebrow="404"
          title={
            <>
              That page <span className="text-rust">moved out.</span>
            </>
          }
          subtitle="A lot of the old site went away when coworking did. The club is what's here now — start from the top, or use the menu above."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/" size="lg">
              Back home
            </ButtonLink>
            <ButtonLink href="/whats-changing" size="lg" variant="outline">
              What changed
            </ButtonLink>
          </div>
        </CrownPage>
      </main>

      <SiteFooter />
    </>
  );
}

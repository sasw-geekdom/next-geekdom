import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow, Section, SectionTitle } from "@/components/site/section";
import { PhotoHero } from "@/components/site/photo-hero";
import { PHOTOS } from "@/lib/photos";
import { BENEFITS, NOT_INCLUDED, priceLabel } from "@/lib/membership";
import { LOCATION } from "@/lib/site";

// Built from priceLabel() so the search snippet can't drift from Stripe — see
// the note in app/layout.tsx.
export const metadata: Metadata = {
  title: "Membership",
  description: `One membership${
    priceLabel() ? `, ${priceLabel()}` : ""
  }. The third floor, the programming, and a room full of people who'll break the problem down with you. No dedicated desks. No offices.`,
};

export default function MembershipPage() {
  // null while pricing is unannounced — see lib/membership.ts. The page reads
  // correctly either way rather than shipping a placeholder number.
  const price = priceLabel();

  return (
    <>
      <PhotoHero
        eyebrow="Membership"
        title={
          <>
            One <span className="text-rust">membership.</span>
          </>
        }
        photo={PHOTOS.theCrowd}
        priority
      >
        <p className="text-lg leading-relaxed text-muted-foreground">
          No tiers to compare, no desk to rent, no contract to negotiate. One
          membership that gets you the room, the programming, and the people
          who&rsquo;ll think the hard part through with you.
        </p>
      </PhotoHero>

      <Section tone="white" className="pt-4">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
          {/* What you get */}
          <div>
            <h2 className="text-2xl font-bold text-ink">What&rsquo;s included</h2>
            <ul className="mt-8 flex flex-col gap-7">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="flex gap-4">
                  <Check
                    className="mt-1 h-5 w-5 shrink-0 text-rust"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="font-semibold text-ink">{benefit.title}</h3>
                    <p className="mt-1 leading-relaxed text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <h2 className="mt-14 text-2xl font-bold text-ink">
              What it isn&rsquo;t
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {NOT_INCLUDED.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-muted-foreground"
                >
                  <Minus
                    className="h-4 w-4 shrink-0"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Price / apply card */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-border bg-sand p-7 shadow-sm">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
                Geekdom Club
              </p>

              {price ? (
                <p className="mt-4 text-4xl font-bold tracking-tight text-ink">
                  {price.split("/")[0]}
                  <span className="text-lg font-medium text-muted-foreground">
                    /{price.split("/")[1]}
                  </span>
                </p>
              ) : (
                <>
                  <p className="mt-4 text-3xl font-bold tracking-tight text-ink">
                    Pricing coming soon
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Apply now and we&rsquo;ll send the membership details along
                    with your invitation. Nothing is charged until you accept.
                  </p>
                </>
              )}

              <ButtonLink href="/apply" size="lg" className="mt-6 w-full">
                Apply for membership
              </ButtonLink>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Applications are read by a person on the Geekdom team. If
                it&rsquo;s a fit, we&rsquo;ll send you an invitation to activate
                your membership.
              </p>

              <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
                <p className="font-medium text-ink">{LOCATION.floor}</p>
                <p className="mt-1">{LOCATION.full}</p>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="ink">
        <Eyebrow onInk>Already a member</Eyebrow>
        <SectionTitle className="text-white">
          Manage your membership.
        </SectionTitle>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Update your card, download invoices, or cancel — no sign-in to
          remember. We&rsquo;ll email you a secure link.
        </p>
        <ButtonLink href="/account" size="lg" variant="on-ink" className="mt-8">
          Go to billing
        </ButtonLink>
      </Section>
    </>
  );
}

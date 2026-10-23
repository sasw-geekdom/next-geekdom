import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { requireMember } from "@/lib/auth/session";
import { LOCATION } from "@/lib/site";
import { MOCK_FAQ, MOCK_RESOURCES } from "@/data/mock/portal";
import { ARROW, HEADING, LINK_ARROW_ON_INK, MONO } from "@/components/site/section";
import { PortalPage } from "@/components/portal/portal-page";
import { Tile } from "@/components/portal/tile";
import { cn } from "@/lib/utils";

export const metadata = { title: "FAQ and resources" };

/*
  FAQ AND RESOURCES — the answers a member would otherwise email club@ for.
  Same frame as the dashboard and profile (PortalPage, Tiles), in two columns:

    ┌──────────────────────────────┬──────────────────┐
    │ Resources (live links;       │ At a glance      │  sticky
    │ "coming soon" on one line)   │ address · hours  │
    ├──────────────────────────────┤ Wi-Fi · getting  │
    │ Questions members ask        │ here             │
    │ (the main tile)              ├──────────────────┤
    │                              │ Still have a     │
    │                              │ question? (ink)  │
    └──────────────────────────────┴──────────────────┘

  The right column answers the most-asked questions without a click, and
  stays in view while the FAQ scrolls. Unavailable resources fold into one
  line instead of three greyed-out cards. Answers Geekdom hasn't written
  are marked "To confirm" — a placeholder must never read as a policy.
*/
export default async function ResourcesPage() {
  await requireMember();
  const live = MOCK_RESOURCES.filter((r) => r.href && !r.href.startsWith("mailto:"));
  const soon = MOCK_RESOURCES.filter((r) => !r.href);

  return (
    <PortalPage
      eyebrow="FAQ and resources"
      title="How the Club works."
      notice="Answers marked “To confirm” are placeholders for Geekdom to write."
    >
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* ── Left: resources, then the FAQ ─────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Tile label="Resources">
            <ul className="border-b border-border">
              {live.map((r) => {
                const row = (
                  <>
                    <span className="min-w-0">
                      <span className="block font-medium text-graphite">{r.title}</span>
                      <span className="block text-sm text-muted-foreground">{r.description}</span>
                    </span>
                    {r.external ? (
                      <ArrowUpRight aria-hidden="true" className={cn(ARROW.external, "shrink-0 text-muted-foreground")} />
                    ) : (
                      <ArrowRight aria-hidden="true" className={cn(ARROW.internal, "shrink-0 text-muted-foreground")} />
                    )}
                  </>
                );
                const cls =
                  "group flex items-center justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light";
                return (
                  <li key={r.title} className="border-t border-border first:border-t-0">
                    {r.href!.startsWith("/") ? (
                      <Link href={r.href!} className={cls}>{row}</Link>
                    ) : (
                      <a href={r.href!} target="_blank" rel="noreferrer noopener" className={cls}>
                        {row}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
            {soon.length > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className={cn(MONO.micro, "mr-2 border border-border px-1.5 py-0.5 text-graphite")}>Coming soon</span>
                {soon.map((r) => r.title).join(" · ")}
              </p>
            )}
          </Tile>

          <Tile label="Questions members ask">
            <div className="flex flex-col gap-8">
              {MOCK_FAQ.map((g) => (
                <div key={g.group}>
                  <h3 className={cn(MONO.micro, "text-muted-foreground")}>{g.group}</h3>
                  <div className="mt-2 border-b border-border">
                    {g.items.map((item) => (
                      <details key={item.q} className="group/faq border-t border-border">
                        <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light [&::-webkit-details-marker]:hidden">
                          <span className={cn(HEADING.item, "text-graphite")}>{item.q}</span>
                          <span aria-hidden="true" className="mt-0.5 text-muted-foreground transition-transform duration-200 group-open/faq:rotate-45">
                            +
                          </span>
                        </summary>
                        <div className="pb-5 pr-8">
                          <p className="leading-relaxed text-muted-foreground">{item.a}</p>
                          {item.confirm && (
                            <p className={cn(MONO.micro, "mt-3 inline-block border border-dashed border-border px-1.5 py-0.5 text-graphite")}>
                              To confirm
                            </p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Tile>
        </div>

        {/* ── Right: the basics, in view while the FAQ scrolls ─────────── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20">
          <Tile label="At a glance">
            <dl className="flex flex-col gap-4 text-sm">
              <div>
                <dt className={cn(MONO.micro, "text-muted-foreground")}>Where</dt>
                <dd className="mt-1 leading-relaxed text-graphite">
                  {LOCATION.building}, {LOCATION.floorShort}
                  <br />
                  {LOCATION.street}, {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
                </dd>
              </div>
              <div>
                <dt className={cn(MONO.micro, "text-muted-foreground")}>Hours</dt>
                <dd className="mt-1 text-graphite">Open 24/7 for members</dd>
              </div>
              <div>
                <dt className={cn(MONO.micro, "text-muted-foreground")}>Wi-Fi</dt>
                <dd className="mt-1 flex items-center gap-2 text-graphite">
                  Network and password
                  <span className={cn(MONO.micro, "border border-dashed border-border px-1.5 py-0.5")}>To confirm</span>
                </dd>
              </div>
            </dl>
          </Tile>

          <Tile label="Still have a question?" ink>
            <p className="leading-relaxed text-bone/80">Ask the Club team — anything about the space or your membership.</p>
            <a href="mailto:club@geekdom.com" className={cn("mt-5", LINK_ARROW_ON_INK)}>
              club@geekdom.com
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
            </a>
          </Tile>
        </div>
      </div>
    </PortalPage>
  );
}

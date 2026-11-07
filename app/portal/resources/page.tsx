import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { requireMember } from "@/lib/auth/session";
import { LOCATION } from "@/lib/site";
import { FAQ_GROUPS, faqForMembers, getMemberResources } from "@/lib/content/member-resources";
import { ARROW, HEADING, LINK_ARROW_ON_INK, MONO } from "@/components/site/section";
import { PortalPage } from "@/components/portal/portal-page";
import { Tile } from "@/components/portal/tile";
import { cn } from "@/lib/utils";
import { CopyText } from "@/components/portal/copy-text";
import { BOOKING_WINDOW } from "@/lib/rooms/rules";

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
  // Edited by staff at /portal/admin/resources; the shipped text until then.
  const res = await getMemberResources();
  const slack = res.slackInviteUrl
    ? [{ id: "slack", title: "Member Slack", description: "Where members ask, offer and find each other between visits.", href: res.slackInviteUrl }]
    : [];
  // BOOK A ROOM IS BUILT IN, like Slack: it's a page of the portal, so it's
  // always live here — and a staff-saved "Book a room" placeholder with no
  // address (from before rooms existed) no longer reads "Coming soon".
  const rooms = { id: "rooms", title: "Book a room", description: `Four conference rooms, ${BOOKING_WINDOW.daysLabel}, ${BOOKING_WINDOW.label}.`, href: "/portal/rooms" };
  const notRooms = (r: { title: string; href: string }) => !/book a room/i.test(r.title);
  const live = [rooms, ...slack, ...res.links.filter((r) => r.href && !r.href.startsWith("mailto:") && notRooms(r))];
  const soon = [...(res.slackInviteUrl ? [] : [{ title: "Member Slack" }]), ...res.links.filter((r) => !r.href && notRooms(r))];
  // The Wi-Fi question is answered from the Wi-Fi fields (faqForMembers).
  const answers = faqForMembers(res);
  const faq = FAQ_GROUPS.map((group) => ({ group, items: answers.filter((f) => f.group === group) })).filter((g) => g.items.length);

  return (
    <PortalPage
      eyebrow="FAQ and resources"
      title="How the Club works."
    >
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* ── Left: resources, then the FAQ ─────────────────────────────── */}
        <div className="order-2 flex flex-col gap-4 lg:order-none lg:col-span-2">
          <Tile label="Resources">
            <ul className="border-b border-border">
              {live.map((r) => {
                const row = (
                  <>
                    <span className="min-w-0">
                      <span className="block font-medium text-graphite">{r.title}</span>
                      <span className="block text-sm text-muted-foreground">{r.description}</span>
                    </span>
                    {!r.href.startsWith("/") ? (
                      <ArrowUpRight aria-hidden="true" className={cn(ARROW.external, "shrink-0 text-muted-foreground")} />
                    ) : (
                      <ArrowRight aria-hidden="true" className={cn(ARROW.internal, "shrink-0 text-muted-foreground")} />
                    )}
                  </>
                );
                const cls =
                  "group flex items-center justify-between gap-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone-light";
                return (
                  <li key={r.id} className="border-t border-border first:border-t-0">
                    {r.href.startsWith("/") ? (
                      <Link href={r.href} className={cls}>{row}</Link>
                    ) : (
                      <a href={r.href} target="_blank" rel="noreferrer noopener" className={cls}>
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
              {faq.map((g) => (
                <div key={g.group}>
                  <h3 className={cn(MONO.micro, "text-muted-foreground")}>{g.group}</h3>
                  <div className="mt-2 border-b border-border">
                    {g.items.map((item) => (
                      <details key={item.id} className="group/faq border-t border-border">
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

          {/* On a phone the question tile comes after the FAQ, where it's needed. */}
          <Tile label="Still have a question?" ink className="lg:hidden">
            <p className="leading-relaxed text-bone/80">Ask the Club team — anything about the space or your membership.</p>
            <a href="mailto:club@geekdom.com" className={cn("mt-5", LINK_ARROW_ON_INK)}>
              club@geekdom.com
              <ArrowUpRight aria-hidden="true" className={ARROW.external} />
            </a>
          </Tile>
        </div>

        {/* ── Right: the basics, in view while the FAQ scrolls ─────────── */}
        {/* First on a phone: the Wi-Fi and the hours are what members open this page for. */}
        <div className="order-1 flex flex-col gap-4 lg:sticky lg:top-20 lg:order-none">
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
                <dd className="mt-1 text-graphite">{res.hours}</dd>
              </div>
              <div>
                <dt className={cn(MONO.micro, "text-muted-foreground")}>Wi-Fi</dt>
                {res.wifiNetwork ? (
                  <dd className="mt-1 leading-relaxed text-graphite">
                    {res.wifiNetwork}
                    {res.wifiPassword && (
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2">
                        <span className="text-muted-foreground">Password</span>
                        <CopyText value={res.wifiPassword} label="Wi-Fi password" />
                      </span>
                    )}
                  </dd>
                ) : (
                  <dd className="mt-1 flex items-center gap-2 text-graphite">
                    Network and password
                    <span className={cn(MONO.micro, "border border-dashed border-border px-1.5 py-0.5")}>To confirm</span>
                  </dd>
                )}
              </div>
            </dl>
          </Tile>

          <Tile label="Still have a question?" ink className="hidden lg:flex">
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

import { IntrosCard } from "@/components/portal/intros-card";
import { introsFor } from "@/lib/portal/intros";
import { withStarters } from "@/lib/topics";
import { listDirectory, topicsInUse } from "@/lib/directory";
import { requirePortalMember } from "@/lib/portal/gate";
import { getMemberByEmail } from "@/lib/admin/queries";
import { formatPrice, hasTeam, planOf } from "@/lib/membership";
import { getTeam } from "@/lib/team";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { TeamCard } from "@/components/portal/team-card";
import { addMyTeammate, removeMyTeammate } from "@/lib/portal/team-actions";
import { MOCK_BILLING, MOCK_MEMBER_CARD, MOCK_MY_PROFILE } from "@/data/mock/portal";
import { saveMyProfile } from "@/lib/portal/profile-actions";
import type { Audience } from "@/lib/membership";
import { ARROW, HEADING, LINK, LINK_ARROW, MONO } from "@/components/site/section";
import { ArrowUpRight } from "lucide-react";
import { TERMS_PATH, termsCurrent } from "@/lib/terms";
import { PortalPage } from "@/components/portal/portal-page";
import { ProfileCard } from "@/components/portal/profile-card";
import { ManageBillingButton } from "@/components/portal/billing-drawer";
import { AddCardPanel, LiveBillingButton } from "@/components/portal/billing-live";
import { getBilling, stripeConfigured } from "@/lib/stripe/billing";
import { compDate, compRunning } from "@/lib/perks";
import { cn } from "@/lib/utils";

export const metadata = { title: "Profile" };

const CLUB_EMAIL = "club@geekdom.com";

const STATUS_LABEL = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due — update your card",
  canceled: "Canceled",
  inactive: "Paused",
} as const;

function longDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/*
  YOUR PROFILE — what other members see first, your membership beside it.

    ┌──────────────────────────────┬──────────────────────┐
    │ Directory profile   [Edit]   │ ▓ Club · Solo        │  Graphite band:
    │  portrait · name · role      │ ▓ Active · since …   │  plan, status
    │  headline · ask me about     ├──────────────────────┤
    │  "Complete your profile…"    │ Price · Next payment │  then billing,
    │  listed / links              │ Card  [Manage billing]│ one source of
    ├──────────────────────────────┤ Payment history      │  dates
    │ Your team (owners)           │                      │
    └──────────────────────────────┴──────────────────────┘

  It was a Graphite membership card AND a billing section that each had the
  plan and a date — and disagreed ("Renews —" beside "Next payment Nov
  23"). One panel now, and the profile — the part members actually work on
  — takes the wide column. On a phone the profile comes first.

  Billing is real when the member has a Stripe customer and Stripe is
  connected; until then it's SAMPLE data, said inside the billing panel
  (not as a page banner). Staff see the page as a labeled preview.
*/
export default async function ProfilePage(props: PageProps<"/portal/profile">) {
  const user = await requirePortalMember();
  const member = await getMemberByEmail(user.email);
  const { billing } = await props.searchParams;
  // The member's own card, or — for a team account — a SAMPLE member's,
  // so staff can review what members see (data/mock/portal.ts).
  const card = member ?? MOCK_MEMBER_CARD;
  const plan = planOf(member?.plan);
  // Their plan's monthly figure, from PLANS — never typed.
  const amount = plan.priceCents === null ? "" : formatPrice(plan.priceCents);
  const priceText = plan.priceCents === null ? "Terms agreed with Geekdom" : `${amount}/month`;

  // An OWNER of a Team or Enterprise membership manages its people here;
  // a TEAMMATE sees whose membership they're on, and no billing.
  const team = member && !member.teamOwnerId && hasTeam(member.plan) ? await getTeam(member.id) : null;
  const teamOwner = member?.teamOwnerId
    ? ((await getAdminDb().collection(COLLECTIONS.members).doc(member.teamOwnerId).get()).data() as MemberDoc | undefined)
    : undefined;
  const onTeamOf = teamOwner ? teamOwner.company || `${teamOwner.name}'s team` : null;

  // LIVE billing from Stripe for a member who pays (lib/stripe/billing.ts);
  // the SAMPLE only for staff previews and members not on Stripe yet.
  const live = member && !member.teamOwnerId ? await getBilling(member).catch(() => null) : null;
  const nextPayment = live ? longDate(live.periodEnd) : longDate(card.currentPeriodEnd ?? MOCK_BILLING.nextPayment);
  // A perk tag's complimentary membership (lib/perks.ts — "DEVSA community").
  const comp = member?.comp && compRunning(member.comp, new Date().getTime()) ? member.comp : null;
  const sampleBilling = !live && !comp;
  const shownCard = live ? live.card : MOCK_BILLING.card;
  // The LAST payment only — the full list (Upcoming, Paid, Due) is Manage billing's.
  // A second, older-style list here disagreed with it (Jesse, November 2026).
  const lastPaid = live
    ? live.invoices.find((i) => i.status === "paid") ?? null
    : { date: MOCK_BILLING.history[0].date, amount };

  return (
    <PortalPage
      eyebrow="Profile"
      title="Your profile."
      notice={
        member
          ? undefined
          : "You're on the Geekdom team — no membership or billing on this account. The membership and billing show a preview of what members see."
      }
    >
      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* ── The profile: how other members see you ────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          {/* A member's own stored profile; staff see the sample as a preview. */}
          <ProfileCard
            initial={
              member
                ? {
                    name: member.name,
                    headline: member.profile?.headline ?? "",
                    role: member.profile?.role ?? "",
                    company: member.profile?.company || member.company || "",
                    audience: (member.profile?.audience || "Founder") as Audience,
                    askMeAbout: member.profile?.askMeAbout ?? [],
                    lookingFor: member.profile?.lookingFor ?? "",
                    bio: member.profile?.bio ?? "",
                    website: member.profile?.website ?? "",
                    linkedin: member.profile?.linkedin ?? "",
                    listed: member.profile?.listed !== false,
                    photo: member.photo ?? undefined,
                  }
                : { ...MOCK_MY_PROFILE, name: user.name ?? "" }
            }
            save={member ? saveMyProfile : undefined}
            topicSuggestions={withStarters(topicsInUse(await listDirectory().catch(() => [])).map((t) => t.topic))}
          />

          {team && (
            <TeamCard
              team={{ ownerName: team.ownerName, company: team.company, seats: team.seats, teammates: team.teammates, plan: team.plan }}
              add={addMyTeammate}
              remove={removeMyTeammate}
            />
          )}

          {/* Who you've asked, and who asked you — the record behind the emails. */}
          {member && <IntrosCard intros={await introsFor(member.id).catch(() => [])} />}
        </div>

        {/* ── Membership and billing, one panel ─────────────────────────── */}
        <section id="billing" className="scroll-mt-24 border border-border bg-bone-light lg:col-span-2">
          {/* The membership band — what was the Graphite card, without repeating your name. */}
          <div className="bg-graphite px-6 py-5 text-bone sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <p className={cn(MONO.label, "text-bone/70")}>Geekdom Club · {member ? plan.name : "Member"}</p>
              {!member && <span className={cn(MONO.micro, "shrink-0 border border-bone/30 px-1.5 py-0.5 text-bone/80")}>Preview</span>}
            </div>
            <p className={cn(HEADING.subhead, "mt-3 text-bone")}>{STATUS_LABEL[card.status]}</p>
            <p className="mt-1 text-sm text-bone/70">
              Member since {longDate(card.joinedAt)}
              {onTeamOf ? ` · on ${onTeamOf}'s membership` : member?.company ? ` · ${member.company}` : ""}
            </p>
          </div>

          <div className="p-6 sm:p-7">
            {onTeamOf ? (
              /* A TEAMMATE pays nothing and sees no billing: the owner holds it. */
              <>
                <h2 className={cn(MONO.label, "text-muted-foreground")}>Billing</h2>
                <p className="mt-3 leading-relaxed text-graphite">
                  Your membership is part of {onTeamOf}&rsquo;s {plan.name} plan, and {teamOwner?.name} handles the billing.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Questions? <a href={`mailto:${CLUB_EMAIL}`} className={LINK}>{CLUB_EMAIL}</a>.
                </p>
              </>
            ) : member && !live && !comp && stripeConfigured() ? (
              /* A MEMBER WITH NOTHING ON STRIPE, billing live: the real card form — never the sample. */
              <>
                <h2 className={cn(MONO.label, "text-muted-foreground")}>Billing</h2>
                <div className="mt-3">
                  <AddCardPanel />
                </div>
                <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {plan.name} · {priceText}. Questions? <a href={`mailto:${CLUB_EMAIL}`} className={LINK}>{CLUB_EMAIL}</a>.
                </p>
              </>
            ) : comp && !live ? (
              /* COMPLIMENTARY, nothing in Stripe: no card, no sample billing — just the one line. */
              <>
                <h2 className={cn(MONO.label, "text-muted-foreground")}>Billing</h2>
                <p className="mt-3 leading-relaxed text-graphite">
                  Your membership is complimentary{comp.until ? ` until ${compDate(comp.until)}` : ""}, courtesy of {comp.label}. Nothing to pay
                  {comp.until ? " until then" : ""}.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {comp.until ? "We'll remind you before it ends. " : ""}Questions? <a href={`mailto:${CLUB_EMAIL}`} className={LINK}>{CLUB_EMAIL}</a>.
                </p>
              </>
            ) : (
              <>
                {comp && (
                  <p className="mb-5 border-l-2 border-clay bg-bone px-4 py-3 text-sm leading-relaxed text-graphite">
                    Complimentary{comp.until ? ` until ${compDate(comp.until)}` : ""}, courtesy of {comp.label}
                    {comp.paused ? " — your billing is paused until then." : "."}
                  </p>
                )}
                <div className="flex items-center justify-between gap-4">
                  <h2 className={cn(MONO.label, "text-muted-foreground")}>Billing</h2>
                  {/* The in-app billing drawer: live from Stripe, else the design mock. */}
                  {live ? (
                    <LiveBillingButton billing={live} planName={plan.name} />
                  ) : (
                    <ManageBillingButton
                      mock={{
                        price: priceText,
                        amount,
                        nextPayment: nextPayment ?? "",
                        card: MOCK_BILLING.card,
                        invoices: MOCK_BILLING.invoices,
                      }}
                    />
                  )}
                </div>
                {billing === "error" && (
                  <p role="alert" className="mt-4 text-sm text-geekdom-red">
                    Couldn&rsquo;t open billing just now. Try again in a minute.
                  </p>
                )}

                <dl className="mt-5 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                  <dt className="text-muted-foreground">Plan</dt>
                  <dd className="tabular-nums text-graphite">
                    {plan.name} · {priceText}
                  </dd>
                  <dt className="text-muted-foreground">{(live ? live.state === "canceling" : card.cancelAtPeriodEnd) ? "Ends" : "Next payment"}</dt>
                  <dd className="tabular-nums text-graphite">{nextPayment ?? "—"}</dd>
                  <dt className="text-muted-foreground">Card</dt>
                  <dd className="tabular-nums text-graphite">
                    {shownCard ? (
                      <>
                        {shownCard.brand} •••• {shownCard.last4}
                        <span className="text-muted-foreground"> · expires {shownCard.exp}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">None on file</span>
                    )}
                  </dd>
                  <dt className="text-muted-foreground">Last payment</dt>
                  <dd className="tabular-nums text-graphite">
                    {lastPaid ? (
                      <>
                        {lastPaid.amount}
                        <span className="text-muted-foreground"> · {longDate(lastPaid.date)}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">None yet</span>
                    )}
                  </dd>
                </dl>

                <p className="mt-5 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  Every invoice and receipt, your card, and cancelling are in Manage billing. Questions?{" "}
                  <a href={`mailto:${CLUB_EMAIL}`} className={LINK}>
                    {CLUB_EMAIL}
                  </a>
                  .
                </p>
                {sampleBilling && (
                  <p className="mt-3 border border-dashed border-border px-3 py-2 text-[13px] text-muted-foreground">
                    Sample billing — your real plan, card and receipts appear here once billing is connected.
                  </p>
                )}
              </>
            )}
          </div>
          {/* THE TERMS they agreed to — readable any time (Geekdom, November 2026). Staff previews have none. */}
          {member && (
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border px-6 py-4 text-sm sm:px-7">
              <span className="text-muted-foreground">
                Terms of Membership
                {member.terms && termsCurrent(member.terms) ? ` · you agreed on ${longDate(member.terms.acceptedAt)}` : ""}
              </span>
              <a href={TERMS_PATH} target="_blank" rel="noopener" className={cn(LINK_ARROW, "text-sm")}>
                Read the terms
                <ArrowUpRight aria-hidden="true" className={ARROW.external} />
              </a>
            </p>
          )}
        </section>
      </div>
    </PortalPage>
  );
}

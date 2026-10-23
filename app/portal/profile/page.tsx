import { requireMember } from "@/lib/auth/session";
import { getMemberByEmail } from "@/lib/admin/queries";
import { priceLabel } from "@/lib/membership";
import { MOCK_BILLING, MOCK_MEMBER_CARD, MOCK_MY_PROFILE } from "@/data/mock/portal";
import { HEADING, LINK, MONO } from "@/components/site/section";
import { PortalPage } from "@/components/portal/portal-page";
import { ProfileCard } from "@/components/portal/profile-card";
import { ManageBillingButton } from "@/components/portal/billing-drawer";
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
  PROFILE AND BILLING, ON ONE SCREEN — next-angels' layout.

    ┌──────────────────┬──────────────────────────────┐
    │ Membership card  │ Billing                      │
    ├──────────────────┤  plan · next payment · card  │
    │ Directory profile│  Manage billing              │
    │ (card) [Edit] ───┼──▶ slide-out form            │
    │                  │  Payment history (inside)    │
    └──────────────────┴──────────────────────────────┘

  It was three stacked sections with a ten-field form inline, and a member
  scrolled the length of the form to reach billing. Now the form opens in
  the slide-out from the profile card, and the card is its own preview.

  Billing is real when the member has a Stripe customer and Stripe is
  connected; otherwise SAMPLE data, labeled. Staff see it as a preview.
*/
export default async function ProfilePage(props: PageProps<"/portal/profile">) {
  const user = await requireMember();
  const member = await getMemberByEmail(user.email);
  const { billing } = await props.searchParams;
  // The member's own card, or — for a team account — a SAMPLE member's,
  // so staff can review what members see (data/mock/portal.ts).
  const card = member ?? MOCK_MEMBER_CARD;

  return (
    <PortalPage
      eyebrow="Profile"
      title="Your profile."
      notice={
        member
          ? "Profile edits aren't stored yet, and billing is a sample until you're on Stripe."
          : "You're on the Geekdom team — no membership or billing on this account. The membership card and billing show a preview of what members see."
      }
    >
      <div className="grid gap-4 lg:grid-cols-5">
        {/* ── Left: membership + directory profile ─────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/*
            THE MEMBERSHIP CARD — join date, renewal, status. A member sees
            their own. A team account has no membership (and often no display
            name), so staff see the card with SAMPLE member data, labeled as a
            preview — that's how the Geekdom team reviews what members see.
          */}
          <section className="border border-graphite bg-graphite p-6 text-bone sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <p className={cn(MONO.label, "text-bone/70")}>Geekdom Club · Member</p>
              {/* Inside the card, not above it: a label above pushed the card
                  down out of line with the billing section beside it. */}
              {!member && (
                <span className={cn(MONO.micro, "shrink-0 border border-bone/30 px-1.5 py-0.5 text-bone/80")}>
                  Preview
                </span>
              )}
            </div>
            <p className={cn(HEADING.subhead, "mt-4 text-bone")}>{card.name}</p>
            <p className="mt-1 text-sm text-bone/70">{card.email}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-bone/15 pt-5 text-sm">
              <div>
                <dt className={cn(MONO.label, "text-bone/60")}>Member since</dt>
                <dd className="mt-1 text-bone">{longDate(card.joinedAt)}</dd>
              </div>
              <div>
                <dt className={cn(MONO.label, "text-bone/60")}>{card.cancelAtPeriodEnd ? "Ends" : "Renews"}</dt>
                <dd className="mt-1 text-bone">{longDate(card.currentPeriodEnd) ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className={cn(MONO.label, "text-bone/60")}>Status</dt>
                {/* Text, not the status pill: its admin colors don't read on Graphite. */}
                <dd className="mt-1 text-bone">{STATUS_LABEL[card.status]}</dd>
              </div>
            </dl>
          </section>

          <ProfileCard initial={{ ...MOCK_MY_PROFILE, name: member?.name ?? user.name ?? "" }} />
        </div>

        {/* ── Right: billing, history inside ───────────────────────────── */}
        <section id="billing" className="scroll-mt-24 border border-border bg-bone-light p-6 sm:p-7 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className={cn(MONO.label, "text-muted-foreground")}>Billing</h2>
            {/* The in-app billing drawer (a mock until the Stripe keys are in). */}
            <ManageBillingButton
              mock={{
                price: priceLabel() ?? "",
                amount: priceLabel()?.split("/")[0] ?? "",
                nextPayment: longDate(card.currentPeriodEnd ?? MOCK_BILLING.nextPayment) ?? "",
                card: MOCK_BILLING.card,
                invoices: MOCK_BILLING.invoices,
              }}
            />
          </div>
          {billing === "error" && (
            <p role="alert" className="mt-4 text-sm text-geekdom-red">
              Couldn&rsquo;t open billing just now. Try again in a minute.
            </p>
          )}

          <dl className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-3">
            <div className="bg-bone p-5">
              <dt className={cn(MONO.label, "text-muted-foreground")}>Plan</dt>
              <dd className="mt-2 text-graphite">Club membership</dd>
              <dd className="tabular-nums text-sm text-muted-foreground">{priceLabel()}</dd>
            </div>
            <div className="bg-bone p-5">
              <dt className={cn(MONO.label, "text-muted-foreground")}>Next payment</dt>
              <dd className="mt-2 tabular-nums text-graphite">
                {longDate(card.currentPeriodEnd ?? MOCK_BILLING.nextPayment)}
              </dd>
              <dd className="text-sm text-muted-foreground">Billed monthly</dd>
            </div>
            <div className="bg-bone p-5">
              <dt className={cn(MONO.label, "text-muted-foreground")}>Card</dt>
              <dd className="mt-2 tabular-nums text-graphite">
                {MOCK_BILLING.card.brand} •••• {MOCK_BILLING.card.last4}
              </dd>
              <dd className="tabular-nums text-sm text-muted-foreground">Expires {MOCK_BILLING.card.exp}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Update your card, download receipts and invoices, or cancel — all from
            &ldquo;Manage billing.&rdquo; Questions? <a href={`mailto:${CLUB_EMAIL}`} className={LINK}>{CLUB_EMAIL}</a>.
          </p>

          <h3 className={cn(MONO.label, "mt-8 text-muted-foreground")}>Payment history</h3>
          <ul className="mt-3 border-b border-border">
            {MOCK_BILLING.history.map((p) => (
              <li key={p.date} className="grid grid-cols-[1fr_auto_auto] items-center gap-6 border-t border-border py-3">
                <span className="tabular-nums text-graphite">{longDate(p.date)}</span>
                <span className="tabular-nums text-muted-foreground">{priceLabel()?.split("/")[0]}</span>
                <span className={cn(MONO.label, "text-muted-foreground")}>{p.status}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PortalPage>
  );
}

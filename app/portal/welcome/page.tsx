import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getMemberByEmail } from "@/lib/admin/queries";
import { getAdminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type MemberDoc } from "@/lib/firebase/collections";
import { getBilling, stripeConfigured } from "@/lib/stripe/billing";
import { autoLink, summarize } from "@/lib/stripe/link";
import { getStripe } from "@/lib/stripe/server";
import { compDate, compRunning } from "@/lib/perks";
import { planOf, type Audience } from "@/lib/membership";
import { PortalPage } from "@/components/portal/portal-page";
import { WelcomeFlow, type MembershipCase } from "@/components/portal/welcome-flow";
import { listDirectory, topicsInUse } from "@/lib/directory";
import { prefillFromApplication } from "@/lib/application-prefill";
import { withStarters } from "@/lib/topics";

export const metadata = { title: "Welcome" };

/*
  WELCOME — the first sign-in (the dashboard sends a member here until
  they finish or put it off). Two steps, then on to the portal:

    1. YOUR PROFILE   photo, headline, bio, links — how members find them
    2. YOUR MEMBERSHIP what applies to them, said plainly (MembershipCase):
         team          on someone's Team membership — the owner pays
         complimentary a perk tag (DEVSA community) — until <date>
         paying        a Club subscription — "you're all set"
         card          a card on file, no Club billing yet (most Coworks-
                       era members) — the Club team starts it, timed so
                       nobody is charged twice
         none          nothing on Stripe — add a card (or later)

  Before deciding, it LINKS them to their Stripe customer by email
  (lib/stripe/link.ts) if they aren't linked — read-only on Stripe.
  Nobody is charged here: adding a card only saves it.
*/
export default async function WelcomePage() {
  const user = await requireMember();
  let member = await getMemberByEmail(user.email);
  // STAFF WITHOUT A MEMBERSHIP get a PREVIEW (until launch everyone walks
  // through this for feedback — WELCOME_EVERY_SIGN_IN): sample profile,
  // saving off, and a switch to view each membership case.
  if (!member) {
    if (!isAdmin(user)) redirect("/portal");
    return (
      <PortalPage
        compact
        eyebrow="Welcome · staff preview"
        title={`Welcome to Geekdom, ${(user.name ?? "").split(" ")[0] || "there"}.`}
        notice="You're on the Geekdom team, so this is a preview of what members see at first sign-in. Nothing you enter here is saved."
      >
        <WelcomeFlow
          preview
          topicSuggestions={(await suggestedTopics())}
          member={{ name: user.name ?? "Geekdom team", photo: null, plan: "Solo", profile: { headline: "", role: "", company: "", audience: "", askMeAbout: [], lookingFor: "", bio: "", website: "", linkedin: "", listed: true } }}
          membership={{ kind: "complimentary", label: "DEVSA community", until: compDate(new Date(new Date().getTime() + 365 * 86_400_000).toISOString()) }}
        />
      </PortalPage>
    );
  }

  if (stripeConfigured() && !member.stripeCustomerId && !member.teamOwnerId) {
    const linked = await autoLink(member);
    if (linked) member = (await getMemberByEmail(user.email)) ?? member;
  }

  const plan = planOf(member.plan);
  const now = new Date().getTime();
  let membership: MembershipCase;
  if (member.teamOwnerId) {
    const owner = (await getAdminDb().collection(COLLECTIONS.members).doc(member.teamOwnerId).get()).data() as MemberDoc | undefined;
    membership = { kind: "team", owner: owner?.name ?? "your team's owner", company: owner?.company ?? "" };
  } else if (member.comp && compRunning(member.comp, now)) {
    membership = { kind: "complimentary", label: member.comp.label, until: member.comp.until ? compDate(member.comp.until) : null };
  } else {
    const billing = await getBilling(member).catch(() => null);
    if (billing && (billing.state === "active" || billing.state === "past_due" || billing.state === "canceling")) {
      membership = {
        kind: "paying",
        price: billing.price,
        card: billing.card ? `${billing.card.brand} •••• ${billing.card.last4}` : null,
        next: billing.periodEnd ? compDate(billing.periodEnd) : null,
      };
    } else if (billing?.card && member.stripeCustomerId) {
      // A card on file, no Club billing. Anything else they're paying (Coworks)?
      const customer = await getStripe().customers.retrieve(member.stripeCustomerId).catch(() => null);
      const other = customer && !customer.deleted ? (await summarize(customer).catch(() => null))?.activeOther ?? [] : [];
      membership = { kind: "card", card: `${billing.card.brand} •••• ${billing.card.last4}`, other };
    } else {
      membership = { kind: "none", price: plan.priceCents ? `$${plan.priceCents / 100}/month` : "", stripe: stripeConfigured() };
    }
  }

  const p = member.profile;
  // A draft from their application for anything still empty (lib/application-prefill.ts).
  const current = {
    headline: p?.headline ?? "",
    bio: p?.bio ?? "",
    website: p?.website ?? "",
    linkedin: p?.linkedin ?? "",
    company: p?.company || member.company || "",
  };
  const prefill = await prefillFromApplication(member, current);
  const start = prefill?.fields ?? current;
  return (
    <PortalPage compact eyebrow="Welcome" title={`Welcome to Geekdom, ${member.name.split(" ")[0]}.`}>
      <WelcomeFlow
        member={{
          name: member.name,
          photo: member.photo,
          plan: plan.name,
          profile: {
            headline: start.headline,
            role: p?.role ?? "",
            company: start.company,
            audience: (p?.audience ?? "") as Audience | "",
            askMeAbout: p?.askMeAbout ?? [],
            lookingFor: p?.lookingFor ?? "",
            bio: start.bio,
            website: start.website,
            linkedin: start.linkedin,
            listed: p?.listed !== false,
          },
        }}
        membership={membership}
        topicSuggestions={await suggestedTopics()}
        prefilled={Boolean(prefill)}
      />
    </PortalPage>
  );
}

/** The topics members already use, for the "Ask me about" suggestions — never fails the page. */
async function suggestedTopics(): Promise<string[]> {
  const members = await listDirectory().catch(() => []);
  return withStarters(topicsInUse(members).map((t) => t.topic));
}

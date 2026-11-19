import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { CrownPage } from "@/components/site/crown-page";
import { ARROW, LINK_ARROW } from "@/components/site/section";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Manage membership",
  path: "/account",
  description: "Update your card, download invoices, or cancel your Geekdom membership — in the member portal.",
  robots: { index: false, follow: true },
});

/*
  /account — MEMBERS MANAGE BILLING IN THE PORTAL (Geekdom's call: they
  never see Stripe's hosted pages). This page used to email a link to
  Stripe's billing portal; now it sends them to sign in and opens
  Profile → Billing (the in-app drawer, components/portal/billing-live.tsx).
  Kept as a page, not a redirect, because old emails and bookmarks point
  here and deserve a sentence of explanation.
*/
export default function AccountPage() {
  return (
    <CrownPage
      shape="crown"
      eyebrow="Members"
      title={
        <>
          Manage your <span className="text-clay">membership.</span>
        </>
      }
      subtitle="Your card, invoices and membership are in the member portal now. Sign in with the email on your membership and open Billing."
    >
      <div className="max-w-md">
        <Link href="/sign-in?from=%2Fportal%2Fprofile%23billing" className={LINK_ARROW}>
          Sign in to manage billing
          <ArrowRight aria-hidden="true" className={ARROW.internal} />
        </Link>

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Not sure which email you used, or can&rsquo;t sign in? Write to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite">
            {CONTACT_EMAIL}
          </a>{" "}
          and we&rsquo;ll sort it out.
        </p>
      </div>
    </CrownPage>
  );
}

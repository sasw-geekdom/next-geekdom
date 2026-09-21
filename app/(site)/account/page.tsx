import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { CrownPage } from "@/components/site/crown-page";
import { BillingForm } from "@/components/forms/billing-form";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Manage membership",
  path: "/account",
  description:
    "Update your card, download invoices, or cancel your Geekdom membership.",
  robots: { index: false, follow: true },
});

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
      subtitle="Update your card, download invoices, or cancel. Enter the email on your membership and we'll send you a secure link."
    >
      <div className="max-w-md">
        <BillingForm />

        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
          Not sure which email you used, or the link isn&rsquo;t arriving? Write
          to{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-graphite underline decoration-clay decoration-2 underline-offset-2 transition-colors hover:decoration-graphite">
            {CONTACT_EMAIL}
          </a>{" "}
          and we&rsquo;ll sort it out.
        </p>
      </div>
    </CrownPage>
  );
}

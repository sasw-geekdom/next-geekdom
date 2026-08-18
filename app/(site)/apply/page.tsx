import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { CrownPage } from "@/components/site/crown-page";
import { ApplyForm } from "@/components/forms/apply-form";
import { isPriceAnnounced, priceLabel } from "@/lib/membership";

export const metadata: Metadata = pageMetadata({
  title: "Apply",
  path: "/apply",
  description:
    "Apply for membership at Geekdom — a club for serious founders and builders in San Antonio.",
});

export default function ApplyPage() {
  return (
    <CrownPage
      eyebrow="Apply"
      title={
        <>
          Tell us what you&rsquo;re <span className="text-rust">building.</span>
        </>
      }
      subtitle={
        <>
          Who&rsquo;s in the room is the whole point, so we read every
          application properly. This takes about five minutes.
          {isPriceAnnounced() &&
            ` Membership is ${priceLabel()} — nothing is charged until you're accepted.`}
        </>
      }
    >
      <ApplyForm />
    </CrownPage>
  );
}

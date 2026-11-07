import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  HEADING,
  Section,
} from "@/components/site/section";
import { cn } from "@/lib/utils";
import { ApplyForm } from "@/components/forms/apply-form";
import { PLAN_IDS, type PlanId } from "@/lib/membership";
import { Editorial } from "@/components/site/editorial";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Apply",
  path: "/apply",
  description:
    "Apply to the Club at Geekdom — one membership, by application, on the third floor in San Antonio. A person reads every application and answers within two weeks.",
});

export default async function ApplyPage(props: PageProps<"/apply">) {
  // /apply?plan=team — /club's plan cards link here with their plan chosen.
  const { plan } = await props.searchParams;
  const initialPlan: PlanId = PLAN_IDS.includes(plan as PlanId) ? (plan as PlanId) : "solo";
  return (
    /*
      NO MARK BESIDE THE FORM. /account carries a mark in a side rail (the
      404 and the sign-in did too, and were rebuilt without it); this page
      doesn't, because a fourteen-field form
      keeps somebody here for ten minutes and wants the whole width and
      nothing else in view.
    */
    <Section tone="bone">
      {/*
        THE SOURCE COPY'S HEADER AND OPENING, VERBATIM: eyebrow "APPLY",
        headline "Apply to Geekdom.", the Fraunces sub-headline, and one
        paragraph. It had been replaced with lines written here — "Tell us what
        you're building", an explanation of why there's an application (which
        Geekdom asked not to give), "about five minutes" (the doc and /club
        say ten), and the price, which now lives only on /club.
      */}
      <header className="mb-12 max-w-3xl">
        <Eyebrow>Apply</Eyebrow>
        <h1 className={cn("mt-4", HEADING.heading, "text-graphite")}>
          Apply to <span className="text-clay">Geekdom.</span>
        </h1>
        <Editorial className="mt-5 text-2xl leading-[1.4] text-graphite">
          Membership is by application. We respond within two weeks.
        </Editorial>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Geekdom is a members&rsquo; club for serious founders and builders
          in San Antonio. The application takes about ten minutes. Our team
          reads every application. We reply personally either way.
        </p>
      </header>

      {/*
        OUR OWN FORM AGAIN (November 2026): Geekdom moved off Typeform and
        Airtable to run the whole review in the admin. It posts to
        /api/apply, which saves the application for initial review and sends
        the "we have your application" email. Capped at the prose measure —
        a ten-minute form wants a comfortable column, not the full width.
      */}
      <div className="max-w-3xl">
        <ApplyForm initialPlan={initialPlan} />
      </div>
    </Section>
  );
}

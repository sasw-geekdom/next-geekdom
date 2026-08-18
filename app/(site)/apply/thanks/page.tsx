import type { Metadata } from "next";
import { ButtonLink, ButtonAnchor } from "@/components/ui/button";
import { Container, Eyebrow, PageTitle } from "@/components/site/section";
import { LUMA_CALENDAR_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Application received",
  // Nothing to gain from indexing a confirmation page, and it would compete
  // with /apply in search results.
  robots: { index: false, follow: false },
};

export default function ApplyThanksPage() {
  return (
    <section className="bg-sand py-28 sm:py-36">
      <Container className="max-w-2xl">
        <Eyebrow>Application received</Eyebrow>
        <PageTitle className="mt-5">
          We got it.
        </PageTitle>
        <p className="mt-8 text-xl leading-relaxed text-ink/75">
          Check your inbox for a confirmation. A person on the Geekdom team
          reads every application — if it&rsquo;s a fit, we&rsquo;ll send you an
          invitation to activate your membership.
        </p>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          In the meantime, our public events are open. Come by, meet people, see
          how the room feels.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/events" size="lg">
            See what&rsquo;s coming up
          </ButtonLink>
          <ButtonAnchor
            external
            href={LUMA_CALENDAR_URL}
            variant="outline"
            size="lg"
          >
            Subscribe on Luma
          </ButtonAnchor>
        </div>
      </Container>
    </section>
  );
}

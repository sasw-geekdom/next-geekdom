import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import {
  Eyebrow,
  HEADING,
  Section,
} from "@/components/site/section";
import { cn } from "@/lib/utils";
import { ApplyForm } from "@/components/forms/apply-form";
import { isPriceAnnounced, priceLabel } from "@/lib/membership";

export const metadata: Metadata = pageMetadata({
  ownCard: true,
  title: "Apply",
  path: "/apply",
  description:
    "Apply to the Club at Geekdom — one membership, by application, on the third floor in San Antonio. A person reads every application and answers within two weeks.",
});

export default function ApplyPage() {
  return (
    /*
      NO MARK BESIDE THE FORM, and /apply is the page that corrected the rule
      rather than the page that follows it.

      The rule as first written was "the rail is for short task pages", and it
      named this one. Two measurements say otherwise. The form is FOURTEEN
      FIELDS, and the page's own subtitle promises it takes five minutes. The
      shader was a requestAnimationFrame loop — it never settled. (The rail
      is a flat mark now, but a form still wants the full width.)

      SO THE DISTINCTION IS NOT LENGTH, IT IS WHETHER A PAGE HOLDS YOU. The 404
      and the admin login are glanced at and left; a mark in dead space there
      costs nobody anything. A form keeps somebody STATIONARY for minutes,
      typing, with an animation looping in the corner of their eye — and this
      is the one page on the site where that attention converts. It is the
      worst possible place to put a competing moving object.

      MOVING IT RIGHT WOULD NOT HELP, for the same reason it did not on the
      letter. A right rail interrupts reading less because it falls after the
      text, but nothing about peripheral motion over five minutes changes by
      swapping which side it loops on.

      And every instance of it is still borrowed against a sign-off the 2026
      guide has not given: it bans gradients on the marks outright.

      THE EYEBROW NAMES THE CLUB, because the page never did. The nav lists The
      Club, Studio and Apply as peers, and /studio sends people here by name —
      "come to a public event and apply to the Club" — while the word "Club"
      appeared once in the rendered page, in the navbar. The Studio has no
      application at all, so somebody arriving from it needs confirming they
      are in the right place rather than inferring it from the price.
    */
    <Section tone="bone">
      <header className="mb-12 max-w-3xl">
        <Eyebrow>Apply to the Club</Eyebrow>
        <h1 className={cn("mt-4", HEADING.heading, "text-graphite")}>
          Tell us what you&rsquo;re <span className="text-clay">building.</span>
        </h1>
        <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
          Who&rsquo;s in the room is the whole point, so we read every
          application properly. This takes about five minutes.
          {isPriceAnnounced() &&
            ` Membership is ${priceLabel()} — nothing is charged until you're accepted.`}
        </p>
      </header>

      {/*
        Narrower than the prose measure on /faq and the letter. Those are read
        left to right at 672px; a column of inputs is scanned down its left
        edge, and a wide field is a long way to travel back for the next one.
      */}
      <div className="max-w-xl">
        <ApplyForm />
      </div>
    </Section>
  );
}

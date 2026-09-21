import * as React from "react";
import { PageTitle, Section, Eyebrow, MONO } from "@/components/site/section";
import { formatLongDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The shell the privacy policy and the terms share.
 *
 * A PLAIN SECTION, not `CrownPage`. Every other read page on this site gets the
 * sticky shader rail, and these two deliberately don't: the rail is a second
 * WebGL context whose whole job is to give a long scroll something to travel
 * past, and nobody is enjoying the scroll on a privacy policy. The page is also
 * the one place on the site where being visibly plain is the correct register —
 * a legal page that looks art-directed reads as something being sold rather
 * than something being disclosed.
 *
 * `LAST_UPDATED` is required rather than optional. A legal page with no date on
 * it gives a reader no way to tell whether it still describes the service, and
 * it is the first thing anyone checks.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  /** One or two sentences, before the first heading. */
  intro: React.ReactNode;
  updated: Date;
  children: React.ReactNode;
}) {
  return (
    <Section tone="bone">
      {/*
        max-w-2xl on the whole column, not just the paragraphs. The brand
        guide caps body measure at 65–75 characters and this is the longest
        unbroken prose on the site after the letter — at full container width
        the lines run past 110 and the page stops being readable exactly where
        it most needs to be.
      */}
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <PageTitle className="mt-4">{title}</PageTitle>

        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {intro}
        </p>

        <p className={cn("mt-6", MONO.label, "text-muted-foreground")}>
          Last updated {formatLongDate(updated)}
        </p>

        <div className="mt-14 flex flex-col gap-12">{children}</div>
      </div>
    </Section>
  );
}

/**
 * One numbered-feeling block: a heading and its prose.
 *
 * Not actually numbered — the guide reserves numerals for figures and
 * eyebrows, and a legal page that numbers its clauses invites being quoted
 * clause-by-clause, which is a shape for a contract rather than for a page
 * that is trying to be read.
 */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium leading-snug text-graphite">{heading}</h2>
      <div className="mt-4 flex flex-col gap-4 leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-graphite [&_a]:underline [&_a]:decoration-clay [&_a]:decoration-2 [&_a]:underline-offset-2 [&_a:hover]:decoration-graphite">
        {children}
      </div>
    </section>
  );
}

/** A plain bulleted list inside a `LegalSection`. */
export function LegalList({ items }: { items: readonly React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 marker:text-rule">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

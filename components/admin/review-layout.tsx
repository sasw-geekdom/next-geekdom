import * as React from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import { QueuePager } from "@/components/admin/queue-pager";
import { Flash } from "@/components/admin/flash";
import { formatDateTime } from "@/lib/format";
import { collectLinks, prettyLink, splitLinks } from "@/lib/linkify";
import { cn } from "@/lib/utils";

/*
  THE REVIEW PAGE — one layout for an application and a request (ADMIN
  ONLY). Linear's issue page, adapted:

    ┌ Applications › Initial review                 3 of 13  ‹ › ┐
    │ Ryan Taylor                                      ■ Initial review │
    │ Solo · San Antonio · Applied Nov 3 · Imported from Airtable       │
    ├───────────────────────────────────────┬───────────────────────────┤
    │ WHAT THEY WROTE (grouped, the reading) │ Next step (sticky column) │
    │                                        │ Write-up (applications)   │
    │                                        │ Details · History         │
    └────────────────────────────────────────┴───────────────────────────┘

  READ LEFT, WRITE RIGHT. Research is reading the application while
  writing about it, so the answers lead the centre and the write-up sits
  in the side column beside them (`wide` gives it room for an editor).
  The write-up first in the centre pushed "Who they are" below the fold.

  A page, not a drawer: reviewing is reading long answers and making a
  decision that emails someone, and the decision should stay beside the
  answers. Previous / Next (and j / k) walk the rows of the list the
  reviewer came from, and a decision moves on to the next one.
*/

export function ReviewHeader({
  crumbs,
  title,
  meta,
  status,
  pager,
  flash,
}: {
  /** The list and the view it was opened from, each a link back. */
  crumbs: { href: string; label: string }[];
  title: string;
  /** One line: plan, city, when — the things worth knowing before reading. */
  meta: (string | null | undefined | false)[];
  status: React.ReactNode;
  pager?: { index: number; total: number; prevHref: string | null; nextHref: string | null; noun: string } | null;
  /** What the last decision did, carried over from the item before. */
  flash?: string | null;
}) {
  return (
    <header className="border-b border-border bg-bone-light px-6 pt-4 pb-5 lg:px-10">
      <div className="max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
            {crumbs.map((c, i) => (
              <React.Fragment key={c.href}>
                {i > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />}
                <Link href={c.href} className="truncate transition-colors hover:text-graphite">
                  {c.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
          {pager && <QueuePager {...pager} />}
        </div>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight font-medium tracking-tight text-graphite">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{meta.filter(Boolean).join(" · ")}</p>
          </div>
          <div className="pt-1.5">{status}</div>
        </div>
        {flash && <Flash text={flash} />}
      </div>
    </header>
  );
}

/** The two columns. The side column scrolls on its own, so the decision never leaves view. */
export function ReviewBody({ main, side, wide = false }: { main: React.ReactNode; side: React.ReactNode; wide?: boolean }) {
  return (
    <div className="px-6 py-8 lg:px-10">
      <div className={cn("grid max-w-7xl gap-8", wide ? "lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_460px]" : "lg:grid-cols-[minmax(0,1fr)_360px]")}>
        <div className="flex min-w-0 flex-col gap-10">{main}</div>
        <aside
          data-lenis-prevent
          className="flex flex-col gap-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain"
        >
          {side}
        </aside>
      </div>
    </div>
  );
}

/** A group of answers under one heading — "Who they are", "Why Geekdom". */
export function AnswerGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="pb-2 text-base font-medium text-graphite">{title}</h2>
      <dl className="border-y border-border">{children}</dl>
    </section>
  );
}

/*
  ONE ANSWER AS A ROW (Vercel's settings rows): a SHORT LABEL on the left,
  the answer on the right, a hairline between rows; stacked on a phone.
  The applicant saw Geekdom's full question — it's kept as `question`,
  shown on hover and read to screen readers, so nothing is lost; the
  short label is what makes a page of answers scannable. A string answer
  keeps its paragraph breaks and its links become clickable.
*/
export function Answer({ label, question, children }: { label?: string; question: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-border py-4 first:border-t-0 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
      <dt className={cn(ADMIN_LABEL, "text-muted-foreground")} title={label ? question : undefined}>
        {label ?? question}
        {label && <span className="sr-only"> — {question}</span>}
      </dt>
      <dd className="min-w-0 max-w-[70ch] leading-relaxed whitespace-pre-line text-graphite">
        {typeof children === "string" ? <LinkedText text={children} /> : children}
      </dd>
    </div>
  );
}

const LINK_CLASS = "text-graphite underline decoration-clay decoration-1 underline-offset-2 hover:decoration-graphite";

/** Freehand text with its links made clickable (lib/linkify.ts), shown as typed. */
export function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((p, i) =>
        p.href ? (
          <a key={i} href={p.href} target="_blank" rel="noreferrer noopener" className={cn(LINK_CLASS, "break-words")}>
            {p.text}
          </a>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * Several freehand link answers ("LinkedIn or personal site", "Links to
 * work") as ONE list of clickable links, each shown as host + path —
 * plus anything typed there that wasn't a link, so nothing is dropped.
 */
export function LinkList({ values }: { values: (string | undefined)[] }) {
  const { links, other } = collectLinks(...values);
  if (!links.length && !other.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      {links.map((href) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(LINK_CLASS, "inline-flex max-w-full items-center gap-1.5 self-start")}
        >
          <span className="truncate">{prettyLink(href)}</span>
          <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={1.8} />
        </a>
      ))}
      {other.length > 0 && <p className="text-muted-foreground">{other.join(" · ")}</p>}
    </div>
  );
}

/** Do these freehand answers hold anything worth a Links row? */
export const hasLinks = (...values: (string | undefined)[]) => {
  const { links, other } = collectLinks(...values);
  return links.length > 0 || other.length > 0;
};

/** A side-column card. */
export function SideCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-bone-light p-5">
      {title && <h2 className={cn(ADMIN_LABEL, "mb-3 text-muted-foreground")}>{title}</h2>}
      {children}
    </section>
  );
}

/** Label-left property rows (Linear's sidebar). Empty values are left out by the caller. */
export function Properties({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 text-sm">
      {rows.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0 break-words text-graphite">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function MailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-graphite underline decoration-clay decoration-1 underline-offset-2 hover:decoration-graphite">
      {email}
    </a>
  );
}

export function OutLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex max-w-full items-center gap-1 text-graphite underline decoration-clay decoration-1 underline-offset-2 hover:decoration-graphite"
    >
      <span className="truncate">{href.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0" strokeWidth={1.8} />
    </a>
  );
}

/** "linkedin.com/in/x" → "https://linkedin.com/in/x" — the first real link in a freehand answer, if any. */
export function siteHref(v?: string): string | undefined {
  return v ? splitLinks(v).find((p) => p.href)?.href : undefined;
}

/** Every step, who took it, when, and the note they left. */
export function Timeline({ steps }: { steps: { what: string; when?: string; note?: string }[] }) {
  return (
    <ol className="border-l border-border">
      {steps.map((s, i) => (
        <li key={i} className="relative pb-4 pl-4 last:pb-0">
          <span aria-hidden="true" className="absolute top-[7px] -left-[3px] h-1.5 w-1.5 bg-graphite" />
          <p className="text-sm text-graphite">{s.what}</p>
          {s.when && <p className="text-[13px] tabular-nums text-muted-foreground">{formatDateTime(s.when)}</p>}
          {s.note && <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{s.note}</p>}
        </li>
      ))}
    </ol>
  );
}

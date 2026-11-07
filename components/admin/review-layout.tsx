import * as React from "react";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import { QueuePager } from "@/components/admin/queue-pager";
import { Flash } from "@/components/admin/flash";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/*
  THE REVIEW PAGE — one layout for an application and a request (ADMIN
  ONLY). Linear's issue page, adapted:

    ┌ Applications › Initial review                 3 of 13  ‹ › ┐
    │ Ryan Taylor                                      ■ Initial review │
    │ Solo · San Antonio · Applied Nov 3 · Imported from Airtable       │
    ├───────────────────────────────────────┬───────────────────────────┤
    │ WHAT THEY WROTE (grouped, the reading) │ Decision  (sticky column) │
    │                                        │ Staff notes · Details     │
    │                                        │ History                   │
    └────────────────────────────────────────┴───────────────────────────┘

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
export function ReviewBody({ main, side }: { main: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
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
      <h2 className="border-b border-border pb-2 text-base font-medium text-graphite">{title}</h2>
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </section>
  );
}

/** One question, word for word, and the answer as they typed it (paragraph breaks kept). */
export function Answer({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={cn(ADMIN_LABEL, "text-muted-foreground")}>{question}</h3>
      <div className="mt-1.5 max-w-[70ch] leading-relaxed whitespace-pre-line text-graphite">{children}</div>
    </div>
  );
}

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

/** "linkedin.com/in/x" → "https://linkedin.com/in/x" — answers were typed freehand. */
export function siteHref(v?: string): string | undefined {
  const t = v?.trim();
  if (!t) return undefined;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
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

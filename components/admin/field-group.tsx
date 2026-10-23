import * as React from "react";
import { cn } from "@/lib/utils";
import { MONO } from "@/components/site/section";

/** A titled group of fields in an admin drawer — one column, ruled heading. */
export function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className={cn(MONO.label, "mb-5 w-full border-b border-border pb-2 text-muted-foreground")}>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/*
  A FOLDING GROUP, for long records — borrowed from next-angels'
  CollapsibleSection. Closed, its header still says what's inside ("Active ·
  since Mar 2024"), so a record reads at a glance and only the part being
  changed is open. A native <details>, so it opens from the keyboard and
  reports its state to screen readers with no script.
*/
export function FoldingGroup({
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  title: string;
  /** One line of what's inside, shown on the header while folded. */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group/fold border-b border-border">
      <summary className="flex cursor-pointer list-none items-center gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone [&::-webkit-details-marker]:hidden">
        <span className={cn(MONO.label, "w-32 shrink-0 text-muted-foreground")}>{title}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-graphite">{summary}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/fold:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </summary>
      <div className="flex flex-col gap-5 pb-6">{children}</div>
    </details>
  );
}

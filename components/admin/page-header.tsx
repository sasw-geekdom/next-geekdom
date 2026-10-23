import * as React from "react";
import { cn } from "@/lib/utils";
import { HEADING, MONO } from "@/components/site/section";

/*
  THE ADMIN PAGE HEADER — compact on purpose. The admin is a dense
  workspace, so it keeps a 24px title on a ruled Bone Light band rather than
  the member portal's Section-H1; but it shares the member side's structure
  (an eyebrow naming where you are) and its column: content stops at 80rem
  (max-w-7xl) instead of stretching across a wide monitor, and the side
  padding matches (px-6 / lg:px-10).
*/
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  /** The nav group the page sits in — "Members", "Site content". */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border bg-bone-light px-6 py-6 lg:px-10">
      <div className="flex max-w-7xl flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <p className={cn(MONO.label, "mb-2 text-muted-foreground")}>{eyebrow}</p>}
          <h1 className={cn(HEADING.subhead, "text-graphite")}>{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function AdminSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-8 lg:px-10">
      <div className="max-w-7xl">{children}</div>
    </div>
  );
}

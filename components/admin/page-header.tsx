import * as React from "react";
import { cn } from "@/lib/utils";
import { HEADING } from "@/components/site/section";

/*
  THE ADMIN PAGE HEADER — compact on purpose. The admin is a dense
  workspace, so it keeps a 24px title on a ruled Bone Light band rather than
  the member portal's Section-H1, and NO EYEBROW: the sidebar already says
  which group you're in, so a label over the title only repeated it. Its
  column matches the member side: content stops at 80rem
  (max-w-7xl) instead of stretching across a wide monitor, and the side
  padding matches (px-6 / lg:px-10).
*/
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="border-b border-border bg-bone-light px-6 py-5 lg:px-10">
      <div className="flex max-w-7xl flex-wrap items-end justify-between gap-4">
        <div>
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

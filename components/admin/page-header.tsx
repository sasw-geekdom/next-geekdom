import * as React from "react";
import { cn } from "@/lib/utils";
import { HEADING } from "@/components/site/section";

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
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-white px-6 py-6 lg:px-8">
      <div>
        <h1 className={cn(HEADING.subhead, "text-ink")}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AdminSection({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-8 lg:px-8">{children}</div>;
}

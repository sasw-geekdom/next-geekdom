import * as React from "react";
import { cn } from "@/lib/utils";
import { MONO } from "@/components/site/section";

/*
  ONE BOX OF THE DASHBOARD BENTO. Square, hairline-bordered, on Bone Light —
  or Graphite (`ink`) for the one tile that should read as a different kind
  of thing, the way the Studio panel does on the homepage. A mono label on
  top and an optional action at the top right, so every tile scans the same.
  `plainLabel` (the admin only) sets the label in sentence-case Rubik — the
  admin's workspace convention; the member portal keeps the mono label.
*/
export function Tile({
  label,
  action,
  ink = false,
  plainLabel = false,
  className,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  ink?: boolean;
  plainLabel?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col border p-6 sm:p-7",
        ink ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className={cn(plainLabel ? "text-[13px] font-medium" : MONO.label, ink ? "text-bone/70" : "text-muted-foreground")}>{label}</h2>
        {action}
      </div>
      <div className="mt-5 flex flex-1 flex-col">{children}</div>
    </section>
  );
}

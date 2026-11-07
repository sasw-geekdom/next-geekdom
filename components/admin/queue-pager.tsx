"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  "3 of 13  ‹ ›" — Previous / Next through the list the reviewer came from.
  j / k do the same (Linear's keys), except while typing in a field.
*/
export function QueuePager({
  index,
  total,
  prevHref,
  nextHref,
  noun,
}: {
  index: number;
  total: number;
  prevHref: string | null;
  nextHref: string | null;
  /** "application", "request" — for the buttons' accessible names. */
  noun: string;
}) {
  const router = useRouter();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "j" && nextHref) router.push(nextHref);
      if (e.key === "k" && prevHref) router.push(prevHref);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref]);

  const step = "inline-flex h-7 w-7 items-center justify-center border border-border bg-bone-light text-graphite transition-colors";
  const off = "pointer-events-none opacity-35";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] tabular-nums text-muted-foreground">
        {index + 1} of {total}
      </span>
      <div className="flex">
        {prevHref ? (
          <Link href={prevHref} aria-label={`Previous ${noun}`} title={`Previous ${noun} (k)`} className={cn(step, "hover:bg-bone")}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        ) : (
          <span aria-hidden="true" className={cn(step, off)}>
            <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
          </span>
        )}
        {nextHref ? (
          <Link href={nextHref} aria-label={`Next ${noun}`} title={`Next ${noun} (j)`} className={cn(step, "-ml-px hover:bg-bone")}>
            <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
          </Link>
        ) : (
          <span aria-hidden="true" className={cn(step, "-ml-px", off)}>
            <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
          </span>
        )}
      </div>
    </div>
  );
}

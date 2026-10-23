import * as React from "react";
import { cn } from "@/lib/utils";
import { HEADING, MONO } from "@/components/site/section";
import { SampleNotice } from "@/components/portal/sample-notice";

/*
  EVERY MEMBER-PORTAL PAGE STARTS THE SAME WAY: an eyebrow, the page's
  Section-H1, an optional notice, then its boxes — no full-width rules, no
  standfirst. One component so the four tabs can't drift apart again: the
  directory and FAQ used an older header that sat 12px lower, ruled a line
  past the content column, and set section headings at full size, so the
  title jumped when you switched tabs.
*/
export function PortalPage({
  eyebrow,
  title,
  notice,
  children,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  /** Shown in the dashed "Sample content" notice while a page is a mock. */
  notice?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-10 lg:px-10 lg:py-12", className)}>
      <p className={cn(MONO.eyebrow, "text-muted-foreground")}>{eyebrow}</p>
      <h1 className={cn("mt-3 text-graphite", HEADING.heading)}>{title}</h1>
      {notice && <SampleNotice className="mt-6">{notice}</SampleNotice>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

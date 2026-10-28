"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";
import { LINK } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  SHARE A FIELD NOTE — in the note's pinned header, so it's there from the
  cover to the last frame. "Share" opens the phone's own share sheet where
  there is one, and copies the link everywhere else ("Link copied"); LinkedIn
  is its own arrow link because that's where Geekdom's readers pass these
  around. Plain text links, Graphite with a Clay rule — not buttons.
*/
export function ShareNote({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const share = async () => {
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Dismissed share sheet, or clipboard refused — nothing to undo.
    }
  };
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  return (
    <span className="flex shrink-0 items-center gap-4 text-sm">
      <button type="button" onClick={share} className={cn(LINK, "cursor-pointer")}>
        {copied ? "Link copied" : "Share"}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
      <a href={linkedIn} target="_blank" rel="noreferrer noopener" className={cn("group inline-flex items-center gap-1", LINK)}>
        LinkedIn
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    </span>
  );
}

"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  A value with a Copy button — the Wi-Fi password, so a member on their
  phone doesn't have to select monospace text by hand. Falls back to the
  text staying selectable (select-all) where the clipboard is blocked.
*/
export function CopyText({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="select-all font-mono text-[0.8125rem] text-graphite">{value}</span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* the text stays select-all */
          }
        }}
        aria-label={copied ? `${label} copied` : `Copy the ${label}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
      >
        {copied ? <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2} /> : <Copy aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </span>
  );
}

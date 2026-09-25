"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Copy a block of text to the clipboard.
 *
 * `Source Copy v1` asks for this on /media's boilerplate: a journalist on
 * deadline wants the paragraph, not a selection drag that catches half the
 * heading above it.
 *
 * THE ONLY CLIENT COMPONENT ON THAT PAGE, and it is three lines of state. The
 * boilerplate itself is server-rendered prose — so the text is in the HTML,
 * indexable, and selectable by hand if the clipboard API is unavailable.
 * Nothing here is load-bearing for reading the page.
 *
 * `navigator.clipboard` NEEDS A SECURE CONTEXT and can reject when the
 * document is not focused or permission is denied. The catch leaves the label
 * alone rather than claiming a copy that did not happen — a button that says
 * "Copied" when the buffer is empty is worse than one that appears to do
 * nothing, because only one of those makes the reader check.
 */
/*
  THE BUTTON NEVER CHANGES SIZE. Both states are always rendered, stacked in
  one grid cell, and only their opacity changes (one after the other) — so the width is always the
  longer label ("Copy to clipboard") and swapping to "Copied" can't make the
  button jump. The icons do the same in their own 16px cell: the copy icon
  shrinks out as the check scales in, in Clay (a marker, which the guide lets
  Clay be). 200ms, and the global reduced-motion rule makes it instant.

  The live region is what a screen reader hears; the visual swap alone says
  nothing to it.
*/
// SEQUENTIAL, NOT A CROSSFADE: the outgoing state clears in 120ms and the
// incoming one starts as it finishes. Overlapped, the two labels read as one
// garbled word mid-swap ("Copy to clipCopied").
const OUT = "transition-[opacity,transform] duration-[120ms] ease-in";
const IN = "transition-[opacity,transform] duration-200 delay-[110ms] ease-out";

export function CopyButton({
  text,
  label = "Copy to clipboard",
  className,
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  // One timer at a time: a second click restarts the 2s instead of letting the
  // first click's timer reset the label early.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Left deliberately silent — see the note above.
    }
  }

  return (
    <Button type="button" variant="outline" onClick={copy} className={className}>
      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
        <Copy
          strokeWidth={2}
          className={cn(
            "col-start-1 row-start-1 size-4",
            copied ? cn(OUT, "scale-50 opacity-0") : cn(IN, "scale-100 opacity-100"),
          )}
        />
        <Check
          strokeWidth={2.25}
          className={cn(
            "col-start-1 row-start-1 size-4 text-clay",
            copied ? cn(IN, "scale-100 opacity-100") : cn(OUT, "scale-50 opacity-0"),
          )}
        />
      </span>
      {/* Start-aligned: "Copied" sits beside the check, not centered in the
          space the longer label reserves. */}
      <span className="grid justify-items-start text-left">
        <span
          className={cn(
            "col-start-1 row-start-1",
            copied ? cn(OUT, "opacity-0") : cn(IN, "opacity-100"),
          )}
        >
          {label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1",
            copied ? cn(IN, "opacity-100") : cn(OUT, "opacity-0"),
          )}
        >
          Copied
        </span>
      </span>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </Button>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Left deliberately silent — see the note above.
    }
  }

  return (
    <Button type="button" variant="outline" onClick={copy} className={className}>
      {copied ? (
        <Check className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Copy className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      )}
      {copied ? "Copied" : label}
    </Button>
  );
}

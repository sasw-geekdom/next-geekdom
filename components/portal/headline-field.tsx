"use client";

import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/*
  THE HEADLINE BOX — two lines that wrap, not a one-line input that
  scrolls a 160-character headline out of sight (Jesse, November 2026;
  prefilled headlines from applications are often that long). Still ONE
  paragraph: Enter adds no line break and pasted ones become spaces. A
  count shows how much room is left. Welcome flow and Profile → Edit.
*/

export const HEADLINE_MAX = 160;

export function HeadlineField({ id, value, onChange, placeholder, invalid = false }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; invalid?: boolean }) {
  const left = HEADLINE_MAX - value.length;
  return (
    <div className="relative">
      <Textarea
        id={id}
        rows={2}
        value={value}
        maxLength={HEADLINE_MAX}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, " "))}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        className="min-h-0 resize-none pb-5"
      />
      {/* Inside the box's corner, so the count costs no height. */}
      <p aria-hidden="true" className={cn("pointer-events-none absolute bottom-1.5 right-3 text-xs tabular-nums", left < 15 ? "text-graphite" : "text-muted-foreground")}>
        {value.length}/{HEADLINE_MAX}
      </p>
    </div>
  );
}

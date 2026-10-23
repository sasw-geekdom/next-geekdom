"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * An on/off control — a `<button role="switch">`, not a styled checkbox.
 *
 * Square, like every other control here: a Graphite track with a Bone knob
 * when on, a hairline Bone track when off. With `name`, a hidden input
 * carries "true"/"false" so it works inside a FormData form the same way
 * `Combobox` does.
 */
export function Switch({
  checked,
  onChange,
  label,
  name,
  id,
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Visible label, beside the switch. */
  label: React.ReactNode;
  name?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-3", className)}>
      {name && <input type="hidden" name={name} value={String(checked)} />}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-graphite bg-graphite" : "border-border bg-bone-light",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-0.5 h-4.5 w-4.5 transition-[left,background-color] duration-150",
            checked ? "left-[calc(100%-1.25rem)] bg-bone" : "left-0.5 bg-concrete",
          )}
        />
      </button>
      <span className="text-sm text-graphite">{label}</span>
    </label>
  );
}

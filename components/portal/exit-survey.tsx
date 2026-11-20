"use client";

import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { EXIT_NOTE_MAX, EXIT_REASONS, type ExitReason } from "@/lib/membership-exit";

/*
  THE EXIT SURVEY (lib/membership-exit.ts) — one optional question with
  one-tap answers, then an optional note. Both skippable: cancelling never
  waits on it. Answers are square rows (a radio group, keyboard-reachable),
  not a native select; tapping the chosen one again clears it.

  `audience`: the member's own words on their Cancel screen, or staff
  recording why someone left (the same reasons, so the two read together).
*/

export interface ExitAnswer {
  reason: ExitReason | null;
  note: string;
}

export function ExitSurvey({ value, onChange, audience = "member" }: { value: ExitAnswer; onChange: (v: ExitAnswer) => void; audience?: "member" | "staff" }) {
  const member = audience === "member";
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p id="exit-q" className="text-sm font-medium text-graphite">
          {member ? "Before you go — what's the main reason?" : "Why are they leaving?"}
        </p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{member ? "Optional. It helps us make the Club better." : "Optional — kept on their record."}</p>
      </div>
      <div role="radiogroup" aria-labelledby="exit-q" className="flex flex-col border border-border bg-bone-light">
        {EXIT_REASONS.map((r, i) => {
          const on = value.reason === r.id;
          return (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange({ ...value, reason: on ? null : r.id })}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay",
                i > 0 && "border-t border-border",
                on ? "bg-bone text-graphite" : "text-muted-foreground hover:bg-bone hover:text-graphite",
              )}
            >
              <span aria-hidden="true" className={cn("h-2.5 w-2.5 shrink-0 border", on ? "border-graphite bg-graphite" : "border-muted-foreground")} />
              {r.label}
            </button>
          );
        })}
      </div>
      <div>
        <label htmlFor="exit-note" className="text-sm font-medium text-graphite">
          {member ? "Anything we should know?" : "Note"}
        </label>
        <Textarea
          id="exit-note"
          value={value.note}
          maxLength={EXIT_NOTE_MAX}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          placeholder={member ? "Optional. Only the Geekdom team reads this." : "Optional. Staff only."}
          className="mt-1.5 min-h-20"
        />
      </div>
    </div>
  );
}

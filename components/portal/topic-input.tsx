"use client";

import * as React from "react";
import { X } from "lucide-react";

/*
  "ASK ME ABOUT" TOPICS — one field for the welcome flow and Profile → Edit.
  Type and press Enter (or comma); × removes. Up to six. The topics other
  members already use are offered as one-tap suggestions, so the directory
  gets one "fundraising", not "Fundraising", "fund raising" and
  "raising money" — a topic is only findable if people spell it alike.
*/

export const MAX_TOPICS = 6;

export function TopicInput({
  id,
  value,
  onChange,
  suggestions = [],
  invalid = false,
}: {
  id: string;
  value: string[];
  onChange: (topics: string[]) => void;
  /** Topics in use across the directory, most common first. */
  suggestions?: string[];
  invalid?: boolean;
}) {
  const [text, setText] = React.useState("");
  const has = (t: string) => value.some((v) => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (t && !has(t) && value.length < MAX_TOPICS) onChange([...value, t]);
    setText("");
  };
  const q = text.trim().toLowerCase();
  const offered = suggestions.filter((s) => !has(s) && (!q || s.toLowerCase().includes(q))).slice(0, 8);

  return (
    <div>
      <div
        className={
          "flex min-h-11 flex-wrap items-center gap-1.5 border bg-bone-light px-2 py-1.5 focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-1 " +
          (invalid ? "border-geekdom-red" : "border-border")
        }
      >
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 border border-border bg-bone px-2 py-0.5 text-sm text-graphite">
            {t}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="text-muted-foreground hover:text-graphite">
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        {value.length < MAX_TOPICS && (
          <input
            id={id}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add(text);
              } else if (e.key === "Backspace" && !text && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => text.trim() && add(text)}
            placeholder={value.length ? "" : "Type a topic and press Enter"}
            className="min-w-40 flex-1 bg-transparent px-1 py-1 text-base text-graphite outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      {offered.length > 0 && value.length < MAX_TOPICS && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Members use:</span>
          {offered.map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="border border-dashed border-border px-2 py-0.5 text-xs text-graphite hover:border-graphite">
              + {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

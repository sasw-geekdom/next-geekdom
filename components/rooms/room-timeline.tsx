"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { timeLabel } from "@/lib/rooms/rules";

/*
  ONE ROOM'S DAY — the 7 AM – 9 PM booking window, Central — as a strip of 30-minute
  cells with the booked time laid over it. Shared by the member page and
  the admin:

    · members: free future cells are clickable (a shortcut into the booking
      slide-out at that time); bookings show as "Booked" — never who;
    · staff: every block carries its label (the member, or why it's held).

  The cells are a mouse shortcut, so they're out of the tab order; the
  "Book" button and its slide-out are the keyboard path.
*/

const short = (iso: string) => timeLabel(iso).replace(":00", "").replace(" AM", "a").replace(" PM", "p");

export interface TimelineBlock {
  id: string;
  start: string;
  end: string;
  tone: "busy" | "mine" | "block" | "member";
  label?: string;
}

const TONE: Record<TimelineBlock["tone"], string> = {
  busy: "bg-graphite/15 text-graphite",
  mine: "bg-clay text-bone",
  block: "bg-graphite text-bone",
  member: "bg-graphite/80 text-bone",
};

export function RoomTimeline({
  slots,
  blocks,
  now,
  onPick,
  canPick,
  pickLabel,
  tall = false,
}: {
  /** The day's slot starts (46–50 of them). */
  slots: string[];
  blocks: TimelineBlock[];
  now: number;
  /** Free future cells call this with their start. */
  onPick?: (slot: string) => void;
  /** Narrows which free cells can be picked (a member can't hold two rooms at once). */
  canPick?: (slot: string) => boolean;
  /** "Book Cranberry at" — the cell's title prefix. */
  pickLabel?: string;
  /** Room for a label in each block (the admin). */
  tall?: boolean;
}) {
  const n = slots.length;
  const from = Date.parse(slots[0]);
  const step = n > 1 ? Date.parse(slots[1]) - from : 1800_000;
  const to = from + n * step;
  const busy = (t: number) => blocks.some((b) => Date.parse(b.start) <= t && Date.parse(b.end) > t);

  return (
    <div>
      <div className={cn("relative border border-border bg-bone-light", tall ? "h-11" : "h-9")}>
        {/* The cells */}
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {slots.map((s, i) => {
            const t = Date.parse(s);
            const past = t + step <= now;
            const free = !past && !busy(t) && (!canPick || canPick(s));
            const hourLine = i > 0 && new Date(t).getUTCMinutes() === 0;
            return onPick && free ? (
              <button
                key={s}
                type="button"
                tabIndex={-1}
                title={`${pickLabel ?? "Book at"} ${timeLabel(s)}`}
                onClick={() => onPick(s)}
                className={cn("h-full transition-colors hover:bg-clay/25", hourLine && "border-l border-border/70")}
              />
            ) : (
              <span
                key={s}
                aria-hidden="true"
                className={cn(
                  "h-full",
                  hourLine && "border-l border-border/70",
                  past && "bg-[repeating-linear-gradient(135deg,transparent_0_3px,var(--color-border)_3px_4px)]",
                )}
              />
            );
          })}
        </div>
        {/* The bookings */}
        {blocks.map((b) => {
          const s = Math.max(Date.parse(b.start), from);
          const e = Math.min(Date.parse(b.end), to);
          if (e <= s) return null;
          return (
            <div
              key={b.id}
              title={`${b.label ? `${b.label} · ` : ""}${timeLabel(b.start)} – ${timeLabel(b.end)}`}
              className={cn("pointer-events-none absolute inset-y-0 flex items-center overflow-hidden border-x border-bone-light px-1.5 text-xs font-medium whitespace-nowrap", TONE[b.tone])}
              style={{ left: `${((s - from) / (to - from)) * 100}%`, width: `${((e - s) / (to - from)) * 100}%` }}
            >
              {tall && b.label && <span className="truncate">{b.label}</span>}
            </div>
          );
        })}
      </div>
      {/* Hour marks in Central time: every 2 hours on a booking window, every
          3 on a whole day. The first sits at the left edge and the end is
          marked too, so the strip's span is readable at a glance. */}
      <div className="relative mt-1 h-4 text-[11px] tabular-nums text-muted-foreground" aria-hidden="true">
        {slots.map((s, i) => {
          const every = n <= 32 ? 4 : 6; // slots between labels
          if (i % every !== 0) return null;
          return (
            <span key={s} className={cn("absolute", i > 0 && "-translate-x-1/2")} style={{ left: `${(i / n) * 100}%` }}>
              {short(s)}
            </span>
          );
        })}
        <span className="absolute right-0">{short(new Date(to).toISOString())}</span>
      </div>
    </div>
  );
}

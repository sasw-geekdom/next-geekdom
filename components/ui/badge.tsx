import * as React from "react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, MemberStatus } from "@/lib/firebase/collections";

/*
  TWO SETS OF TONES, AND THE SPLIT IS LOAD-BEARING.

  ── Brand tones. Safe anywhere, including public pages. ──
  Three, drawn only from the 2026 guide palette. They differentiate by WEIGHT
  rather than by hue — a tinted chip against a filled one — because the guide
  has exactly one accent and an event card needs two chips that don't look
  alike. Text is graphite or bone throughout, so none of them depends on a
  color clearing a contrast bar it can't.

  ── Status tones. /admin ONLY. ──
  These are NOT brand colors and three of them are not in the palette at all.
  The exception is deliberate: a status chip has to encode five mutually
  distinguishable states at a glance, and the brand palette is one accent plus
  a reserved red plus three neutrals. Pushing five states through that yields
  five chips that look the same, which defeats the only thing a chip does.

  It is safe only because of where it renders — the review queue, the member
  roster, the application detail page: a staff tool behind an auth wall, seen
  by nobody outside Geekdom. DO NOT USE ONE ON A PUBLIC PAGE. If a public
  surface needs a third state, add a brand tone above rather than reaching
  down here.

  They are named for the STATE, not the color, so nobody reads "rust" and
  assumes Geekdom Red is doing brand work. Each pairs a tinted ground with
  text dark enough to clear AA on it; the tints at full strength are
  background colors, not text colors.
*/
const tones = {
  // Brand — public-safe.
  neutral: "bg-bone-light text-graphite/80 ring-graphite/10",
  accent: "bg-clay/12 text-graphite ring-clay/35",
  solid: "bg-graphite text-bone ring-graphite",

  // Status — /admin only.
  alert: "bg-[#ca3625]/10 text-[#8f2018] ring-[#ca3625]/25",
  pending: "bg-[#fcb316]/15 text-[#7a5405] ring-[#fcb316]/40",
  good: "bg-[#5eaf88]/15 text-[#276b4b] ring-[#5eaf88]/40",
  info: "bg-[#87c2ea]/20 text-[#1f5a83] ring-[#87c2ea]/50",
} as const;

export type Tone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/*
  Status → tone mappings live here rather than at each call site so the queue,
  the detail page, and the CSV legend can't drift into disagreeing about what
  color "waitlisted" is.

*/
const APPLICATION_TONES: Record<ApplicationStatus, Tone> = {
  new: "alert",
  reviewing: "pending",
  approved: "good",
  declined: "neutral",
  waitlisted: "info",
};

const MEMBER_TONES: Record<MemberStatus, Tone> = {
  active: "good",
  trialing: "info",
  past_due: "alert",
  canceled: "neutral",
  inactive: "neutral",
};

const MEMBER_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  inactive: "Inactive",
};

export function ApplicationBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge tone={APPLICATION_TONES[status]} className="capitalize">
      {status}
    </Badge>
  );
}

export function MemberBadge({ status }: { status: MemberStatus }) {
  return <Badge tone={MEMBER_TONES[status]}>{MEMBER_LABELS[status]}</Badge>;
}

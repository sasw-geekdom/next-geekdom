import * as React from "react";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, MemberStatus } from "@/lib/firebase/collections";

const tones = {
  neutral: "bg-sand-deep text-ink/80 ring-ink/10",
  rust: "bg-rust/10 text-rust-deep ring-rust/25",
  gold: "bg-gold/15 text-[#7a5405] ring-gold/40",
  sage: "bg-sage/15 text-[#276b4b] ring-sage/40",
  sky: "bg-sky/20 text-[#1f5a83] ring-sky/50",
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
  colour "waitlisted" is.

  The darkened text values above are deliberate: gold and sage at full strength
  are background colours, not text colours (gold on white is 1.8:1). Each tone
  pairs a tinted ground with an ink dark enough to clear AA on it.
*/
const APPLICATION_TONES: Record<ApplicationStatus, Tone> = {
  new: "rust",
  reviewing: "gold",
  approved: "sage",
  declined: "neutral",
  waitlisted: "sky",
};

const MEMBER_TONES: Record<MemberStatus, Tone> = {
  active: "sage",
  trialing: "sky",
  past_due: "rust",
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

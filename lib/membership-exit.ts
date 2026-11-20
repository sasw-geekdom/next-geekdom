/*
  WHY SOMEONE LEFT — the exit survey (Jesse, November 2026). Client-safe:
  the member's Cancel screen, the admin's slide-out and the server actions
  all read this list.

  The survey is ONE optional question with one-tap answers, plus an
  optional note. It never blocks the cancel, never pleads, and never
  offers a discount in exchange — the brand's "nothing feels salesy".
  Answers are stored on the member (`MemberDoc.cancellation`) and shown to
  staff in their slide-out; a member who changes their mind clears it.

  Order: the reasons a members' club most often hears, then the honest
  "didn't work out" ones, then Other. Keep the ids stable — they're
  stored; the labels can change.
*/

export const EXIT_REASONS = [
  { id: "not_using", label: "I'm not using it enough" },
  { id: "cost", label: "The cost" },
  { id: "moving", label: "I'm moving away" },
  { id: "work_changed", label: "My work changed (new job, company closed or acquired)" },
  { id: "break", label: "Taking a break — I may be back" },
  { id: "people", label: "I didn't find my people" },
  { id: "space", label: "The space didn't work for me" },
  { id: "other", label: "Something else" },
] as const;

export type ExitReason = (typeof EXIT_REASONS)[number]["id"];
export const EXIT_REASON_IDS = EXIT_REASONS.map((r) => r.id) as unknown as readonly [ExitReason, ...ExitReason[]];

export const exitReasonLabel = (id: string | null | undefined) => EXIT_REASONS.find((r) => r.id === id)?.label ?? null;

/** How it ended — and who ended it. */
export interface Cancellation {
  /** "member" when they cancelled themselves; otherwise the staff member's name. */
  by: string;
  /** end_of_period: Stripe stops the renewal; now: ended today; status: staff set Paused/Canceled (no Stripe). */
  how: "end_of_period" | "now" | "status";
  reason: ExitReason | null;
  note: string;
  /** ISO. */
  at: string;
}

export const EXIT_NOTE_MAX = 1000;

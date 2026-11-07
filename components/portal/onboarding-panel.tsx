"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARROW, HEADING, LINK, LINK_ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { STEP_COPY, type OnboardingStep } from "@/lib/onboarding";
import { markOnboardingStep, setOnboardingDismissed } from "@/lib/portal/onboarding-actions";

/*
  GET STARTED — the first-login checklist (lib/onboarding.ts) at the top of
  the dashboard. Each step's link marks it done, then goes where it says;
  "Skip" marks it done without going. "Not now" folds the panel to one line;
  it disappears for good once every step is done.

  Graphite numbers turn into checks as steps are done; nothing animates
  beyond the site's own transitions. Square, Bone Light, a hairline — a
  portal tile, not a modal: it never blocks the dashboard under it.
*/

export interface OnboardingStepView {
  id: OnboardingStep;
  href: string;
  external?: boolean;
}

export function OnboardingPanel({
  steps,
  done,
  dismissed,
}: {
  steps: OnboardingStepView[];
  done: string[];
  dismissed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [localDone, setLocalDone] = React.useState<string[]>(done);
  const finished = steps.filter((s) => localDone.includes(s.id)).length;

  if (finished === steps.length) return null;

  const mark = (id: OnboardingStep) => {
    setLocalDone((d) => (d.includes(id) ? d : [...d, id]));
    return markOnboardingStep(id);
  };

  if (dismissed) {
    return (
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-dashed border-border px-5 py-3 text-sm">
        <span className="text-graphite">
          Finish setting up <span className={cn(MONO.label, "ml-2 text-muted-foreground tabular-nums")}>{finished} of {steps.length} done</span>
        </span>
        <button
          type="button"
          className={cn(LINK, "cursor-pointer")}
          disabled={pending}
          onClick={() => startTransition(async () => { await setOnboardingDismissed(false); router.refresh(); })}
        >
          Resume
        </button>
      </div>
    );
  }

  return (
    <section aria-labelledby="onboarding-title" className="mb-6 border border-border bg-bone-light p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className={cn(MONO.label, "text-muted-foreground")}>Get started</p>
          <h2 id="onboarding-title" className={cn("mt-2 text-graphite", HEADING.subhead)}>
            Five minutes, and the portal is yours.
          </h2>
        </div>
        <p className={cn(MONO.label, "text-muted-foreground tabular-nums")}>
          {finished} of {steps.length} done
        </p>
      </div>
      {/* Progress, as segments — one per step. */}
      <div aria-hidden="true" className="mt-5 flex gap-1">
        {steps.map((s) => (
          <span key={s.id} className={cn("h-[3px] flex-1", localDone.includes(s.id) ? "bg-clay" : "bg-graphite/15")} />
        ))}
      </div>

      <ol className="mt-6 border-b border-border">
        {steps.map((s, i) => {
          const copy = STEP_COPY[s.id];
          const isDone = localDone.includes(s.id);
          return (
            <li key={s.id} className="grid grid-cols-[2rem_1fr] gap-x-4 border-t border-border py-4 sm:grid-cols-[2rem_1fr_auto] sm:items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 items-center justify-center border text-xs tabular-nums",
                  isDone ? "border-graphite bg-graphite text-bone" : "border-graphite/30 text-graphite",
                )}
              >
                {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : i + 1}
              </span>
              <div className="min-w-0">
                <p className={cn("font-medium text-graphite", isDone && "text-muted-foreground line-through decoration-graphite/30")}>
                  {copy.title}
                  {isDone && <span className="sr-only"> (done)</span>}
                </p>
                {!isDone && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>}
              </div>
              {!isDone && (
                <div className="col-start-2 mt-3 flex items-center gap-5 sm:col-start-3 sm:mt-0">
                  {s.external ? (
                    <a href={s.href} target="_blank" rel="noreferrer noopener" onClick={() => void mark(s.id)} className={cn("text-sm", LINK_ARROW)}>
                      {copy.cta}
                      <ArrowUpRight aria-hidden="true" className={ARROW.external} />
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={cn("cursor-pointer text-sm", LINK_ARROW)}
                      onClick={() => startTransition(async () => { await mark(s.id); router.push(s.href); })}
                    >
                      {copy.cta}
                      <ArrowRight aria-hidden="true" className={ARROW.internal} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:underline"
                    onClick={() => startTransition(async () => { await mark(s.id); })}
                  >
                    Skip
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <Button
        variant="ghost"
        size="sm"
        className="mt-4"
        disabled={pending}
        onClick={() => startTransition(async () => { await setOnboardingDismissed(true); router.refresh(); })}
      >
        Not now
      </Button>
    </section>
  );
}

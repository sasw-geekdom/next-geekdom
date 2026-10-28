"use client";

import * as React from "react";
import { ArrowDown, ArrowRight, ArrowUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARROW, HEADING, LINK_ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import type { MockForm, MockQuestion } from "@/data/mock/forms";

/*
  A MOCKUP OF A TYPEFORM THAT DOESN'T EXIST YET — for Geekdom's review.

  /club's "Plan an event" and /studio's partner ask will open real Typeforms
  once Geekdom builds them. Until then, on REVIEW BUILDS ONLY (localhost and
  Vercel preview links — never geekdom.com, see ON_LIVE_DOMAIN), the control
  opens this instead: the same full-page takeover the real popup gives, one
  question at a time, with the questions we propose (data/mock/forms.ts). So
  the team can feel the flow and approve the questions in one pass.

  NOTHING IS SENT. There is no submit handler, no request, no storage — the
  last step just says where the real form would submit, and a banner says
  "mockup" the whole time. Typing is allowed (it's event details, not card
  numbers), because a form you can't type into can't be judged.

  A native <dialog>: top layer, focus containment, Escape to close, focus
  back on the link — the same reasoning as the photo viewer and the admin
  drawer. Enter moves on; letter keys pick a choice, as in Typeform.
*/

const LETTERS = "ABCDEFGHIJ";

function Question({
  q,
  n,
  value,
  onChange,
  onNext,
}: {
  q: MockQuestion;
  n: number;
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
}) {
  const id = `mock-q-${n}`;
  const line =
    "w-full border-0 border-b-2 border-graphite/25 bg-transparent px-0 pb-2 text-2xl text-graphite outline-none transition-colors placeholder:text-graphite/30 focus:border-graphite";
  return (
    <div className="flex flex-col gap-6">
      <label htmlFor={id} className={cn("flex gap-3 text-graphite", HEADING.subhead)}>
        <span className={cn(MONO.label, "mt-2.5 flex shrink-0 items-center gap-1 text-muted-foreground")}>
          {n}
          <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
        </span>
        {q.label}
      </label>
      {"hint" in q && q.hint && <p className="-mt-3 pl-9 text-muted-foreground">{q.hint}</p>}
      <div className="pl-9">
        {q.kind === "text" &&
          (q.long ? (
            <textarea
              id={id}
              autoFocus
              rows={3}
              value={value[0] ?? ""}
              placeholder={q.placeholder}
              onChange={(e) => onChange([e.target.value])}
              className={cn(line, "resize-none")}
            />
          ) : (
            <input
              id={id}
              autoFocus
              value={value[0] ?? ""}
              placeholder={q.placeholder}
              onChange={(e) => onChange([e.target.value])}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onNext())}
              className={line}
            />
          ))}
        {q.kind === "pair" && (
          <div className="flex flex-col gap-6">
            {q.fields.map((f, i) => (
              <input
                key={f}
                id={i === 0 ? id : undefined}
                aria-label={f}
                autoFocus={i === 0}
                value={value[i] ?? ""}
                placeholder={f}
                onChange={(e) => {
                  const next = [...value];
                  next[i] = e.target.value;
                  onChange(next);
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onNext())}
                className={line}
              />
            ))}
          </div>
        )}
        {q.kind === "choice" && (
          <div id={id} role="radiogroup" aria-label={q.label} className="flex max-w-md flex-col gap-2">
            {q.options.map((o, i) => {
              const on = value[0] === o;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  autoFocus={i === 0}
                  onClick={() => {
                    onChange([o]);
                    window.setTimeout(onNext, 350);
                  }}
                  className={cn(
                    "flex items-center gap-3 border px-3 py-2.5 text-left text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                    on ? "border-graphite bg-graphite text-bone" : "border-graphite/25 bg-bone-light text-graphite hover:border-graphite",
                  )}
                >
                  <span
                    className={cn(
                      MONO.micro,
                      "flex h-6 w-6 shrink-0 items-center justify-center border",
                      on ? "border-bone/40" : "border-graphite/30",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="flex-1">{o}</span>
                  {on && <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypeformMock({ form, label }: { form: MockForm; label: string }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [open, setOpen] = React.useState(false);
  // -1 = welcome, 0..n-1 = questions, n = thanks
  const [step, setStep] = React.useState(-1);
  const [answers, setAnswers] = React.useState<string[][]>([]);
  const n = form.questions.length;

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const next = React.useCallback(() => setStep((s) => Math.min(n, s + 1)), [n]);
  const prev = () => setStep((s) => Math.max(-1, s - 1));

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setStep(-1);
          setAnswers([]);
          setOpen(true);
        }}
        className={LINK_ARROW}
      >
        {label}
        <ArrowRight aria-hidden="true" className={ARROW.internal} />
      </button>

      <dialog
        ref={ref}
        data-lenis-prevent
        aria-label={`${form.title} — mockup`}
        onClose={() => setOpen(false)}
        onKeyDown={(e) => {
          if (step < 0 || step >= n) return;
          const q = form.questions[step];
          if (q.kind !== "choice") return;
          const i = LETTERS.indexOf(e.key.toUpperCase());
          if (e.key.length === 1 && i >= 0 && i < q.options.length) {
            e.preventDefault();
            setAnswers((a) => Object.assign([...a], { [step]: [q.options[i]] }));
            window.setTimeout(next, 350);
          }
        }}
        className="lightbox m-0 h-svh max-h-none w-screen max-w-none bg-bone p-0 text-graphite"
      >
        {open && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4 bg-graphite px-5 py-2.5 text-bone">
              <p className={cn(MONO.label, "text-bone")}>Mockup — the real form is built in Typeform. Nothing you enter is sent.</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center text-bone/80 hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                <X className="h-5 w-5" strokeWidth={1.7} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 items-center overflow-y-auto px-6 py-10">
              <div className="mx-auto w-full max-w-2xl">
                {step < 0 && (
                  <div className="flex flex-col items-start gap-6">
                    <h2 className={cn(HEADING.heading, "text-graphite")}>{form.title}</h2>
                    <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">{form.intro}</p>
                    <Button type="button" variant="ink" size="lg" onClick={next} autoFocus>
                      Start
                    </Button>
                  </div>
                )}
                {step >= 0 && step < n && (
                  <div className="flex flex-col gap-8">
                    <Question
                      key={step}
                      q={form.questions[step]}
                      n={step + 1}
                      value={answers[step] ?? []}
                      onChange={(v) => setAnswers((a) => Object.assign([...a], { [step]: v }))}
                      onNext={next}
                    />
                    {form.questions[step].kind !== "choice" && (
                      <div className="flex items-center gap-3 pl-9">
                        <Button type="button" variant="ink" onClick={next}>
                          OK
                          <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          press <strong className="font-medium text-graphite">Enter ↵</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {step >= n && (
                  <div className="flex flex-col items-start gap-6">
                    <h2 className={cn(HEADING.heading, "text-graphite")}>{form.thanks}</h2>
                    <p className="max-w-lg leading-relaxed text-muted-foreground">
                      In the real form, this is where it submits. This mockup sent nothing.
                    </p>
                    <Button type="button" variant="ink" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {step >= 0 && step < n && (
              <div className="flex items-center gap-4 border-t border-border px-5 py-3">
                <div className="h-1 flex-1 bg-graphite/10" aria-hidden="true">
                  <div className="h-full bg-clay transition-[width] duration-300" style={{ width: `${(step / n) * 100}%` }} />
                </div>
                <span className={cn(MONO.label, "tabular-nums text-muted-foreground")}>
                  {step + 1} / {n}
                </span>
                <div className="flex">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous question"
                    className="flex h-9 w-9 items-center justify-center border border-border bg-bone-light hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                  >
                    <ArrowUp className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next question"
                    className="-ml-px flex h-9 w-9 items-center justify-center border border-border bg-bone-light hover:border-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                  >
                    <ArrowDown className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, CornerDownLeft, X } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Logo } from "@/components/site/logo";
import { MONO } from "@/components/site/section";
import { PLANS, planPrice, type PlanId } from "@/lib/membership";
import { DESCRIBES, HEARD_ABOUT, Q } from "@/lib/application-questions";
import { cn } from "@/lib/utils";

/*
  THE APPLICATION, FULL SCREEN, ONE QUESTION AT A TIME — the experience
  Geekdom liked in their Typeform, rebuilt on our own form (November 2026).

  /apply shows its heading and one red "Start application" button (Red is
  Apply's, and only Apply's). The button opens a native <dialog> that takes
  the whole viewport: the wordmark, a progress rule, and one question,
  large, with its answer under it. Enter moves on (Shift+Enter for a new
  line in a long answer); letters pick a choice; the arrows bottom right
  step back and forth.
  Closing keeps the answers for the visit — reopening picks up where they
  left off.

  SAME QUESTIONS, SAME SERVER. The questions are Geekdom's, word for word
  (lib/application-questions.ts); it posts the same payload to /api/apply
  as the long form did, honeypot included, and the server re-validates
  everything. Each screen checks its own answer against the same minimums
  so the server should never have to send anyone back — and if it does,
  the takeover jumps to the first question it flagged.
*/

type Values = {
  plan: PlanId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  website: string;
  heardAbout: string;
  heardAboutOther: string;
  formerMember: boolean | null;
  brag: string;
  building: string;
  shipped: string;
  links: string;
  describes: string[];
  describesOther: string;
  whyGeekdom: string;
  giveBack: string;
  excited: string;
  otherCommunities: string;
  anythingElse: string;
  company_url: string;
};
type Field = keyof Values;
type Errors = Partial<Record<Field, string>>;

const blank = (plan: PlanId): Values => ({
  plan,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  company: "",
  website: "",
  heardAbout: "",
  heardAboutOther: "",
  formerMember: null,
  brag: "",
  building: "",
  shipped: "",
  links: "",
  describes: [],
  describesOther: "",
  whyGeekdom: "",
  giveBack: "",
  excited: "",
  otherCommunities: "",
  anythingElse: "",
  company_url: "",
});

const LETTERS = "ABCDEFGHIJ";
const len = (s: string, n: number) => s.trim().length >= n;

interface Step {
  id: string;
  fields: Field[];
  question: (v: Values) => string;
  hint?: (v: Values) => string | undefined;
  optional?: boolean;
  /** Same minimums as lib/validation/schemas.ts — the server still decides. */
  check: (v: Values) => Errors;
}

const STEPS: Step[] = [
  { id: "plan", fields: ["plan"], question: () => "Which membership are you applying for?", hint: () => "You can talk it through with us later — this just tells us where to start.", check: () => ({}) },
  {
    id: "name",
    fields: ["firstName", "lastName"],
    question: () => "First, what's your name?",
    check: (v) => ({ ...(len(v.firstName, 1) ? {} : { firstName: "Add your first name." }), ...(len(v.lastName, 1) ? {} : { lastName: "Add your last name." }) }),
  },
  { id: "email", fields: ["email"], question: (v) => `Thanks, ${v.firstName.trim() || "there"}. What's your email?`, hint: () => "Where we'll write back.", check: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()) ? {} : { email: "Enter a valid email." }) },
  { id: "phone", fields: ["phone"], question: () => "And a phone number?", check: (v) => (len(v.phone, 7) ? {} : { phone: "Add a phone number." }) },
  { id: "city", fields: ["city"], question: () => "What city are you in?", check: (v) => (len(v.city, 2) ? {} : { city: "Add your city." }) },
  {
    id: "company",
    fields: ["company"],
    question: (v) => (v.plan === "solo" ? "Company, if you have one?" : "What's the company?"),
    hint: (v) => (v.plan === "solo" ? "Optional — press Enter to skip." : "Team and Enterprise memberships are for a company."),
    optional: true,
    check: (v) => (v.plan !== "solo" && !len(v.company, 1) ? { company: "Add your company — Team and Enterprise memberships are for a company." } : {}),
  },
  { id: "website", fields: ["website"], question: () => Q.site, check: (v) => (len(v.website, 4) ? {} : { website: "Add your LinkedIn or personal site." }) },
  {
    id: "heardAbout",
    fields: ["heardAbout", "heardAboutOther"],
    question: () => Q.heardAbout,
    check: (v) => (v.heardAbout ? {} : { heardAbout: "Pick one." }),
  },
  { id: "formerMember", fields: ["formerMember"], question: () => "Are you a current Geekdom member?", check: (v) => (v.formerMember === null ? { formerMember: "Pick one." } : {}) },
  { id: "brag", fields: ["brag"], question: () => Q.brag, check: (v) => (len(v.brag, 10) ? {} : { brag: "Brag about yourself in one sentence." }) },
  { id: "building", fields: ["building"], question: () => Q.building, check: (v) => (len(v.building, 10) ? {} : { building: "Tell us what you're building." }) },
  { id: "shipped", fields: ["shipped"], question: () => Q.shipped, check: (v) => (len(v.shipped, 10) ? {} : { shipped: "Tell us what you've shipped, sold or built lately." }) },
  { id: "links", fields: ["links"], question: () => Q.links, hint: () => "Optional — a demo, a repo, a product, a talk.", optional: true, check: () => ({}) },
  { id: "describes", fields: ["describes", "describesOther"], question: () => Q.describes, check: (v) => (v.describes.length ? {} : { describes: "Pick at least one." }) },
  { id: "whyGeekdom", fields: ["whyGeekdom"], question: () => Q.whyGeekdom, check: (v) => (len(v.whyGeekdom, 10) ? {} : { whyGeekdom: "Tell us why Geekdom." }) },
  { id: "giveBack", fields: ["giveBack"], question: () => Q.giveBack, check: (v) => (len(v.giveBack, 10) ? {} : { giveBack: "Tell us what you'll give back." }) },
  { id: "excited", fields: ["excited"], question: () => Q.excited, check: (v) => (len(v.excited, 10) ? {} : { excited: "Tell us what you're most excited to do." }) },
  { id: "otherCommunities", fields: ["otherCommunities"], question: () => Q.otherCommunities, hint: () => "Optional.", optional: true, check: () => ({}) },
  { id: "anythingElse", fields: ["anythingElse"], question: () => Q.anythingElse, hint: () => "Optional — this is the last one.", optional: true, check: () => ({}) },
];

const LONG: Field[] = ["building", "shipped", "links", "whyGeekdom", "giveBack", "excited", "anythingElse"];

/** One lettered choice — a radio, or a checkbox in a multi-pick. */
function Choice({
  n,
  on,
  onClick,
  children,
  multi = false,
  focus = false,
}: {
  n: number;
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
  /** Takes the cursor when the question opens — the picked choice, so Enter keeps it. */
  focus?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={on}
      onClick={onClick}
      {...(focus ? { "data-step-focus": true } : {})}
      className={cn(
        "flex w-full items-center gap-3 border px-3 py-2.5 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
        on ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite hover:border-graphite",
      )}
    >
      <span className={cn(MONO.label, "flex h-6 w-6 shrink-0 items-center justify-center border", on ? "border-bone/40 text-bone" : "border-border text-muted-foreground")}>{LETTERS[n]}</span>
      <span className="flex-1">{children}</span>
      {on && <Check aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2} />}
    </button>
  );
}

export function ApplyTakeover({ initialPlan = "solo", autoOpen = false }: { initialPlan?: PlanId; autoOpen?: boolean }) {
  const router = useRouter();
  const ref = React.useRef<HTMLDialogElement>(null);
  const [open, setOpen] = React.useState(autoOpen);
  const [i, setI] = React.useState(0);
  const [v, setV] = React.useState<Values>(() => blank(initialPlan));
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const set = <K extends Field>(k: K, val: Values[K]) => {
    setV((x) => ({ ...x, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Open and close the takeover; the page behind doesn't scroll under it.
  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    const root = document.documentElement;
    const prev = root.style.overflow;
    if (open) root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
    };
  }, [open]);

  // Each new question takes the cursor.
  React.useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      ref.current?.querySelector<HTMLElement>("[data-step-focus]")?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [i, open]);

  function go(to: number) {
    setFormError(null);
    setI(Math.max(0, Math.min(STEPS.length - 1, to)));
  }

  function next() {
    const errs = step.check(v);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (last) submit();
    else go(i + 1);
  }

  async function submit() {
    // Every screen again, in case an answer was emptied after moving on.
    for (let s = 0; s < STEPS.length; s++) {
      const errs = STEPS[s].check(v);
      if (Object.keys(errs).length) {
        setErrors(errs);
        go(s);
        return;
      }
    }
    setPending(true);
    setFormError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, formerMember: Boolean(v.formerMember) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.fields) {
          const fields = body.fields as Errors;
          setErrors(fields);
          const at = STEPS.findIndex((s) => s.fields.some((f) => fields[f]));
          if (at >= 0) go(at);
        }
        setFormError(body.error ?? "Something went wrong. Try again.");
        setPending(false);
        return;
      }
      router.push("/apply/thanks");
    } catch {
      setFormError("Couldn't reach the server. Check your connection and try again.");
      setPending(false);
    }
  }

  /*
    THE KEYS, anywhere in the takeover (a listener on the question's box
    missed Enter whenever the cursor had wandered off it):
      Enter        next — or, on a focused choice, the button's own click
      Shift+Enter  a new line in a long answer
      A, B, C…     pick a choice, when the cursor isn't in a text box
  */
  React.useEffect(() => {
    if (!open) return;
    function onLetter(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (e.key === "Enter") {
        if (e.shiftKey || pending || e.isComposing || t.tagName === "BUTTON" || t.tagName === "A") return;
        e.preventDefault();
        next();
        return;
      }
      if (/^(INPUT|TEXTAREA)$/.test(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = LETTERS.indexOf(e.key.toUpperCase());
      if (n < 0) return;
      if (step.id === "plan" && PLANS[n]) choosePlan(PLANS[n].id);
      if (step.id === "heardAbout" && HEARD_ABOUT[n]) chooseHeard(HEARD_ABOUT[n]);
      if (step.id === "formerMember" && n < 2) chooseMember(n === 0);
      if (step.id === "describes" && DESCRIBES[n]) toggleDescribes(DESCRIBES[n]);
    }
    window.addEventListener("keydown", onLetter);
    return () => window.removeEventListener("keydown", onLetter);
  });

  // A single choice moves on by itself, after a beat to see it ticked.
  const advance = () => window.setTimeout(() => setI((x) => Math.min(STEPS.length - 1, x + 1)), 280);
  function choosePlan(id: PlanId) {
    set("plan", id);
    advance();
  }
  function chooseHeard(h: string) {
    set("heardAbout", h);
    if (h !== "Other") advance();
  }
  function chooseMember(yes: boolean) {
    set("formerMember", yes);
    advance();
  }
  function toggleDescribes(d: string) {
    setV((x) => ({ ...x, describes: x.describes.includes(d) ? x.describes.filter((y) => y !== d) : [...x.describes, d] }));
    setErrors((e) => ({ ...e, describes: undefined }));
  }

  const err = (f: Field) =>
    errors[f] ? (
      <p role="alert" className="mt-3 text-sm text-geekdom-red">
        {errors[f]}
      </p>
    ) : null;

  const big = "h-14 text-lg";
  const text = (f: Field, props: React.InputHTMLAttributes<HTMLInputElement> = {}, focus = true) => (
    <Input
      id={`ap-${f}`}
      value={v[f] as string}
      onChange={(e) => set(f, e.target.value as never)}
      aria-invalid={Boolean(errors[f])}
      aria-labelledby="ap-question"
      className={big}
      {...(focus ? { "data-step-focus": true } : {})}
      {...props}
    />
  );
  const area = (f: Field) => (
    <Textarea
      id={`ap-${f}`}
      value={v[f] as string}
      onChange={(e) => set(f, e.target.value as never)}
      aria-invalid={Boolean(errors[f])}
      aria-labelledby="ap-question"
      className="min-h-36 text-lg"
      data-step-focus
    />
  );

  function body() {
    switch (step.id) {
      case "plan":
        return (
          <div role="radiogroup" aria-labelledby="ap-question" className="grid gap-2.5 focus:outline-none">
            {PLANS.map((p, n) => (
              <Choice key={p.id} n={n} on={v.plan === p.id} focus={v.plan === p.id} onClick={() => choosePlan(p.id)}>
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 tabular-nums opacity-75">{planPrice(p)}</span>
                <span className="block text-sm opacity-75">{p.blurb}</span>
              </Choice>
            ))}
          </div>
        );
      case "name":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="ap-firstName" className="sr-only">First name</label>
              {text("firstName", { autoComplete: "given-name", placeholder: "First name", "aria-labelledby": undefined })}
              {err("firstName")}
            </div>
            <div>
              <label htmlFor="ap-lastName" className="sr-only">Last name</label>
              {text("lastName", { autoComplete: "family-name", placeholder: "Last name", "aria-labelledby": undefined }, false)}
              {err("lastName")}
            </div>
          </div>
        );
      case "email":
        return (<>{text("email", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "name@example.com" })}{err("email")}</>);
      case "phone":
        return (<>{text("phone", { type: "tel", autoComplete: "tel", placeholder: "(210) 555-0123" })}{err("phone")}</>);
      case "city":
        return (<>{text("city", { autoComplete: "address-level2", placeholder: "San Antonio" })}{err("city")}</>);
      case "company":
        return (<>{text("company", { autoComplete: "organization" })}{err("company")}</>);
      case "website":
        return (<>{text("website", { inputMode: "url", placeholder: "https://linkedin.com/in/…" })}{err("website")}</>);
      case "heardAbout":
        return (
          <>
            <div role="radiogroup" aria-labelledby="ap-question" tabIndex={-1} {...(v.heardAbout ? {} : { "data-step-focus": true })} className="grid gap-2.5 focus:outline-none sm:grid-cols-2">
              {HEARD_ABOUT.map((h, n) => (
                <Choice key={h} n={n} on={v.heardAbout === h} focus={v.heardAbout === h} onClick={() => chooseHeard(h)}>
                  {h}
                </Choice>
              ))}
            </div>
            {v.heardAbout === "Other" && (
              <div className="mt-4">
                <label htmlFor="ap-heardAboutOther" className="mb-2 block text-sm text-muted-foreground">How did you hear?</label>
                {text("heardAboutOther", { "aria-labelledby": undefined }, false)}
              </div>
            )}
            {err("heardAbout")}
          </>
        );
      case "formerMember":
        return (
          <>
            <div role="radiogroup" aria-labelledby="ap-question" tabIndex={-1} {...(v.formerMember === null ? { "data-step-focus": true } : {})} className="grid max-w-sm gap-2.5 focus:outline-none">
              <Choice n={0} on={v.formerMember === true} focus={v.formerMember === true} onClick={() => chooseMember(true)}>Yes</Choice>
              <Choice n={1} on={v.formerMember === false} focus={v.formerMember === false} onClick={() => chooseMember(false)}>No</Choice>
            </div>
            {err("formerMember")}
          </>
        );
      case "brag":
        return (<>{text("brag")}{err("brag")}</>);
      case "otherCommunities":
        return (<>{text("otherCommunities")}{err("otherCommunities")}</>);
      case "describes":
        return (
          <>
            <p className="-mt-2 mb-4 text-sm text-muted-foreground">Pick all that apply.</p>
            {/* The cursor sits on the group, not a box: Enter means "next" here, never "tick A". */}
            <div role="group" aria-labelledby="ap-question" tabIndex={-1} data-step-focus className="grid gap-2 focus:outline-none">
              {DESCRIBES.map((d, n) => (
                <Choice key={d} n={n} multi on={v.describes.includes(d)} onClick={() => toggleDescribes(d)}>
                  {d}
                </Choice>
              ))}
            </div>
            {v.describes.includes("Other") && (
              <div className="mt-4">
                <label htmlFor="ap-describesOther" className="mb-2 block text-sm text-muted-foreground">What describes you?</label>
                {text("describesOther", { "aria-labelledby": undefined }, false)}
              </div>
            )}
            {err("describes")}
          </>
        );
      default:
        return LONG.includes(step.id as Field) ? (<>{area(step.id as Field)}{err(step.id as Field)}</>) : null;
    }
  }

  const progress = Math.round((i / STEPS.length) * 100);
  const isLong = LONG.includes(step.id as Field);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("primary", "lg")}>
        {i > 0 ? "Continue your application" : "Start application"}
      </button>

      <dialog
        ref={ref}
        aria-label="Apply to Geekdom"
        data-lenis-prevent=""
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        className="apply-takeover fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-bone p-0 text-graphite"
      >
        <div className="flex min-h-full flex-col">
          {/* The bar: the mark, where you are, and the way out. */}
          <header className="sticky top-0 z-10 border-b border-border bg-bone">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-6">
              <span className="flex items-center gap-3">
                <Logo title="Geekdom" className="h-7 w-auto" />
                <span aria-hidden="true" className="h-5 w-px bg-border" />
                <span className={cn(MONO.label, "text-muted-foreground")}>Application</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
              >
                Close
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={1.7} />
              </button>
            </div>
            {/* Progress: a Clay rule across the bar — a marker, never a fill. */}
            <div aria-hidden="true" className="h-0.5 bg-border">
              <div className="h-full bg-clay transition-[width] duration-300" style={{ width: `${progress}%` }} />
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-12 sm:py-16">
            <div key={step.id} className="apply-step">
              <p className={cn(MONO.label, "flex items-center gap-2 text-muted-foreground")}>
                <span className="tabular-nums">
                  {i + 1} of {STEPS.length}
                </span>
                {step.optional && <span>· optional</span>}
              </p>
              <h2 id="ap-question" className="mt-3 text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
                {step.question(v)}
              </h2>
              {step.hint?.(v) && <p className="mt-2 text-muted-foreground">{step.hint(v)}</p>}
              <div className="mt-7">{body()}</div>

              {formError && (
                <p role="alert" className="mt-6 border border-dashed border-geekdom-red px-4 py-3 text-sm text-geekdom-red">
                  {formError}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                {last ? (
                  <Button type="button" size="lg" onClick={next} disabled={pending}>
                    {pending ? "Sending…" : "Send application"}
                  </Button>
                ) : (
                  <Button type="button" variant="ink" onClick={next}>
                    OK
                    <Check aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
                  </Button>
                )}
                <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:inline-flex">
                  press <kbd className="font-medium text-graphite">Enter</kbd>
                  <CornerDownLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />
                  {isLong && <span>· Shift + Enter for a new line</span>}
                </span>
              </div>
              {last && (
                <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                  A person on the Geekdom team reads every application. Nothing is charged now — if it&rsquo;s a fit, we&rsquo;ll email you to start your membership.
                </p>
              )}
            </div>
          </main>

          {/* Back and forth, bottom right — Typeform's place for them. */}
          <nav aria-label="Questions" className="sticky bottom-0 flex justify-end gap-px px-6 pb-6">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous question" className="inline-flex h-10 w-10 items-center justify-center bg-graphite text-bone disabled:opacity-30">
              <ArrowUp className="h-4 w-4" strokeWidth={1.8} />
            </button>
            <button type="button" onClick={next} disabled={last} aria-label="Next question" className="inline-flex h-10 w-10 items-center justify-center bg-graphite text-bone disabled:opacity-30">
              <ArrowDown className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </nav>

          {/* Honeypot — off-screen, out of the tab order (see /api/apply). */}
          <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
            <label htmlFor="ap-company_url">Company URL</label>
            <input id="ap-company_url" tabIndex={-1} autoComplete="off" value={v.company_url} onChange={(e) => set("company_url", e.target.value)} />
          </div>
        </div>
      </dialog>
    </>
  );
}

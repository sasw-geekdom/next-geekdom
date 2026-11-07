"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { PLANS, planPrice, type PlanId } from "@/lib/membership";
import { DESCRIBES, HEARD_ABOUT, Q } from "@/lib/application-questions";
import { cn } from "@/lib/utils";

type Errors = Record<string, string>;

/*
  A closed list, and its value IS its label — the server
  validates against the same constant, so nothing is translated between the
  two. Built once at module scope: the form re-renders on every validation
  pass, and remapping these each time is work for nothing.
*/
const HEARD_OPTIONS = HEARD_ABOUT.map((h) => ({ value: h, label: h }));

/*
  THE THREE SECTIONS, AND WHAT SEPARATES THEM.

  Fourteen fields in one column need a break the eye can find. It had gap
  alone — forty pixels of nothing between a text input and a mono legend,
  which at a glance reads as one long form rather than three parts.

  A HAIRLINE, WHICH IS THE SITE'S OWN ANSWER. The design notes say it plainly:
  where the rhythm needs a break and the tone cannot change, use a `border-rule`
  hairline. Sections two and three open with one; the first does not need it,
  because the page header already ends above it.

  CLAY AS THE RULE, NOT THE WORDS. The accent cannot touch a 12px legend —
  Clay is 3.5:1 on bone and fails AA for anything at body size, which is the
  most-repeated rule in this palette. But a RULE only has to clear 3:1, and
  Clay does. So the colour goes into a 40px marker above each legend and the
  legend itself stays Concrete. That is the guide's own prescribed fix, and
  the same marker already sits above the eyebrow on the homepage hero.
*/
/*
  `space-y-5`, NOT `flex flex-col gap-5`, AND THE LEGEND IS WHY.

  A <legend> inside a FLEX fieldset is not laid out like a normal block. The
  spec pulls the rendered legend out of the flow and into the fieldset's border
  area, and the rest of the children become an anonymous flex container — so a
  `display: block` child inside the legend does not reliably stack above the
  legend's text. The Clay marker came out sitting beside the words rather than
  over them.

  Normal block flow puts the legend back in the ordinary layout, where a block
  child does what a block child does. `space-y-5` spaces the fields
  identically: margin on every child after the first, and the legend is first,
  so it takes none — the same result `gap` was giving.
*/
const SECTION = "space-y-5";

/*
  THE RULE RUNS THROUGH THE HEADING, not above the section.

  It was a `border-t` on the fieldset: a full-width line sitting 40px clear of
  the legend, which reads as a lid on the section rather than as part of its
  title. Beside the words and centred on them, the same hairline becomes the
  heading itself — the editorial convention for exactly this, and it separates
  the sections just as well because a ruled heading is unmistakably a new one
  starting.

  ALL THREE CARRY IT NOW. Only sections two and three had the border, since the
  first needs nothing separating it from the page header. As a heading
  treatment that inconsistency has nowhere to hide, and uniform is right: this
  is what a section title looks like on this form.

  CLAY OPENS, CONCRETE SPEAKS, THE RULE FINISHES. The accent is a 40px tick
  before the words, never the words — Clay is 3.5:1 on bone and fails AA at
  12px, while a rule only has to clear 3:1. `items-center` is what the whole
  row is for: it puts both hairlines on the text's optical centre instead of
  its top.
*/
const LEGEND =
  "flex w-full items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-concrete";


export function ApplyForm({ initialPlan = "solo" }: { initialPlan?: PlanId }) {
  const router = useRouter();
  // Team and Enterprise are a company's membership, so Company is required for them.
  const [plan, setPlan] = React.useState<PlanId>(initialPlan);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const text = (k: string) => form.get(k);
    const payload = {
      plan: text("plan"),
      firstName: text("firstName"),
      lastName: text("lastName"),
      email: text("email"),
      phone: text("phone"),
      city: text("city"),
      company: text("company"),
      website: text("website"),
      heardAbout: text("heardAbout"),
      heardAboutOther: text("heardAboutOther"),
      brag: text("brag"),
      building: text("building"),
      shipped: text("shipped"),
      links: text("links"),
      // A checkbox group: every ticked box arrives under the same name.
      describes: form.getAll("describes"),
      describesOther: text("describesOther"),
      whyGeekdom: text("whyGeekdom"),
      giveBack: text("giveBack"),
      excited: text("excited"),
      otherCommunities: text("otherCommunities"),
      anythingElse: text("anythingElse"),
      // An unchecked checkbox is absent from FormData entirely, so this has to
      // be a presence test rather than a value read.
      formerMember: form.get("formerMember") === "on",
      // Honeypot — see the hidden field at the end of the form.
      company_url: form.get("company_url"),
    };

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (body.fields) {
          setErrors(body.fields);
          // Move focus to the first thing that's wrong — otherwise a validation
          // error below the fold looks like a button that did nothing.
          const first = Object.keys(body.fields)[0];
          document.getElementById(first)?.focus();
        }
        setFormError(body.error ?? "Something went wrong. Try again.");
        setPending(false);
        return;
      }

      router.push("/apply/thanks");
    } catch {
      setFormError("Couldn't reach the server. Check your connection.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-12">
      {/* ── Your membership ────────────────────────────────────────── */}
      {/*
        THREE PLANS, ONE APPLICATION. Radio inputs laid out as three square
        cards — a choice of three reads better side by side than in a list,
        and the cards carry each plan's price and who it's for. The
        custom-dropdown rule is about <select>; these are real radios, with
        the keyboard behavior radios have.
      */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          <span className="shrink-0">Your membership</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => (
            <label
              key={p.id}
              className={cn(
                "relative flex cursor-pointer flex-col gap-1 border bg-bone-light p-4 transition-colors focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-2 focus-within:ring-offset-bone",
                plan === p.id ? "border-graphite" : "border-border hover:border-graphite/40",
              )}
            >
              <input
                type="radio"
                name="plan"
                value={p.id}
                checked={plan === p.id}
                onChange={() => setPlan(p.id)}
                className="sr-only"
              />
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium text-graphite">{p.name}</span>
                <span
                  aria-hidden="true"
                  className={cn("h-3.5 w-3.5 border", plan === p.id ? "border-graphite bg-graphite" : "border-graphite/40")}
                />
              </span>
              <span className="text-sm tabular-nums text-graphite">{planPrice(p)}</span>
              <span className="text-sm leading-snug text-muted-foreground">{p.blurb}</span>
            </label>
          ))}
        </div>
        {errors.plan && <p className="text-sm text-geekdom-red">{errors.plan}</p>}
      </fieldset>

      {/* ── Who you are ─────────────────────────────────────────────── */}
      {/*
        GEEKDOM'S QUESTIONS, WORD FOR WORD (lib/application-questions.ts) —
        the ones their Typeform asked, so new applications read the same as
        the ones imported from their Airtable. Company is ours: a Team or
        Enterprise membership is a company's.
      */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          <span className="shrink-0">Who you are</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName} required>
            <Input id="firstName" name="firstName" autoComplete="given-name" aria-invalid={Boolean(errors.firstName)} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName} required>
            <Input id="lastName" name="lastName" autoComplete="family-name" aria-invalid={Boolean(errors.lastName)} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email} required>
            <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone} required>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" htmlFor="city" error={errors.city} required>
            <Input id="city" name="city" autoComplete="address-level2" aria-invalid={Boolean(errors.city)} />
          </Field>
          <Field label={plan === "solo" ? "Company (optional)" : "Company"} htmlFor="company" error={errors.company} required={plan !== "solo"}>
            <Input id="company" name="company" autoComplete="organization" aria-invalid={Boolean(errors.company)} />
          </Field>
        </div>
        <Field label={Q.site} htmlFor="website" error={errors.website} required>
          <Input id="website" name="website" inputMode="url" placeholder="https://linkedin.com/in/…" aria-invalid={Boolean(errors.website)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={Q.heardAbout} htmlFor="heardAbout" error={errors.heardAbout} required>
            <Combobox id="heardAbout" name="heardAbout" options={HEARD_OPTIONS} invalid={Boolean(errors.heardAbout)} searchable={false} />
          </Field>
          <Field label="If other, how?" htmlFor="heardAboutOther" error={errors.heardAboutOther}>
            <Input id="heardAboutOther" name="heardAboutOther" />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm text-graphite">
          <input type="checkbox" name="formerMember" className="mt-0.5 h-4 w-4 rounded-none border-border accent-graphite focus-visible:ring-2 focus-visible:ring-clay" />
          <span>{Q.currentMember}</span>
        </label>
      </fieldset>

      {/* ── Your work ──────────────────────────────────────────────── */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          <span className="shrink-0">Your work</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>
        <Field label={Q.brag} htmlFor="brag" error={errors.brag} required>
          <Input id="brag" name="brag" aria-invalid={Boolean(errors.brag)} />
        </Field>
        <Field label={Q.building} htmlFor="building" error={errors.building} required>
          <Textarea id="building" name="building" aria-invalid={Boolean(errors.building)} />
        </Field>
        <Field label={Q.shipped} htmlFor="shipped" error={errors.shipped} required>
          <Textarea id="shipped" name="shipped" aria-invalid={Boolean(errors.shipped)} />
        </Field>
        <Field label={Q.links} htmlFor="links" error={errors.links}>
          <Textarea id="links" name="links" className="min-h-20" placeholder="A demo, a repo, a product, a talk" />
        </Field>
        {/* A real checkbox group — the question allows more than one answer. */}
        <fieldset aria-describedby={errors.describes ? "describes-error" : undefined}>
          <legend className="text-sm font-medium text-graphite">
            {Q.describes} <span className="text-geekdom-red">*</span>
          </legend>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {DESCRIBES.map((d, i) => (
              <label key={d} className="flex items-start gap-3 text-sm leading-snug text-graphite">
                <input
                  id={i === 0 ? "describes" : undefined}
                  type="checkbox"
                  name="describes"
                  value={d}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded-none border-border accent-graphite focus-visible:ring-2 focus-visible:ring-clay"
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
          {errors.describes && (
            <p id="describes-error" className="mt-2 text-sm text-geekdom-red">
              {errors.describes}
            </p>
          )}
        </fieldset>
        <Field label="If other, what describes you?" htmlFor="describesOther" error={errors.describesOther}>
          <Input id="describesOther" name="describesOther" />
        </Field>
      </fieldset>

      {/* ── Geekdom ────────────────────────────────────────────────── */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          <span className="shrink-0">Geekdom</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>
        <Field label={Q.whyGeekdom} htmlFor="whyGeekdom" error={errors.whyGeekdom} required>
          <Textarea id="whyGeekdom" name="whyGeekdom" aria-invalid={Boolean(errors.whyGeekdom)} />
        </Field>
        <Field label={Q.giveBack} htmlFor="giveBack" error={errors.giveBack} required>
          <Textarea id="giveBack" name="giveBack" aria-invalid={Boolean(errors.giveBack)} />
        </Field>
        <Field label={Q.excited} htmlFor="excited" error={errors.excited} required>
          <Textarea id="excited" name="excited" aria-invalid={Boolean(errors.excited)} />
        </Field>
        <Field label={Q.otherCommunities} htmlFor="otherCommunities" error={errors.otherCommunities}>
          <Input id="otherCommunities" name="otherCommunities" />
        </Field>
        <Field label={Q.anythingElse} htmlFor="anythingElse" error={errors.anythingElse}>
          <Textarea id="anythingElse" name="anythingElse" className="min-h-20" />
        </Field>
      </fieldset>

      {/*
        Honeypot. Hidden from people and from assistive tech (aria-hidden +
        tabIndex -1), but present in the DOM for a bot that fills every input
        it finds. `autoComplete="off"` keeps a browser from helpfully filling
        it in for a real person, which would look like spam on the server.

        Positioned off-screen rather than display:none — some bots skip fields
        that aren't rendered.
      */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor="company_url">Company URL</label>
        <input
          id="company_url"
          name="company_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {formError && (
        <p
          role="alert"
          className="border border-geekdom-red/30 bg-geekdom-red/5 px-4 py-3 text-sm text-geekdom-red-deep"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Sending…" : "Send application"}
        </Button>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A person on the Geekdom team reads every application. Nothing is
          charged now — if it&rsquo;s a fit, we&rsquo;ll email you to start
          your membership.
        </p>
      </div>
    </form>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { AUDIENCES, STAGES } from "@/lib/membership";

type Errors = Record<string, string>;

/*
  Both sets are closed enums, and their value IS their label — the server
  validates against the same constants, so nothing is translated between the
  two. Built once at module scope: the form re-renders on every validation
  pass, and remapping these each time is work for nothing.
*/
const AUDIENCE_OPTIONS = AUDIENCES.map((a) => ({ value: a, label: a }));
const STAGE_OPTIONS = STAGES.map((s) => ({ value: s, label: s }));

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


export function ApplyForm() {
  const router = useRouter();
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      company: form.get("company"),
      role: form.get("role"),
      website: form.get("website"),
      linkedin: form.get("linkedin"),
      audience: form.get("audience"),
      stage: form.get("stage"),
      building: form.get("building"),
      needs: form.get("needs"),
      referredBy: form.get("referredBy"),
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
      {/* ── You ────────────────────────────────────────────────────── */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          {/*
            "WHO YOU ARE", NOT "YOU".

            The legends run Who you are / Your company / Your work. "You" on
            its own was the thinnest of them — a pronoun where the others are
            phrases.

            "Who you are" is the question the fields actually ask, it is
            parallel with the section that follows it, and it echoes the line
            the rest of the site is built on: who's here is the whole product.
            It also sets up the field inside it, "What you are", as a genuine
            distinction rather than a near-repeat of its own heading.
          */}
          <span className="shrink-0">Who you are</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" htmlFor="name" error={errors.name} required>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              required
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email} required>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </Field>
          <Field
            label="What you are"
            htmlFor="audience"
            error={errors.audience}
            required
          >
            <Combobox
              id="audience"
              name="audience"
              options={AUDIENCE_OPTIONS}
              invalid={Boolean(errors.audience)}
              describedBy={errors.audience ? "audience-error" : undefined}
            />
          </Field>
        </div>
      </fieldset>

      {/* ── Your company ───────────────────────────────────────────── */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          <span className="shrink-0">Your company</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Company or project" htmlFor="company" error={errors.company}>
            <Input id="company" name="company" autoComplete="organization" />
          </Field>
          <Field label="Your role" htmlFor="role" error={errors.role}>
            <Input id="role" name="role" autoComplete="organization-title" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* No hint — the placeholder already shows the "https://" prefix,
              and the validation message says the same thing again if it's
              missing. Three copies of one instruction is two too many. */}
          <Field label="Website" htmlFor="website" error={errors.website}>
            <Input
              id="website"
              name="website"
              type="url"
              inputMode="url"
              placeholder="https://"
              aria-invalid={Boolean(errors.website)}
            />
          </Field>
          <Field label="LinkedIn" htmlFor="linkedin" error={errors.linkedin}>
            <Input
              id="linkedin"
              name="linkedin"
              type="url"
              inputMode="url"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={Boolean(errors.linkedin)}
            />
          </Field>
        </div>

        <Field label="Stage" htmlFor="stage" error={errors.stage} required>
          <Combobox
            id="stage"
            name="stage"
            options={STAGE_OPTIONS}
            invalid={Boolean(errors.stage)}
            describedBy={errors.stage ? "stage-error" : undefined}
          />
        </Field>
      </fieldset>

      {/* ── Your work ──────────────────────────────────────────────── */}
      <fieldset className={SECTION}>
        <legend className={LEGEND}>
          <span aria-hidden="true" className="h-px w-10 shrink-0 bg-clay" />
          {/*
            "Your work", not "The part we actually read" — that had a voice,
            and it implied the other sections go unread. Plain and parallel:
            Who you are / Your company / Your work.
          */}
          <span className="shrink-0">Your work</span>
          <span aria-hidden="true" className="h-px flex-1 bg-border" />
        </legend>

        <Field
          label="What are you building?"
          htmlFor="building"
          error={errors.building}
          hint="A couple of sentences is plenty."
          required
        >
          <Textarea
            id="building"
            name="building"
            required
            aria-invalid={Boolean(errors.building)}
            aria-describedby={
              errors.building ? "building-error" : "building-hint"
            }
          />
        </Field>

        <Field
          label="What do you need from the room?"
          htmlFor="needs"
          error={errors.needs}
          required
        >
          <Textarea
            id="needs"
            name="needs"
            required
            aria-invalid={Boolean(errors.needs)}
            aria-describedby={errors.needs ? "needs-error" : undefined}
          />
        </Field>

        <Field
          label="Anyone we should thank for sending you?"
          htmlFor="referredBy"
          error={errors.referredBy}
        >
          <Input id="referredBy" name="referredBy" />
        </Field>

        <label className="flex items-start gap-3 text-sm text-graphite">
          <input
            type="checkbox"
            name="formerMember"
            className="mt-0.5 h-4 w-4 rounded-none border-border text-clay focus-visible:ring-2 focus-visible:ring-clay"
          />
          {/*
            NO "BEFORE THE TRANSITION". The field is right and stays — the
            letter asks every current member to apply as part of the new
            onboarding, and `formerMember` is what tells the team which
            applications those are. It reaches the admin detail view, the CSV
            export and the team notification email.

            The WORDING dated itself. "The transition" is clear this month, to
            people living through it; to somebody applying next year it is a
            reference to an event nobody explained on this page. Dropping the
            clause asks exactly the same question and stops it expiring.
          */}
          <span>I was a Geekdom coworking member.</span>
        </label>
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
          charged now — if it&rsquo;s a fit, we&rsquo;ll email you an invitation
          to activate your membership.
        </p>
      </div>
    </form>
  );
}

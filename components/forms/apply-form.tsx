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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
      {/* ── You ────────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-5">
        <legend className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
          You
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
      <fieldset className="flex flex-col gap-5">
        <legend className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
          Your company
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

      {/* ── The part we actually read ──────────────────────────────── */}
      <fieldset className="flex flex-col gap-5">
        <legend className="font-mono text-xs uppercase tracking-[0.18em] text-rust">
          The part we actually read
        </legend>

        <Field
          label="What are you building?"
          htmlFor="building"
          error={errors.building}
          hint="A couple of sentences is plenty. Plain language beats a pitch."
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
          hint="Who would you want to be sitting next to, and why now?"
          required
        >
          <Textarea
            id="needs"
            name="needs"
            required
            aria-invalid={Boolean(errors.needs)}
            aria-describedby={errors.needs ? "needs-error" : "needs-hint"}
          />
        </Field>

        <Field
          label="Anyone we should thank for sending you?"
          htmlFor="referredBy"
          error={errors.referredBy}
        >
          <Input id="referredBy" name="referredBy" />
        </Field>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="formerMember"
            className="mt-0.5 h-4 w-4 rounded border-border text-rust focus-visible:ring-2 focus-visible:ring-rust"
          />
          <span>
            I was a Geekdom coworking member before the transition.
          </span>
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
          className="rounded-lg border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust-deep"
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

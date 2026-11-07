"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { ARROW, LINK_ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { EVENT_TYPES, HEADCOUNTS, INQUIRY_COPY, PARTNER_INTERESTS, type InquiryKind } from "@/lib/inquiries";

/*
  "PLAN AN EVENT" (/club) AND "CONTACT US" (/studio) — an arrow link that
  opens our own form in the slide-out (it replaced a Typeform mockup; the
  feel Geekdom approved was a form that opens over the page). Posts to
  /api/inquiries, which saves it for review in the admin and emails both
  sides. An arrow link, not a button: Geekdom Red is Apply's alone.

  The slide-out is a native <dialog> in the top layer, so it escapes the
  sections' reveal transforms; it carries data-lenis-prevent.
*/

const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

export function InquiryButton({ kind, label }: { kind: InquiryKind; label: string }) {
  const [open, setOpen] = React.useState(false);
  const copy = INQUIRY_COPY[kind];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("cursor-pointer", LINK_ARROW)}>
        {label}
        <ArrowRight aria-hidden="true" className={ARROW.internal} />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} eyebrow={kind === "event" ? "Host an event" : "Geekdom Studio"} title={copy.title}>
        <InquiryForm kind={kind} />
      </Drawer>
    </>
  );
}

function InquiryForm({ kind }: { kind: InquiryKind }) {
  const copy = INQUIRY_COPY[kind];
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setFormError(null);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, kind }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.fields) {
          setErrors(body.fields);
          document.getElementById(`${kind}-${Object.keys(body.fields)[0]}`)?.focus();
        }
        setFormError(body.error ?? "Something went wrong. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setFormError("Couldn't reach the server. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className={cn(MONO.label, "text-muted-foreground")}>Sent</p>
        <p className="text-lg leading-relaxed text-graphite">{copy.thanks}</p>
        <p className="text-sm text-muted-foreground">We&rsquo;ve emailed you a copy for your records.</p>
      </div>
    );
  }

  const id = (f: string) => `${kind}-${f}`;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <p className="leading-relaxed text-muted-foreground">{copy.intro}</p>
      <Field label="Company" htmlFor={id("company")} error={errors.company} required>
        <Input id={id("company")} name="company" autoComplete="organization" aria-invalid={Boolean(errors.company)} data-autofocus />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor={id("name")} error={errors.name} required>
          <Input id={id("name")} name="name" autoComplete="name" aria-invalid={Boolean(errors.name)} />
        </Field>
        <Field label="Work email" htmlFor={id("email")} error={errors.email} required>
          <Input id={id("email")} name="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} />
        </Field>
      </div>

      {kind === "event" ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Kind of event" htmlFor={id("eventType")} error={errors.eventType} required>
              <Combobox id={id("eventType")} name="eventType" options={opts(EVENT_TYPES)} invalid={Boolean(errors.eventType)} searchable={false} />
            </Field>
            <Field label="Roughly how many people" htmlFor={id("headcount")} error={errors.headcount} required>
              <Combobox id={id("headcount")} name="headcount" options={opts(HEADCOUNTS)} invalid={Boolean(errors.headcount)} searchable={false} />
            </Field>
          </div>
          <Field label="When are you thinking?" htmlFor={id("when")} error={errors.when} hint="A date, a few options, or just a month." required>
            <Input id={id("when")} name="when" placeholder="e.g. a Thursday in March" aria-invalid={Boolean(errors.when)} />
          </Field>
          <Field label="Anything else we should know?" htmlFor={id("details")} error={errors.details}>
            <Textarea id={id("details")} name="details" placeholder="Format, AV, food, anything" />
          </Field>
          <p className="text-sm text-muted-foreground">We host company events — offsites, planning days, workshops, client events — not private parties.</p>
        </>
      ) : (
        <>
          <Field label="How would you like to work with Studio companies?" htmlFor={id("interest")} error={errors.interest} required>
            <Combobox id={id("interest")} name="interest" options={opts(PARTNER_INTERESTS)} invalid={Boolean(errors.interest)} searchable={false} />
          </Field>
          <Field label="What should we know?" htmlFor={id("details")} error={errors.details}>
            <Textarea id={id("details")} name="details" placeholder="What you're hoping for" />
          </Field>
        </>
      )}

      {/* Honeypot — see components/forms/apply-form.tsx. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={id("company_url")}>Company URL</label>
        <input id={id("company_url")} name="company_url" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {formError && (
        <p role="alert" className="text-sm text-geekdom-red">
          {formError}
        </p>
      )}
      <Button type="submit" variant="ink" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}

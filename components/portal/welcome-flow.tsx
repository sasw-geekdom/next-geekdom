"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { HEADING, LINK_ARROW, MONO, ARROW } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { PhotoField } from "@/components/portal/photo-field";
import { CardSetup } from "@/components/portal/billing-live";
import { saveMyProfile, type ProfileInput } from "@/lib/portal/profile-actions";
import { finishWelcome } from "@/lib/portal/onboarding-actions";

/*
  THE WELCOME FLOW (app/portal/welcome) — two steps and a send-off, in the
  member portal's brand: Bone, square, Rubik, a mono step line.

  REQUIRED (Geekdom, November 2026): no skipping. The profile step needs a
  photo, a headline and "About you" (links are optional); the membership
  step needs billing in place — a member with nothing on file saves a card
  before Continue (saving charges nothing). proxy.ts keeps every other
  portal page behind it until it's finished.

  SIZED FOR A LAPTOP: a compact header, and the profile step in two
  columns from lg up, so a MacBook Air shows the whole step without
  scrolling to find the button.
*/

export type MembershipCase =
  | { kind: "team"; owner: string; company: string }
  | { kind: "complimentary"; label: string; until: string | null }
  | { kind: "paying"; price: string; card: string | null; next: string | null }
  | { kind: "card"; card: string; other: string[] }
  | { kind: "none"; price: string; stripe: boolean };

interface Props {
  /** Staff preview: nothing saves, and step 2 can show every membership case. */
  preview?: boolean;
  member: {
    name: string;
    photo: string | null;
    plan: string;
    profile: Omit<ProfileInput, "name">;
  };
  membership: MembershipCase;
}

const STEPS = ["Your profile", "Your membership", "You're in"];

/** Sample cases for the staff preview's "Preview as" switch. */
const PREVIEW_CASES: { label: string; m: MembershipCase }[] = [
  { label: "Complimentary", m: { kind: "complimentary", label: "DEVSA community", until: "November 19, 2027" } },
  { label: "Paying", m: { kind: "paying", price: "$100/month", card: "Visa •••• 4242", next: "December 19, 2026" } },
  { label: "Card on file", m: { kind: "card", card: "Visa •••• 4242", other: ["Community Membership"] } },
  { label: "Nothing on file", m: { kind: "none", price: "$100/month", stripe: true } },
  { label: "Teammate", m: { kind: "team", owner: "Ana Planner", company: "QA Clinic Group" } },
];

export function WelcomeFlow({ member, membership, preview = false }: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [leaving, setLeaving] = React.useState(false);

  async function done(to = "/portal") {
    setLeaving(true);
    await finishWelcome();
    router.push(to);
  }

  return (
    <div className="flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ol aria-label="Getting started" className="flex flex-wrap items-center gap-3">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-3" aria-current={i === step ? "step" : undefined}>
              {i > 0 && <span aria-hidden="true" className="h-px w-5 bg-border" />}
              <span className={cn(MONO.label, "inline-flex items-center gap-2", i === step ? "text-graphite" : "text-muted-foreground")}>
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-5 w-5 items-center justify-center border text-[10px]",
                    i < step ? "border-graphite bg-graphite text-bone" : i === step ? "border-graphite text-graphite" : "border-border",
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" strokeWidth={2.2} /> : i + 1}
                </span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && <ProfileStep member={member} preview={preview} onNext={() => setStep(1)} />}
      {step === 1 && (
        <MembershipStep membership={membership} plan={member.plan} preview={preview} onNext={() => setStep(2)} onBack={() => setStep(0)} />
      )}
      {step === 2 && (
        <section className="border border-border bg-bone-light p-6 sm:p-8">
          <h2 className={cn(HEADING.subhead, "text-graphite")}>You&rsquo;re in.</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
            The Club is the people on the third floor. Here&rsquo;s where to start finding them.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { href: "/portal/directory", label: "See who's in the directory" },
              { href: "/portal/rooms", label: "Book a conference room" },
              { href: "/portal/resources", label: "Wi-Fi, hours and the basics" },
            ].map((l) => (
              <li key={l.href}>
                <button type="button" onClick={() => done(l.href)} disabled={leaving} className={cn("text-left", LINK_ARROW)}>
                  {l.label}
                  <ArrowRight aria-hidden="true" className={ARROW.internal} />
                </button>
              </li>
            ))}
          </ul>
          <Button type="button" variant="ink" className="mt-8" onClick={() => done()} disabled={leaving}>
            {leaving ? "Opening…" : "Go to your dashboard"}
          </Button>
        </section>
      )}
    </div>
  );
}

function ProfileStep({ member, preview, onNext }: { member: Props["member"]; preview: boolean; onNext: () => void }) {
  const [p, setP] = React.useState(member.profile);
  const [photo, setPhoto] = React.useState<string | null>(member.photo);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const set = (k: keyof typeof p) => (v: string) => setP((x) => ({ ...x, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Required: a photo, a headline, a few words about you.
    const missing: Record<string, string> = {};
    if (!photo) missing.photo = "Add a photo — it's how members recognize you on the floor.";
    if (!p.headline.trim()) missing.headline = "Add a headline.";
    if (p.bio.trim().length < 20) missing.bio = "Add a few sentences about you.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    if (preview) return onNext(); // the staff preview saves nothing
    startTransition(async () => {
      const res = await saveMyProfile({ name: member.name, ...p });
      if (res.ok) onNext();
      else setError(res.message);
    });
  }

  return (
    <form onSubmit={save} noValidate className="border border-border bg-bone-light p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className={cn(HEADING.subhead, "text-graphite")}>How members will see you.</h2>
          <p className="mt-1.5 max-w-2xl leading-relaxed text-muted-foreground">
            The directory is how members find the person who knows the thing. A photo, a line about what you&rsquo;re building, and where to find your work.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="text-geekdom-red">*</span> Required
        </p>
      </div>

      {/* Two columns from lg up — the whole step fits a laptop screen. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-graphite">
              Photo <span className="text-geekdom-red">*</span>
            </p>
            <PhotoField photo={photo} name={member.name} onChange={setPhoto} local={preview} />
            {errors.photo && (
              <p role="alert" className="mt-2 text-sm text-geekdom-red">
                {errors.photo}
              </p>
            )}
          </div>
          <Field label="Headline" htmlFor="w-headline" hint="One line on what you're building or what you do." error={errors.headline} required>
            <Input id="w-headline" value={p.headline} maxLength={160} onChange={(e) => set("headline")(e.target.value)} placeholder="Building scheduling tools for clinics" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Website" htmlFor="w-site">
              <Input id="w-site" value={p.website} onChange={(e) => set("website")(e.target.value)} placeholder="yourcompany.com" />
            </Field>
            <Field label="LinkedIn" htmlFor="w-li">
              <Input id="w-li" value={p.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="linkedin.com/in/you" />
            </Field>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <Field label="About you" htmlFor="w-bio" hint="A few sentences — what you're working on, what you'd like help with." error={errors.bio} required>
            <Textarea id="w-bio" rows={7} value={p.bio} maxLength={2000} onChange={(e) => set("bio")(e.target.value)} />
          </Field>
          <p className="text-sm text-muted-foreground">
            {p.listed ? "You'll be listed in the member directory. You can hide yourself any time from your profile." : "You're hidden from the member directory."}
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-geekdom-red">
          {error}
        </p>
      )}
      <div className="mt-6 border-t border-border pt-5">
        <Button type="submit" variant="ink" disabled={pending}>
          {pending ? "Saving…" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}

function MembershipStep({
  membership,
  plan,
  preview,
  onNext,
  onBack,
}: {
  membership: MembershipCase;
  plan: string;
  preview: boolean;
  onNext: () => void;
  onBack: () => void;
}) {
  const [saved, setSaved] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [previewAs, setPreviewAs] = React.useState(0);
  const m = preview ? PREVIEW_CASES[previewAs].m : membership;
  const needsCard = !preview && m.kind === "none" && !saved;

  const body = (() => {
    switch (m.kind) {
      case "team":
        return <p className="leading-relaxed text-graphite">Your membership is part of {m.company || `${m.owner}'s team`}, and {m.owner} handles the billing. Nothing to set up.</p>;
      case "complimentary":
        return (
          <p className="leading-relaxed text-graphite">
            Your membership is complimentary{m.until ? ` until ${m.until}` : ""}, courtesy of {m.label}. Nothing to pay{m.until ? " until then — we'll remind you before it ends" : ""}.
          </p>
        );
      case "paying":
        return (
          <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="text-graphite">Club · {plan} · {m.price}</dd>
            {m.card && (
              <>
                <dt className="text-muted-foreground">Card</dt>
                <dd className="text-graphite">{m.card}</dd>
              </>
            )}
            {m.next && (
              <>
                <dt className="text-muted-foreground">Next payment</dt>
                <dd className="text-graphite">{m.next}</dd>
              </>
            )}
          </dl>
        );
      case "card":
        return (
          <div className="flex flex-col gap-3 leading-relaxed text-graphite">
            <p>We found your card on file from Geekdom: <span className="tabular-nums">{m.card}</span>.</p>
            {m.other.length > 0 ? (
              <p className="text-muted-foreground">
                You&rsquo;re paying for {m.other.join(", ")} through Geekdom&rsquo;s old system today. The Club team will move that over to your Club membership, timed so you&rsquo;re only ever charged once. Nothing for you to do.
              </p>
            ) : (
              <p className="text-muted-foreground">The Club team will start your Club billing on this card and let you know first. Nothing for you to do.</p>
            )}
          </div>
        );
      case "none":
        return saved ? (
          <p className="leading-relaxed text-graphite">{saved} The Club team will start your Club billing and let you know first.</p>
        ) : adding && preview ? (
          <p className="border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Members add their card here with Stripe&rsquo;s secure card form — the same one as Manage billing. (Off in the preview.)
          </p>
        ) : adding ? (
          <CardSetup onSaved={(msg) => setSaved(msg)} />
        ) : (
          <div className="flex flex-col gap-3">
            <p className="leading-relaxed text-graphite">
              Add the card for your Club membership{m.price ? ` (${m.price})` : ""} to finish setting up. Saving it doesn&rsquo;t charge anything — the Club team starts your billing and lets you know first.
            </p>
            {m.stripe ? (
              <Button type="button" variant="outline" className="self-start" onClick={() => setAdding(true)}>
                Add a card
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Billing isn&rsquo;t connected on this copy of the site yet, so this step can&rsquo;t be completed here.</p>
            )}
          </div>
        );
    }
  })();

  const title = { team: "You're on a team membership.", complimentary: "Your membership is on us.", paying: "You're all set.", card: "Your billing is in hand.", none: "Your membership." }[m.kind];

  return (
    <section className="flex flex-col gap-6 border border-border bg-bone-light p-6 sm:p-8">
      {preview && (
        <div className="flex flex-wrap items-center gap-3 border border-dashed border-border px-3 py-2.5">
          <span className={cn(MONO.label, "text-graphite")}>Preview as</span>
          <div role="radiogroup" aria-label="Preview a membership case" className="flex flex-wrap">
            {PREVIEW_CASES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                role="radio"
                aria-checked={previewAs === i}
                onClick={() => {
                  setPreviewAs(i);
                  setAdding(false);
                  setSaved(null);
                }}
                className={cn(
                  "-ml-px border px-2.5 py-1 text-xs first:ml-0",
                  previewAs === i ? "relative z-10 border-graphite bg-graphite text-bone" : "border-border text-graphite hover:border-graphite",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h2 className={cn(HEADING.subhead, "text-graphite")}>{title}</h2>
      </div>
      {body}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        {/* REQUIRED: with nothing on file, a saved card first (the staff preview can't save one, so it may go on). */}
        <Button type="button" variant="ink" onClick={onNext} disabled={needsCard}>
          Continue
        </Button>
        <button type="button" onClick={onBack} className="text-sm text-muted-foreground underline underline-offset-2 hover:text-graphite">
          Back
        </button>
        {needsCard && <span className="text-sm text-muted-foreground">Save a card to continue.</span>}
        {preview && m.kind === "none" && <span className="text-sm text-muted-foreground">Members can&rsquo;t continue until they save a card.</span>}
      </div>
    </section>
  );
}

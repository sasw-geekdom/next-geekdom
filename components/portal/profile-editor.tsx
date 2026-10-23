"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { FieldGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { AUDIENCES, type Audience } from "@/lib/membership";

/*
  A MEMBER EDITS HOW THEY APPEAR IN THE DIRECTORY — with their directory card
  previewed live beside the form, so "what will people see?" is answered
  while typing, not after saving.

  DESIGN PREVIEW: saving doesn't store anything yet. The real version
  (Phase 3) writes only these whitelisted fields, from the session's own
  member record — never an id from the form.
*/

export interface ProfileDraft {
  name: string;
  headline: string;
  role: string;
  company: string;
  audience: Audience;
  askMeAbout: string[];
  lookingFor: string;
  bio: string;
  website: string;
  linkedin: string;
  listed: boolean;
  /** A portrait URL — an object URL while previewing, a Blob URL once stored. */
  photo?: string;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function ProfileEditor({
  initial,
  formId,
  onSave,
}: {
  initial: ProfileDraft;
  /** Set when the form lives in a drawer whose footer holds the Save button. */
  formId?: string;
  onSave?: (draft: ProfileDraft) => void;
}) {
  const inDrawer = Boolean(formId);
  const [d, setD] = React.useState(initial);
  const [saved, setSaved] = React.useState(false);
  const [tag, setTag] = React.useState("");
  const set = <K extends keyof ProfileDraft>(k: K) => (v: ProfileDraft[K]) => {
    setSaved(false);
    setD((x) => ({ ...x, [k]: v }));
  };
  const addTag = () => {
    const t = tag.trim();
    if (t && !d.askMeAbout.includes(t) && d.askMeAbout.length < 6) set("askMeAbout")([...d.askMeAbout, t]);
    setTag("");
  };

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
        onSave?.(d);
      }}
      className={inDrawer ? "flex flex-col gap-10" : "grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]"}
    >
      <div className="flex flex-col gap-10">
        <FieldGroup title="About you">
          <PhotoField
            name={d.name}
            value={d.photo}
            onChange={(url) => set("photo")(url)}
          />
          <Field label="Name" htmlFor="p-name">
            <Input id="p-name" value={d.name} onChange={(e) => set("name")(e.target.value)} data-autofocus />
          </Field>
          <Field label="Headline" htmlFor="p-headline" hint="One line, in your words: what you're building or doing.">
            <Input id="p-headline" value={d.headline} maxLength={120} onChange={(e) => set("headline")(e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Role" htmlFor="p-role">
              <Input id="p-role" value={d.role} onChange={(e) => set("role")(e.target.value)} placeholder="Founder & CEO" />
            </Field>
            <Field label="Company" htmlFor="p-company">
              <Input id="p-company" value={d.company} onChange={(e) => set("company")(e.target.value)} />
            </Field>
          </div>
          <Field label="You're mostly a…" htmlFor="p-audience" hint="Members filter the directory by this.">
            <Combobox
              id="p-audience"
              name="audience"
              options={AUDIENCES.map((a) => ({ value: a, label: a }))}
              value={d.audience}
              onChange={(v) => set("audience")(v as Audience)}
            />
          </Field>
          <Field label="About" htmlFor="p-bio" hint="A few sentences. Optional.">
            <Textarea id="p-bio" value={d.bio} onChange={(e) => set("bio")(e.target.value)} className="min-h-28" />
          </Field>
        </FieldGroup>

        <FieldGroup title="How you can help, and what you need">
          <div>
            <label htmlFor="p-ask" className="mb-2 block text-sm font-medium text-graphite">
              Ask me about
            </label>
            <div className="flex min-h-11 flex-wrap items-center gap-1.5 border border-border bg-bone-light px-2 py-1.5 focus-within:ring-2 focus-within:ring-clay focus-within:ring-offset-1">
              {d.askMeAbout.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 border border-border bg-bone px-2 py-0.5 text-sm text-graphite">
                  {t}
                  <button type="button" aria-label={`Remove ${t}`} onClick={() => set("askMeAbout")(d.askMeAbout.filter((x) => x !== t))} className="text-muted-foreground hover:text-graphite">
                    <X className="h-3 w-3" strokeWidth={2} />
                  </button>
                </span>
              ))}
              <input
                id="p-ask"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder={d.askMeAbout.length ? "" : "Type a topic and press Enter"}
                className="min-w-40 flex-1 bg-transparent px-1 py-1 text-base text-graphite outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Up to six. What you&rsquo;re happy to be asked about over coffee.</p>
          </div>
          <Field label="Looking for" htmlFor="p-looking" hint="What would help you most right now? A hire, a customer, an intro. Optional.">
            <Input id="p-looking" value={d.lookingFor} onChange={(e) => set("lookingFor")(e.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="LinkedIn" htmlFor="p-linkedin">
              <Input id="p-linkedin" type="url" value={d.linkedin} onChange={(e) => set("linkedin")(e.target.value)} placeholder="https://linkedin.com/in/…" />
            </Field>
            <Field label="Website" htmlFor="p-website">
              <Input id="p-website" type="url" value={d.website} onChange={(e) => set("website")(e.target.value)} placeholder="https://" />
            </Field>
          </div>
        </FieldGroup>

        <FieldGroup title="Privacy">
          <Switch checked={d.listed} onChange={set("listed")} label="Show me in the member directory" />
          <p className="-mt-2 text-sm leading-relaxed text-muted-foreground">
            Only other members can see the directory. Your email and billing are never shown.
          </p>
        </FieldGroup>

        {!inDrawer && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="ink">Save profile</Button>
          {saved && (
            <p role="status" className="text-sm text-muted-foreground">
              Design preview — profile changes aren&rsquo;t stored yet.
            </p>
          )}
        </div>
        )}
      </div>

      {/* Live preview of the directory card — beside the form on a page; in
          the drawer the profile card on the page behind is the preview. */}
      {!inDrawer && (
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className={cn(MONO.label, "text-muted-foreground")}>How members see you</p>
        <div className={cn("mt-3 flex flex-col border border-border bg-bone-light p-6", !d.listed && "opacity-50")}>
          <span className="flex items-center gap-4">
            <span aria-hidden="true" className={cn(MONO.label, "flex h-12 w-12 shrink-0 items-center justify-center bg-graphite text-bone")}>
              {initials(d.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium text-graphite">{d.name || "Your name"}</span>
              <span className="block truncate text-sm text-muted-foreground">
                {d.role || "Role"}
                {d.company ? ` · ${d.company}` : ""}
              </span>
            </span>
          </span>
          <span className="mt-4 block leading-relaxed text-graphite">{d.headline || "Your headline"}</span>
          {d.askMeAbout.length > 0 && (
            <span className="mt-5 flex flex-wrap gap-1.5">
              {d.askMeAbout.slice(0, 3).map((t) => (
                <span key={t} className="border border-border bg-bone px-2 py-0.5 text-xs text-graphite">{t}</span>
              ))}
            </span>
          )}
        </div>
        {!d.listed && (
          <p className="mt-2 text-sm text-muted-foreground">Hidden — you won&rsquo;t appear in the directory.</p>
        )}
      </div>
      )}
    </form>
  );
}

/*
  THE PROFILE PHOTO. Square, like every frame on the site — no circle crop.
  Shown at 96px in the directory pane and 44px in the list, so a phone photo
  is plenty; it's cropped to fill with `object-cover`.

  DESIGN PREVIEW: the chosen file is shown from an object URL and goes
  nowhere. When profiles are stored (Phase 3) it uploads to the Blob store
  through a server action that checks the session, the type (JPEG, PNG,
  WebP) and the size — the same shape as the portfolio logo upload.
*/
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

function PhotoField({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const input = React.useRef<HTMLInputElement>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  function choose(file: File | undefined) {
    setProblem(null);
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProblem("Use a JPEG, PNG or WebP photo.");
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setProblem("That photo is over 5 MB. Try a smaller one.");
      return;
    }
    onChange(URL.createObjectURL(file));
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-graphite">Photo</p>
      <div className="flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-20 w-20 shrink-0 border border-border bg-bone object-cover" />
        ) : (
          <span aria-hidden="true" className={cn(MONO.label, "flex h-20 w-20 shrink-0 items-center justify-center bg-graphite text-bone")}>
            {initials(name)}
          </span>
        )}
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
              {value ? "Replace photo" : "Upload photo"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">A clear photo of your face. JPEG, PNG or WebP, up to 5 MB.</p>
        </div>
      </div>
      {problem && (
        <p role="alert" className="mt-2 text-sm text-geekdom-red">
          {problem}
        </p>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Drawer } from "@/components/ui/drawer";
import { FieldGroup } from "@/components/admin/field-group";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { LOGO_HEIGHTS } from "@/lib/content/portfolio-options";
import {
  deleteCompany,
  reorderPortfolio,
  uploadLogo,
  saveCompany,
  seedPortfolioFromSite,
} from "@/lib/content/portfolio-actions";
import type { ActionResult } from "@/lib/content/types";

/*
  "BUILT AT GEEKDOM", EDITED.

  The wall's companies as a grid of the same cells the site renders, and one
  editor that opens above it. The editor previews the cell live — same mask,
  same Graphite fill — because whether a logo works on the wall is a visual
  question: a logo on a solid background renders as a solid rectangle.

  Logos are UPLOADED (to Vercel Blob, checked for a transparent background);
  a company with no logo renders its name, as on the site.

  DRAG TO REORDER, with the native HTML drag-and-drop API (`draggable`, the
  drag events, `dataTransfer`) — no library. The cell you drop on is where
  the dragged one lands; the grid updates at once and the order saves on
  drop. Native drag-and-drop has no keyboard path at all, so each cell also
  has "Move earlier" / "Move later" buttons that do the same thing.
*/

export interface AdminCompanyRow {
  id: string;
  name: string;
  href?: string;
  link?: "site" | "story" | "video";
  stage: string;
  founded: number;
  studio: boolean;
  description?: string;
  logo?: string;
  logoHeight?: string;
  logoMark?: "wordmark" | "symbol";
  hidden: boolean;
}

interface Draft {
  id?: string;
  name: string;
  stage: string;
  founded: string;
  href: string;
  link: string;
  description: string;
  logo: string;
  logoHeight: string;
  logoMark: string;
  studio: boolean;
  hidden: boolean;
}

const LINK_KINDS = [
  { value: "", label: "No label" },
  { value: "site", label: "Company site" },
  { value: "story", label: "A story about it" },
  { value: "video", label: "A video" },
];

const MARKS = [
  { value: "", label: "Wordmark (logo alone)" },
  { value: "symbol", label: "Symbol (logo + name)" },
];

function blank(): Draft {
  return {
    name: "",
    stage: "",
    founded: String(new Date().getFullYear()),
    href: "",
    link: "site",
    description: "",
    logo: "",
    logoHeight: "",
    logoMark: "",
    studio: false,
    hidden: false,
  };
}

function fromRow(c: AdminCompanyRow): Draft {
  return {
    id: c.id,
    name: c.name,
    stage: c.stage,
    founded: String(c.founded),
    href: c.href ?? "",
    link: c.link ?? "",
    description: c.description ?? "",
    logo: c.logo ?? "",
    logoHeight: c.logoHeight ?? "",
    logoMark: c.logoMark ?? "",
    studio: c.studio,
    hidden: c.hidden,
  };
}

export function PortfolioManager({ companies }: { companies: AdminCompanyRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [draft, setDraft] = React.useState<Draft | null>(null);
  /*
    `drawerOpen` is separate from `draft` so the form stays rendered while the
    panel slides OUT — clearing the draft on close would blank the panel
    mid-animation.
  */
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const close = React.useCallback(() => setDrawerOpen(false), []);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  /*
    The grid's order, owned here so a drop shows immediately rather than
    after the round trip. Re-synced from the server's list whenever it
    changes — adjusted during render, not in an effect (see site-navbar.tsx).
  */
  const [order, setOrder] = React.useState(companies);
  const [synced, setSynced] = React.useState(companies);
  if (synced !== companies) {
    setSynced(companies);
    setOrder(companies);
  }
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  function commitOrder(next: AdminCompanyRow[]) {
    const before = order;
    setOrder(next);
    setNotice(null);
    startTransition(async () => {
      const res = await reorderPortfolio(next.map((c) => c.id));
      if (res.ok) {
        setNotice({ tone: "ok", text: "Order saved. The wall has the change." });
        router.refresh();
      } else {
        setOrder(before);
        setNotice({ tone: "error", text: res.error ?? "Couldn't save the order." });
      }
    });
  }

  /** Move `id` to `to`'s place (dropping on a cell puts the dragged one there). */
  function moveTo(id: string, to: number) {
    const from = order.findIndex((c) => c.id === id);
    if (from < 0 || to < 0 || to >= order.length || from === to) return;
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commitOrder(next);
  }

  const canDrag = !drawerOpen && !pending;

  const thisYear = new Date().getFullYear();
  const YEARS = Array.from({ length: thisYear - 2011 + 1 }, (_, i) => {
    const y = String(thisYear - i);
    return { value: y, label: y };
  });

  function open(d: Draft) {
    setDraft(d);
    setErrors({});
    setNotice(null);
    setDrawerOpen(true);
  }

  function report(res: ActionResult, okText: string) {
    if (res.ok) {
      setNotice({ tone: "ok", text: okText });
      setDrawerOpen(false);
      setErrors({});
      router.refresh();
    } else {
      setErrors(res.fieldErrors ?? {});
      if (res.error) setNotice({ tone: "error", text: res.error });
    }
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    startTransition(async () => {
      const res = await saveCompany({
        id: draft.id,
        name: draft.name,
        stage: draft.stage,
        founded: draft.founded,
        href: draft.href,
        link: (draft.link || undefined) as "site" | "story" | "video" | undefined,
        description: draft.description,
        logo: draft.logo,
        logoHeight: draft.logoHeight,
        logoMark: (draft.logoMark || undefined) as "symbol" | undefined,
        studio: draft.studio,
        hidden: draft.hidden,
      });
      report(res, draft.id ? "Saved. The wall has the change." : "Added to the wall.");
    });
  }

  function onDelete(c: AdminCompanyRow) {
    if (
      !window.confirm(
        `Delete ${c.name}? To take it off the site but keep the record, edit it and turn on “Hidden” instead.`,
      )
    )
      return;
    startTransition(async () => report(await deleteCompany(c.id), "Deleted."));
  }

  function onSeed() {
    startTransition(async () => {
      const res = await seedPortfolioFromSite();
      report(res, res.ok ? `Copied ${res.count} companies from the current site.` : "");
    });
  }

  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ink" onClick={() => open(blank())} disabled={pending}>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          Add a company
        </Button>
        {companies.length === 0 && (
          <Button variant="outline" onClick={onSeed} disabled={pending}>
            Copy from the current site
          </Button>
        )}
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn("text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}
          >
            {notice.text}
          </p>
        )}
      </div>

      <Drawer
        open={drawerOpen}
        onClose={close}
        eyebrow={draft?.id ? "Edit company" : "New company"}
        title={draft?.id ? draft.name || "Company" : "Add a company"}
        footer={
          <>
            <Button type="submit" form="company-form" variant="ink" disabled={pending}>
              {pending ? "Saving…" : draft?.id ? "Save changes" : "Add to the wall"}
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        {draft && (
          <form id="company-form" onSubmit={onSave} noValidate className="flex flex-col gap-10">
            <FieldGroup title="Company">
              <Field label="Name" htmlFor="co-name" error={errors.name} required>
                <Input
                  id="co-name"
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  data-autofocus
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Stage" htmlFor="co-stage" error={errors.stage} required hint="“Seed”, “Series A”, “Acquired 2022”.">
                  <Input
                    id="co-stage"
                    value={draft.stage}
                    onChange={(e) => set("stage")(e.target.value)}
                    aria-invalid={Boolean(errors.stage)}
                  />
                </Field>
                <Field label="Started" htmlFor="co-founded" error={errors.founded} required hint="The year it started at Geekdom.">
                  <Combobox
                    id="co-founded"
                    name="founded"
                    options={YEARS}
                    value={draft.founded}
                    onChange={set("founded")}
                    placeholder="Year"
                    invalid={Boolean(errors.founded)}
                  />
                </Field>
              </div>
              <Field label="Link" htmlFor="co-href" error={errors.href} hint="Leave blank if there's nowhere good to send people.">
                <Input
                  id="co-href"
                  type="url"
                  inputMode="url"
                  value={draft.href}
                  onChange={(e) => set("href")(e.target.value)}
                  aria-invalid={Boolean(errors.href)}
                  placeholder="https://"
                />
              </Field>
              <Field label="The link goes to" htmlFor="co-link" error={errors.link}>
                <Combobox
                  id="co-link"
                  name="link"
                  options={LINK_KINDS}
                  value={draft.link}
                  onChange={set("link")}
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="Logo">
              <div>
                <div className="border-l border-t border-border bg-bone-light">
                  <Cell
                    company={{
                      name: draft.name || "Company",
                      stage: draft.stage || "Stage",
                      founded: Number(draft.founded),
                      logo: draft.logo || undefined,
                      logoHeight: draft.logoHeight || undefined,
                      logoMark: (draft.logoMark || undefined) as "symbol" | undefined,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  As it renders on the wall. No logo, and the company shows its name.
                </p>
              </div>
              <LogoField
                value={draft.logo}
                companyName={draft.name}
                onChange={set("logo")}
                error={errors.logo}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Size" htmlFor="co-height" error={errors.logoHeight}>
                  <Combobox
                    id="co-height"
                    name="logoHeight"
                    options={LOGO_HEIGHTS}
                    value={draft.logoHeight}
                    onChange={set("logoHeight")}
                  />
                </Field>
                <Field label="Type" htmlFor="co-mark" error={errors.logoMark}>
                  <Combobox
                    id="co-mark"
                    name="logoMark"
                    options={MARKS}
                    value={draft.logoMark}
                    onChange={set("logoMark")}
                  />
                </Field>
              </div>
            </FieldGroup>

            <FieldGroup title="About">
              <Field
                label="One line on what it does"
                htmlFor="co-desc"
                error={errors.description}
                hint="Sourced from the company's own site or press, never guessed. Used in /llms.txt, not on the wall."
              >
                <Textarea
                  id="co-desc"
                  value={draft.description}
                  onChange={(e) => set("description")(e.target.value)}
                  className="min-h-24"
                />
              </Field>
            </FieldGroup>

            <FieldGroup title="On the site">
              <Switch checked={draft.studio} onChange={set("studio")} label="Backed by the Studio — also on /studio" />
              <Switch checked={draft.hidden} onChange={set("hidden")} label="Hidden from the site" />
            </FieldGroup>
          </form>
        )}
      </Drawer>

      {order.length === 0 ? (
        <p className="border border-dashed border-border bg-bone-light px-6 py-10 text-sm text-muted-foreground">
          No companies yet. The site is showing its built-in wall until you add one or copy it here.
        </p>
      ) : (
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
            Drag a company to change its place on the wall. The order saves when you drop.
          </p>
        <ul className="grid grid-cols-2 border-l border-t border-border sm:grid-cols-3 xl:grid-cols-4">
          {order.map((c, i) => (
            <li
              key={c.id}
              draggable={canDrag}
              aria-roledescription="draggable company"
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                // Firefox won't start a drag without data set.
                e.dataTransfer.setData("text/plain", c.id);
                setDragId(c.id);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault(); // marks this cell as a drop target
                e.dataTransfer.dropEffect = "move";
                if (overId !== c.id) setOverId(c.id);
              }}
              onDragLeave={() => setOverId((o) => (o === c.id ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const id = dragId ?? e.dataTransfer.getData("text/plain");
                setDragId(null);
                setOverId(null);
                if (id) moveTo(id, i);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "relative transition-opacity",
                canDrag && "cursor-grab active:cursor-grabbing",
                c.hidden && "opacity-50",
                dragId === c.id && "opacity-30",
                // The drop target: a Clay rule inside the cell, so the grid's
                // hairlines don't shift while you drag.
                overId === c.id && dragId !== c.id && "outline-2 -outline-offset-2 outline-clay",
              )}
            >
              <Cell company={c} />
              <div className="absolute bottom-1 left-1 flex">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveTo(c.id, i - 1)}
                  disabled={!canDrag || i === 0}
                  aria-label={`Move ${c.name} earlier`}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveTo(c.id, i + 1)}
                  disabled={!canDrag || i === order.length - 1}
                  aria-label={`Move ${c.name} later`}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
                </Button>
              </div>
              <div className="absolute right-1 top-1 flex">
                <Button variant="ghost" size="icon" onClick={() => open(fromRow(c))} disabled={pending} aria-label={`Edit ${c.name}`}>
                  <Pencil className="h-4 w-4" strokeWidth={1.7} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(c)} disabled={pending} aria-label={`Delete ${c.name}`}>
                  <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                </Button>
              </div>
              <div className="absolute left-2 top-2 flex gap-1">
                {c.studio && <Tag>Studio</Tag>}
                {c.hidden && <Tag>Hidden</Tag>}
              </div>
            </li>
          ))}
        </ul>
        </div>
      )}
    </div>
  );
}

/*
  THE LOGO: upload, replace, remove. No list of files on hand — those belong
  to companies already on the wall. A chosen file uploads at once (checked on
  the server: transparent background, under 512 KB, a clean SVG) so the
  preview above shows the real thing; the company only points at it when the
  form is saved. Click to choose, or drop a file on the box.
*/
function LogoField({
  value,
  companyName,
  onChange,
  error,
}: {
  value: string;
  companyName: string;
  onChange: (url: string) => void;
  error?: string;
}) {
  const input = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [over, setOver] = React.useState(false);

  async function upload(file: File | undefined) {
    if (!file) return;
    setProblem(null);
    setUploading(true);
    const form = new FormData();
    form.set("file", file);
    form.set("name", companyName);
    const res = await uploadLogo(form).catch(() => ({
      ok: false as const,
      error: "Upload failed. Try again.",
    }));
    setUploading(false);
    if (res.ok) onChange(res.url);
    else setProblem(res.error);
    if (input.current) input.current.value = "";
  }

  const label = value
    ? value.startsWith("/portfolio/")
      ? value.replace("/portfolio/", "")
      : decodeURIComponent(value.split("/").pop() ?? "Uploaded logo")
    : null;
  const shown = problem ?? error;

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-graphite">Logo file</p>
      <input
        ref={input}
        type="file"
        accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bone-light px-4 py-3">
          <span className="min-w-0 truncate text-sm text-graphite">{label}</span>
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
              {uploading ? "Uploading…" : "Replace"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={() => onChange("")}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            upload(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 border border-dashed px-4 py-6 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone",
            over ? "border-clay bg-bone-light" : "border-border hover:border-graphite",
          )}
        >
          <span className="text-sm font-medium text-graphite">
            {uploading ? "Uploading…" : "Upload a logo"}
          </span>
          <span className="text-xs text-muted-foreground">
            Click or drop a file. SVG, PNG or WebP with a transparent background, up to 512 KB.
          </span>
        </button>
      )}
      {shown && (
        <p role="alert" className="mt-2 text-sm text-geekdom-red">
          {shown}
        </p>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className={cn(MONO.micro, "border border-border bg-bone-light px-1.5 py-0.5 text-graphite")}>
      {children}
    </span>
  );
}

/** One wall cell — the same mask treatment as components/site/portfolio-wall.tsx. */
function Cell({
  company,
}: {
  company: Pick<AdminCompanyRow, "name" | "stage" | "founded" | "logo" | "logoHeight" | "logoMark">;
}) {
  const isSymbol = company.logoMark === "symbol";
  const name = <span className="text-lg font-medium leading-snug text-graphite">{company.name}</span>;
  const painted = company.logo ? (
    <span
      aria-hidden="true"
      className={cn(
        "block bg-graphite",
        company.logoHeight || "h-6 sm:h-7",
        isSymbol ? "aspect-square shrink-0" : "w-full max-w-40",
      )}
      style={{
        WebkitMaskImage: `url(${company.logo})`,
        maskImage: `url(${company.logo})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  ) : null;
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-3 border-b border-r border-border px-4 py-7 text-center">
      <span className="flex h-10 w-full items-center justify-center">
        {!painted ? name : isSymbol ? <span className="flex items-center gap-2.5">{painted}{name}</span> : painted}
      </span>
      <span className={cn(MONO.label, "text-muted-foreground")}>
        {company.stage} · {company.founded}
      </span>
    </div>
  );
}

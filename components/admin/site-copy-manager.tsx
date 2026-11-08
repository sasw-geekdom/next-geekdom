"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { Status, Tabs } from "@/components/admin/admin-ui";
import { Drawer } from "@/components/ui/drawer";
import { Button, buttonClass } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { COPY_FIELDS, COPY_PAGES, type CopyField, type CopyPageId } from "@/lib/content/site-copy-fields";
import { resetCopy, saveCopy } from "@/lib/content/site-copy-actions";

/*
  THE SITE COPY SCREEN — every editable word on the public pages, page by
  page and section by section. A row shows the text as it reads on the
  site, marked "Edited" when it isn't the original; clicking it opens the
  slide-out to change it, with a character counter sized to the spot and
  "Reset to original". Saves are live within a minute and in the activity
  log. What ISN'T editable here is said at the foot, so nobody hunts for it.
*/
export function SiteCopyManager({ page, edits }: { page: CopyPageId; edits: Record<string, string> }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [field, setField] = React.useState<CopyField | null>(null);
  const [value, setValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  const current = (f: CopyField) => edits[f.key] ?? f.default;
  const meta = COPY_PAGES.find((p) => p.id === page)!;
  const fields = COPY_FIELDS.filter((f) => f.page === page);
  const sections = [...new Set(fields.map((f) => f.section))];
  const editedOn = (id: CopyPageId) => COPY_FIELDS.filter((f) => f.page === id && edits[f.key] !== undefined).length;

  function edit(f: CopyField) {
    setField(f);
    setValue(current(f));
    setError(null);
    setNotice(null);
    setOpen(true);
  }

  function run(fn: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setOpen(false);
        setNotice(res.message);
        router.refresh();
      } else setError(res.message);
    });
  }

  const changed = field ? value.trim() !== current(field).trim() : false;
  const isEdited = field ? edits[field.key] !== undefined : false;
  const length = value.trim().length;

  return (
    <>
      <PageHeader
        title="Site copy"
        description="The words on the public pages. Changes are live within a minute."
        actions={
          <a href={meta.path} target="_blank" rel="noreferrer noopener" className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
            View {meta.label}
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </a>
        }
      />
      <AdminSection>
        <Tabs
          label="Page"
          items={COPY_PAGES.map((p) => ({
            href: `/portal/admin/copy?page=${p.id}`,
            label: p.label,
            count: editedOn(p.id) || undefined,
            active: p.id === page,
          }))}
        />
        <p className="mt-3 text-[13px] text-muted-foreground">The number on a tab is how many of its fields have been edited.</p>

        {notice && (
          <p role="status" className="mt-5 border border-dashed border-border px-4 py-3 text-sm text-graphite">
            {notice}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6">
          {sections.map((section) => (
            <section key={section} className="border border-border bg-bone-light">
              <h2 className="border-b border-border px-4 py-2.5 text-sm font-medium text-graphite">{section}</h2>
              <ul>
                {fields
                  .filter((f) => f.section === section)
                  .map((f) => (
                    <li key={f.key} className="relative grid gap-1 border-t border-border px-4 py-3 first:border-t-0 hover:bg-bone sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                      <button
                        type="button"
                        onClick={() => edit(f)}
                        className="text-left text-[13px] text-muted-foreground after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-clay"
                      >
                        {f.label}
                      </button>
                      <p className={cn("min-w-0 text-sm text-graphite", f.kind === "list" ? "line-clamp-3 whitespace-pre-line" : "line-clamp-2")}>
                        {f.kind === "list" ? current(f).split("\n").join(" · ") : current(f)}
                      </p>
                      <span className="sm:pt-0.5">{edits[f.key] !== undefined && <Status kind="progress" className="text-[13px]">Edited</Status>}</span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        {/* What isn't here, and why — so nobody hunts for it. */}
        <div className="mt-8 border border-dashed border-border px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          <p className="font-medium text-graphite">Not edited here</p>
          <p className="mt-1">
            Page layout, photos and section order · prices and plans (they follow billing) · email addresses and the street address · page titles and search
            descriptions · the members letter, terms and privacy. Events, the portfolio wall, Field Notes and member resources have their own screens.
          </p>
        </div>
      </AdminSection>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={field?.label ?? "Edit"}
        description={field ? `${meta.label} · ${field.section}` : undefined}
        footer={
          <>
            <Button type="submit" form="copy-form" variant="ink" disabled={pending || !changed || !length}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
          </>
        }
      >
        {field && (
          <form
            id="copy-form"
            noValidate
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => saveCopy(field.key, value));
            }}
          >
            <Field label={field.label} htmlFor="copy-value" error={error ?? undefined}>
              {field.kind === "line" ? (
                <Input id="copy-value" value={value} onChange={(e) => setValue(e.target.value)} data-autofocus />
              ) : (
                <Textarea id="copy-value" rows={field.kind === "list" ? 8 : 6} value={value} onChange={(e) => setValue(e.target.value)} data-autofocus />
              )}
            </Field>
            <p className="-mt-3 flex justify-between gap-4 text-[13px] text-muted-foreground">
              <span>{field.hint ?? (field.kind === "text" ? "Paragraph breaks are kept." : "")}</span>
              <span className={cn("shrink-0 tabular-nums", length > field.max && "text-geekdom-red")}>
                {length} / {field.max}
              </span>
            </p>

            {isEdited && (
              <div className="border border-dashed border-border px-4 py-3 text-sm">
                <p className="text-[13px] text-muted-foreground">The original text</p>
                <p className="mt-1 whitespace-pre-line text-graphite">{field.default}</p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => resetCopy(field.key))}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2"
                >
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Reset to original
                </button>
              </div>
            )}
            <a href={meta.path} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-graphite">
              See it on {meta.label}
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
            </a>
          </form>
        )}
      </Drawer>
    </>
  );
}

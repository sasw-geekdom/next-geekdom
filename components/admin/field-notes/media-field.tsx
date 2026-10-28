"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { processCard, processPhoto } from "@/lib/field-notes/actions";
import { LIMITS } from "@/lib/field-notes/schemas";
import { cn } from "@/lib/utils";
import type { NoteImage } from "@/lib/field-notes/types";

/*
  UPLOADS FOR FIELD NOTES — straight from the browser to Blob.

  The file never passes through a server action (Vercel caps those at
  4.5MB): `upload()` asks /api/admin/field-notes/upload for a token, which
  is where the staff check, the path and the size limits live, then sends
  the bytes to Blob directly. A photo then goes through `processPhoto` on
  the server, which grades it to the brand and writes the WebPs.
*/

const clean = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "file";

const ext = (name: string) => (name.match(/\.([a-z0-9]{2,5})$/i)?.[1] ?? "").toLowerCase();

async function toBlob(
  noteId: string,
  kind: "originals" | "video",
  file: File,
  onProgress: (pct: number) => void,
): Promise<string> {
  const blob = await upload(`field-notes/${noteId}/${kind}/${clean(file.name)}.${ext(file.name) || "bin"}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/field-notes/upload",
    multipart: file.size > 8 * 1024 * 1024,
    onUploadProgress: ({ percentage }) => onProgress(Math.round(percentage)),
  });
  return blob.url;
}

function DropZone({
  label,
  hint,
  accept,
  busy,
  onFile,
}: {
  label: string;
  hint: string;
  accept: string;
  busy: string | null;
  onFile: (f: File) => void;
}) {
  const input = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={Boolean(busy)}
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
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-1 border border-dashed px-4 py-6 text-center transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone",
          over ? "border-clay bg-bone-light" : "border-border hover:border-graphite",
        )}
      >
        <span className="text-sm font-medium text-graphite">{busy ?? label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </button>
    </>
  );
}

/** A photograph: upload, graded on the server; alt text required; B&W. */
export function PhotoField({
  noteId,
  value,
  onChange,
  label = "Photo",
  idPrefix,
}: {
  noteId: string;
  value?: NoteImage;
  onChange: (img: NoteImage | undefined) => void;
  label?: string;
  idPrefix: string;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  async function run(original: string, bw: boolean, alt: string) {
    setBusy("Applying the brand grade…");
    const res = await processPhoto(noteId, original, bw).catch(() => ({ ok: false as const, error: "That didn't work. Try again." }));
    setBusy(null);
    if (res.ok) onChange({ ...res.value, alt });
    else setProblem(res.error);
  }

  async function onFile(file: File) {
    setProblem(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setProblem("Upload a JPEG, PNG or WebP photo.");
      return;
    }
    try {
      setBusy("Uploading… 0%");
      const original = await toBlob(noteId, "originals", file, (p) => setBusy(`Uploading… ${p}%`));
      await run(original, value?.bw ?? false, value?.alt ?? "");
    } catch (e) {
      setBusy(null);
      setProblem(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-graphite">{label}</p>
      {value ? (
        <div className="flex gap-3 border border-border bg-bone-light p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.srcSm} alt="" className="h-20 w-20 shrink-0 object-cover" />
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
            <Switch
              checked={value.bw}
              onChange={(bw) => run(value.original, bw, value.alt)}
              disabled={Boolean(busy)}
              label="Black and white"
            />
            <div className="flex gap-1">
              <DropZoneReplace busy={busy} onFile={onFile} />
              <Button type="button" variant="ghost" size="sm" disabled={Boolean(busy)} onClick={() => onChange(undefined)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <DropZone
          label="Upload a photo"
          hint="Click or drop. JPEG, PNG or WebP up to 25 MB, at least 600px. It's given the brand grade."
          accept="image/jpeg,image/png,image/webp"
          busy={busy}
          onFile={onFile}
        />
      )}
      {busy && value && <p role="status" className="text-sm text-muted-foreground">{busy}</p>}
      {value && (
        <Field
          label="Alt text"
          htmlFor={`${idPrefix}-alt`}
          required
          hint="What the photo shows, for people who can't see it. Required to publish."
        >
          <Input
            id={`${idPrefix}-alt`}
            value={value.alt}
            maxLength={LIMITS.alt}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            aria-invalid={!value.alt.trim()}
            placeholder="Founders at the whiteboard on the third floor"
          />
        </Field>
      )}
      {problem && (
        <p role="alert" className="text-sm text-geekdom-red">
          {problem}
        </p>
      )}
    </div>
  );
}

function DropZoneReplace({ busy, onFile }: { busy: string | null; onFile: (f: File) => void }) {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="ghost" size="sm" disabled={Boolean(busy)} onClick={() => input.current?.click()}>
        Replace
      </Button>
    </>
  );
}

/** An uploaded clip. Returns the Blob URL. */
export function VideoUploadField({
  noteId,
  value,
  onChange,
}: {
  noteId: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  async function onFile(file: File) {
    setProblem(null);
    if (!/^video\/(mp4|webm)$/.test(file.type)) {
      setProblem("Upload an MP4 or WebM video.");
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setProblem("That video is over 200 MB. Trim it, or post it to YouTube and paste the link instead.");
      return;
    }
    try {
      setBusy("Uploading… 0%");
      onChange(await toBlob(noteId, "video", file, (p) => setBusy(`Uploading… ${p}%`)));
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Upload failed.");
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-bone-light px-4 py-3">
          <span className="min-w-0 truncate text-sm text-graphite">{decodeURIComponent(value.split("/").pop() ?? "Video")}</span>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            Remove
          </Button>
        </div>
      ) : (
        <DropZone
          label="Upload a clip"
          hint="MP4 or WebM, up to 200 MB. Keep it short — 30 seconds or less reads best in a frame."
          accept="video/mp4,video/webm"
          busy={busy}
          onFile={onFile}
        />
      )}
      {problem && (
        <p role="alert" className="text-sm text-geekdom-red">
          {problem}
        </p>
      )}
    </div>
  );
}

/** A share-card override, cropped to 1200×630 on the server. */
export function CardUploadField({ noteId, onChange }: { noteId: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  async function onFile(file: File) {
    setProblem(null);
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setProblem("Upload a JPEG, PNG or WebP image.");
      return;
    }
    try {
      setBusy("Uploading… 0%");
      const original = await toBlob(noteId, "originals", file, (p) => setBusy(`Uploading… ${p}%`));
      setBusy("Cropping to 1200×630…");
      const res = await processCard(noteId, original);
      if (res.ok) onChange(res.value);
      else setProblem(res.error);
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Upload failed.");
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <DropZone
        label="Upload your own card"
        hint="Optional. At least 1200×630; it's cropped to exactly that."
        accept="image/jpeg,image/png,image/webp"
        busy={busy}
        onFile={onFile}
      />
      {problem && (
        <p role="alert" className="text-sm text-geekdom-red">
          {problem}
        </p>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  GripVertical,
  ImageIcon,
  Minus,
  MoveLeft,
  MoveRight,
  Plus,
  Quote,
  Trash2,
  Type,
  Video,
  X,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, FoldingGroup } from "@/components/admin/field-group";
import { FrameView } from "@/components/field-notes/frame-view";
import { TextFrameEditor } from "@/components/admin/field-notes/text-editor";
import { CardUploadField, PhotoField, VideoUploadField } from "@/components/admin/field-notes/media-field";
import { MONO } from "@/components/site/section";
import { deleteNote, publishNote, saveDraft, unpublishNote } from "@/lib/field-notes/actions";
import {
  EMPTY_DOC,
  FRAME_LABELS,
  LIMITS,
  checklist,
  fingerprint,
  parseVideoUrl,
  slugify,
} from "@/lib/field-notes/schemas";
import { fieldNotePath, searchPreview } from "@/lib/field-notes/seo";
import { cn } from "@/lib/utils";
import type { AdminNote, Frame, FrameType, Ground, NoteContent } from "@/lib/field-notes/types";

/*
  THE FIELD NOTE EDITOR — a full page, not a slide-out: a carousel needs
  room for its frames.

    ┌ ← Field Notes · status · saved 2 min ago      Preview  Publish ┐
    ├ filmstrip: [1 Cover][2 Text][3 Photo] … + Add a frame ─────────┤
    │ canvas: the selected frame, real 4:5     │ Details            │
    │ that frame's fields                      │ Search · Share card│
    │                                          │ Ready to publish?  │

  DRAFT VS LIVE. Everything here edits the DRAFT. A published note keeps
  showing its snapshot on the site until "Publish changes", so a half-
  finished edit is never public. Drafts save on demand and every 30 seconds
  while there are unsaved changes; leaving with unsaved changes asks first.

  TITLE AND DEK ARE ONE SOURCE. The cover frame displays them; the note's
  title and dek are the same values, edited from either place.
*/

const pick = (n: AdminNote): NoteContent => ({
  title: n.title,
  slug: n.slug,
  dek: n.dek,
  author: n.author,
  frames: n.frames,
  seo: n.seo,
});

const newId = () => `f-${crypto.randomUUID().slice(0, 8)}`;

function blankFrame(type: FrameType): Frame {
  const id = newId();
  switch (type) {
    case "cover":
      return { id, type, ground: "bone", title: "", dek: "" };
    case "text":
      return { id, type, ground: "bone", doc: EMPTY_DOC };
    case "image":
      return { id, type, caption: "", fit: "cover" };
    case "quote":
      return { id, type, ground: "graphite", text: "", attribution: "" };
    case "video":
      return { id, type, caption: "" };
  }
}

const ADDABLE: { type: FrameType; icon: typeof Type }[] = [
  { type: "text", icon: Type },
  { type: "image", icon: ImageIcon },
  { type: "quote", icon: Quote },
  { type: "video", icon: Video },
  { type: "cover", icon: LayoutTemplate },
];

function ago(iso: string | null): string {
  if (!iso) return "";
  const s = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Counter({ n, max, min }: { n: number; max: number; min?: number }) {
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return (
    <span className={cn("tabular-nums", bad ? "text-geekdom-red" : "text-muted-foreground")}>
      {n}/{max}
    </span>
  );
}

function GroundToggle({ value, onChange }: { value: Ground; onChange: (g: Ground) => void }) {
  return (
    <div role="group" aria-label="Background" className="flex">
      {(["bone", "graphite"] as const).map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={value === g}
          onClick={() => onChange(g)}
          className={cn(
            "flex items-center gap-2 border px-3 py-2 text-sm transition-colors first:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
            value === g ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite hover:border-graphite",
          )}
        >
          <span aria-hidden="true" className={cn("h-3 w-3 border", g === "bone" ? "border-border bg-bone" : "border-bone/30 bg-graphite")} />
          {g === "bone" ? "Bone" : "Graphite"}
        </button>
      ))}
    </div>
  );
}

export function NoteEditor({ note }: { note: AdminNote }) {
  const router = useRouter();
  const id = note.id;
  const [c, setC] = React.useState<NoteContent>(() => pick(note));
  const [saved, setSaved] = React.useState(() => fingerprint(pick(note)));
  const [savedAt, setSavedAt] = React.useState(note.updatedAt);
  const [sel, setSel] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [notice, setNotice] = React.useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [slugTouched, setSlugTouched] = React.useState(Boolean(note.slug));
  const [cardVersion, setCardVersion] = React.useState(0);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [videoTab, setVideoTab] = React.useState<"link" | "upload">("link");
  const [videoLink, setVideoLink] = React.useState("");
  const [videoLinkError, setVideoLinkError] = React.useState<string | null>(null);
  const [, tick] = React.useState(0);

  const dirty = fingerprint(c) !== saved;
  const latest = React.useRef(c);
  React.useEffect(() => {
    latest.current = c;
  }, [c]);

  const frame = c.frames[Math.min(sel, c.frames.length - 1)] as Frame | undefined;
  const checks = checklist(c);
  const ready = checks.every((i) => i.ok);
  const busy = saving || pending;

  // ── Saving ────────────────────────────────────────────────────────────────
  const save = React.useCallback(async (): Promise<boolean> => {
    const snapshot = latest.current;
    setSaving(true);
    const res = await saveDraft(id, snapshot).catch(() => ({ ok: false as const, error: "Couldn't reach the server." }));
    setSaving(false);
    if (res.ok) {
      setSaved(fingerprint(snapshot));
      setSavedAt(new Date().toISOString());
      setCardVersion((v) => v + 1);
      setErrors({});
      return true;
    }
    setErrors(("fieldErrors" in res && res.fieldErrors) || {});
    setNotice({ tone: "error", text: res.error ?? "Couldn't save." });
    return false;
  }, [id]);

  // Autosave every 30s while dirty; refresh the "saved … ago" line.
  React.useEffect(() => {
    const t = setInterval(() => {
      tick((n) => n + 1);
      if (fingerprint(latest.current) !== saved && !saving) void save();
    }, 30_000);
    return () => clearInterval(t);
  }, [saved, saving, save]);

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ── Content updates ───────────────────────────────────────────────────────
  const set = <K extends keyof NoteContent>(k: K, v: NoteContent[K]) => setC((p) => ({ ...p, [k]: v }));

  function setTitle(title: string) {
    setC((p) => ({
      ...p,
      title,
      slug: slugTouched || note.publishedSlug ? p.slug : slugify(title),
      frames: p.frames.map((f, i) => (i === 0 && f.type === "cover" ? { ...f, title } : f)),
    }));
  }
  function setDek(dek: string) {
    setC((p) => ({
      ...p,
      dek,
      frames: p.frames.map((f, i) => (i === 0 && f.type === "cover" ? { ...f, dek } : f)),
    }));
  }

  const updateFrame = React.useCallback((i: number, patch: Partial<Frame>) => {
    setC((p) => ({ ...p, frames: p.frames.map((f, j) => (j === i ? ({ ...f, ...patch } as Frame) : f)) }));
  }, []);

  function addFrame(type: FrameType) {
    if (c.frames.length >= LIMITS.frames) {
      setNotice({ tone: "error", text: `A Field Note holds up to ${LIMITS.frames} frames.` });
      return;
    }
    const at = Math.min(sel + 1, c.frames.length);
    setC((p) => ({ ...p, frames: [...p.frames.slice(0, at), blankFrame(type), ...p.frames.slice(at)] }));
    setSel(at);
  }

  function moveFrame(from: number, to: number) {
    if (to < 0 || to >= c.frames.length || from === to) return;
    setC((p) => {
      const frames = [...p.frames];
      const [f] = frames.splice(from, 1);
      frames.splice(to, 0, f);
      return { ...p, frames };
    });
    setSel(to);
  }

  function duplicateFrame(i: number) {
    if (c.frames.length >= LIMITS.frames) return;
    setC((p) => ({ ...p, frames: [...p.frames.slice(0, i + 1), { ...p.frames[i], id: newId() }, ...p.frames.slice(i + 1)] }));
    setSel(i + 1);
  }

  function removeFrame(i: number) {
    if (!window.confirm(`Delete frame ${i + 1} (${FRAME_LABELS[c.frames[i].type]})?`)) return;
    setC((p) => ({ ...p, frames: p.frames.filter((_, j) => j !== i) }));
    setSel((s) => Math.max(0, Math.min(s, c.frames.length - 2)));
  }

  // ── Publishing ────────────────────────────────────────────────────────────
  function onPublish() {
    setNotice(null);
    startTransition(async () => {
      const snapshot = latest.current;
      const res = await publishNote(id, snapshot);
      if (res.ok) {
        setSaved(fingerprint(snapshot));
        setSavedAt(new Date().toISOString());
        setNotice({ tone: "ok", text: note.status === "published" ? "Changes published." : "Published." });
        router.refresh();
      } else {
        setErrors(res.fieldErrors ?? {});
        setNotice({ tone: "error", text: res.error ?? "Couldn't publish." });
      }
    });
  }

  function onUnpublish() {
    if (!window.confirm("Unpublish this Field Note? It stays here as a draft.")) return;
    startTransition(async () => {
      const res = await unpublishNote(id);
      setNotice(res.ok ? { tone: "ok", text: "Unpublished. It's a draft again." } : { tone: "error", text: res.error ?? "Couldn't unpublish." });
      router.refresh();
    });
  }

  function onDelete() {
    if (!window.confirm(`Delete “${c.title || "this Field Note"}” and its photos and videos? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteNote(id);
      if (res.ok) {
        setSaved(fingerprint(latest.current)); // don't warn on the way out
        router.push("/portal/admin/field-notes");
      } else setNotice({ tone: "error", text: res.error ?? "Couldn't delete." });
    });
  }

  async function onPreview() {
    // Opened first, synchronously, so a popup blocker doesn't eat it.
    const w = window.open("about:blank", "_blank");
    if (dirty && !(await save())) {
      w?.close();
      return;
    }
    if (w) w.location.href = `/preview/field-notes/${id}`;
  }

  const status =
    note.status === "published" ? (
      note.changed || dirty ? (
        <Badge tone="pending">Published · unpublished changes</Badge>
      ) : (
        <Badge tone="good">Published</Badge>
      )
    ) : (
      <Badge tone="neutral">Draft</Badge>
    );

  const google = searchPreview(c);
  const cardSrc = c.seo.image ?? `/api/admin/field-notes/${id}/card?v=${cardVersion}-${savedAt ?? ""}`;

  return (
    <div className="flex flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border bg-bone/95 px-6 py-3 backdrop-blur lg:px-10">
        <div className="flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link href="/portal/admin/field-notes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-graphite">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.7} aria-hidden="true" />
              Field Notes
            </Link>
            {status}
            <span role="status" className="text-sm text-muted-foreground">
              {saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${ago(savedAt)}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => void save()} disabled={busy || !dirty}>
              Save draft
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onPreview} disabled={busy}>
              Preview
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </Button>
            <Button
              type="button"
              variant="ink"
              size="sm"
              onClick={onPublish}
              disabled={busy || !ready || (note.status === "published" && !note.changed && !dirty)}
              title={ready ? undefined : "Finish the checklist to publish"}
            >
              {pending ? "Publishing…" : note.status === "published" ? "Publish changes" : "Publish"}
            </Button>
          </div>
        </div>
        {notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={cn("mt-2 max-w-7xl text-sm", notice.tone === "error" ? "text-geekdom-red" : "text-graphite")}
          >
            {notice.text}
          </p>
        )}
      </div>

      <div className="px-6 py-8 lg:px-10">
        <div className="grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1fr)_23rem]">
          {/* ── Frames ──────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className={cn(MONO.label, "text-muted-foreground")}>
                Frames · {c.frames.length}/{LIMITS.frames}
              </h2>
              <p className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <GripVertical className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
                Drag to reorder
              </p>
            </div>

            <ol className="mt-3 flex gap-2 overflow-x-auto pb-3" aria-label="Frames">
              {c.frames.map((f, i) => (
                <li
                  key={f.id}
                  draggable
                  aria-roledescription="draggable frame"
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", f.id); // Firefox needs data
                    setDragId(f.id);
                  }}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    if (overId !== f.id) setOverId(f.id);
                  }}
                  onDragLeave={() => setOverId((o) => (o === f.id ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = c.frames.findIndex((x) => x.id === (dragId ?? e.dataTransfer.getData("text/plain")));
                    setDragId(null);
                    setOverId(null);
                    if (from >= 0) moveFrame(from, i);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  className={cn("shrink-0 cursor-grab active:cursor-grabbing", dragId === f.id && "opacity-30")}
                >
                  <button
                    type="button"
                    onClick={() => setSel(i)}
                    aria-current={i === sel ? "true" : undefined}
                    aria-label={`Frame ${i + 1}: ${FRAME_LABELS[f.type]}`}
                    className={cn(
                      "block w-24 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2 focus-visible:ring-offset-bone",
                    )}
                  >
                    <FrameView
                      frame={f}
                      still
                      className={cn(
                        "w-full border",
                        i === sel ? "border-graphite outline-2 outline-offset-1 outline-clay" : "border-border",
                        overId === f.id && dragId !== f.id && "outline-2 -outline-offset-2 outline-clay",
                      )}
                    />
                    <span className={cn(MONO.micro, "mt-1.5 block text-muted-foreground")}>
                      {i + 1} · {FRAME_LABELS[f.type]}
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
              <span className="mr-1 text-sm text-muted-foreground">Add after frame {Math.min(sel, c.frames.length - 1) + 1}:</span>
              {ADDABLE.map(({ type, icon: Icon }) => (
                <Button key={type} type="button" variant="outline" size="sm" onClick={() => addFrame(type)} disabled={c.frames.length >= LIMITS.frames}>
                  <Plus className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {FRAME_LABELS[type]}
                </Button>
              ))}
            </div>

            {frame ? (
              // Canvas and its fields side by side only when both have room
              // (2xl); below that the fields sit under the canvas — beside
              // it at laptop widths they got ~250px.
              <div className="mt-6 grid gap-8 2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
                {/* The canvas */}
                <div className="w-full max-w-[26rem]">
                  {frame.type === "text" ? (
                    <TextFrameEditor
                      key={frame.id}
                      frame={frame}
                      onChange={(doc) => updateFrame(sel, { doc } as Partial<Frame>)}
                    />
                  ) : (
                    <FrameView frame={frame} className="w-full border border-border" />
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveFrame(sel, sel - 1)} disabled={sel === 0} aria-label="Move frame earlier">
                      <MoveLeft className="h-4 w-4" strokeWidth={1.7} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => moveFrame(sel, sel + 1)}
                      disabled={sel >= c.frames.length - 1}
                      aria-label="Move frame later"
                    >
                      <MoveRight className="h-4 w-4" strokeWidth={1.7} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => duplicateFrame(sel)} aria-label="Duplicate frame">
                      <Copy className="h-4 w-4" strokeWidth={1.7} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFrame(sel)} aria-label="Delete frame">
                      <Trash2 className="h-4 w-4" strokeWidth={1.7} />
                    </Button>
                  </div>
                </div>

                {/* That frame's fields */}
                <div className="flex min-w-0 flex-col gap-8">
                  <FieldGroup title={`Frame ${sel + 1} · ${FRAME_LABELS[frame.type]}`}>
                    {"ground" in frame && (
                      <Field label="Background" htmlFor="fn-ground">
                        <GroundToggle value={frame.ground} onChange={(g) => updateFrame(sel, { ground: g } as Partial<Frame>)} />
                      </Field>
                    )}

                    {frame.type === "cover" && (
                      <>
                        {sel === 0 ? (
                          <>
                            <Field label="Title" htmlFor="fn-cover-title" required hint="Also the note's title — in search, on the share card.">
                              <Input id="fn-cover-title" value={c.title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
                            </Field>
                            <Field label="Dek" htmlFor="fn-cover-dek" hint="One line under the title.">
                              <Input id="fn-cover-dek" value={c.dek} maxLength={LIMITS.dek} onChange={(e) => setDek(e.target.value)} />
                            </Field>
                          </>
                        ) : (
                          <>
                            <Field label="Title" htmlFor="fn-cover-title">
                              <Input id="fn-cover-title" value={frame.title} maxLength={LIMITS.title} onChange={(e) => updateFrame(sel, { title: e.target.value } as Partial<Frame>)} />
                            </Field>
                            <Field label="Dek" htmlFor="fn-cover-dek">
                              <Input id="fn-cover-dek" value={frame.dek} maxLength={LIMITS.dek} onChange={(e) => updateFrame(sel, { dek: e.target.value } as Partial<Frame>)} />
                            </Field>
                          </>
                        )}
                        <PhotoField
                          noteId={id}
                          idPrefix={`fn-${frame.id}`}
                          label="Cover photo (optional)"
                          value={frame.image}
                          onChange={(image) => updateFrame(sel, { image } as Partial<Frame>)}
                        />
                      </>
                    )}

                    {frame.type === "text" && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Type straight into the frame. Styles are the brand&rsquo;s: Body and headings in Rubik, Pull quote and
                        italics in Fraunces, Caption in Plex Mono.
                      </p>
                    )}

                    {frame.type === "image" && (
                      <>
                        <PhotoField noteId={id} idPrefix={`fn-${frame.id}`} value={frame.image} onChange={(image) => updateFrame(sel, { image } as Partial<Frame>)} />
                        <Field label="Fit" htmlFor="fn-fit">
                          <Switch
                            id="fn-fit"
                            checked={frame.fit === "contain"}
                            onChange={(v) => updateFrame(sel, { fit: v ? "contain" : "cover" } as Partial<Frame>)}
                            label="Show the whole photo (no crop)"
                          />
                        </Field>
                        <Field label="Caption" htmlFor="fn-caption" hint={`${frame.caption.length}/${LIMITS.caption}`}>
                          <Input id="fn-caption" value={frame.caption} maxLength={LIMITS.caption} onChange={(e) => updateFrame(sel, { caption: e.target.value } as Partial<Frame>)} />
                        </Field>
                      </>
                    )}

                    {frame.type === "quote" && (
                      <>
                        <Field label="Quote" htmlFor="fn-quote" hint={`${frame.text.length}/${LIMITS.quote} · set in Fraunces`}>
                          <Textarea
                            id="fn-quote"
                            value={frame.text}
                            maxLength={LIMITS.quote}
                            onChange={(e) => updateFrame(sel, { text: e.target.value } as Partial<Frame>)}
                            className="min-h-28"
                          />
                        </Field>
                        <Field label="Who said it" htmlFor="fn-attr">
                          <Input id="fn-attr" value={frame.attribution} maxLength={LIMITS.author} onChange={(e) => updateFrame(sel, { attribution: e.target.value } as Partial<Frame>)} placeholder="Name, company" />
                        </Field>
                      </>
                    )}

                    {frame.type === "video" && (
                      <>
                        <div role="tablist" aria-label="Video source" className="flex">
                          {(["link", "upload"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              role="tab"
                              aria-selected={videoTab === t}
                              onClick={() => setVideoTab(t)}
                              className={cn(
                                "border px-4 py-2 text-sm first:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                                videoTab === t ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite",
                              )}
                            >
                              {t === "link" ? "YouTube or Vimeo link" : "Upload a clip"}
                            </button>
                          ))}
                        </div>
                        {videoTab === "link" ? (
                          <Field
                            label="Video link"
                            htmlFor="fn-video-link"
                            error={videoLinkError ?? undefined}
                            hint={
                              frame.video && frame.video.source !== "upload"
                                ? `Embedded: ${frame.video.source === "youtube" ? "YouTube" : "Vimeo"} ${frame.video.id}. Loads only when someone presses play.`
                                : "Paste the video's page URL."
                            }
                          >
                            <div className="flex gap-2">
                              <Input
                                id="fn-video-link"
                                value={videoLink}
                                onChange={(e) => setVideoLink(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=…"
                                inputMode="url"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const v = parseVideoUrl(videoLink);
                                  if (!v) return setVideoLinkError("That isn't a YouTube or Vimeo video link.");
                                  setVideoLinkError(null);
                                  setVideoLink("");
                                  updateFrame(sel, { video: v } as Partial<Frame>);
                                }}
                              >
                                Use
                              </Button>
                            </div>
                          </Field>
                        ) : (
                          <>
                            <VideoUploadField
                              noteId={id}
                              value={frame.video?.source === "upload" ? frame.video.url : undefined}
                              onChange={(url) =>
                                updateFrame(sel, { video: url ? { source: "upload", url, loop: false } : undefined } as Partial<Frame>)
                              }
                            />
                            {frame.video?.source === "upload" && (
                              <Switch
                                checked={frame.video.loop}
                                onChange={(loop) => updateFrame(sel, { video: { ...frame.video!, loop } } as Partial<Frame>)}
                                label="Play silently on a loop, like a GIF"
                              />
                            )}
                          </>
                        )}
                        {frame.video && (
                          <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => updateFrame(sel, { video: undefined } as Partial<Frame>)}>
                            <X className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                            Remove video
                          </Button>
                        )}
                        <PhotoField
                          noteId={id}
                          idPrefix={`fn-${frame.id}-poster`}
                          label="Poster (optional)"
                          value={frame.poster}
                          onChange={(poster) => updateFrame(sel, { poster } as Partial<Frame>)}
                        />
                        <Field label="Caption" htmlFor="fn-vcaption" hint={`${frame.caption.length}/${LIMITS.caption}`}>
                          <Input id="fn-vcaption" value={frame.caption} maxLength={LIMITS.caption} onChange={(e) => updateFrame(sel, { caption: e.target.value } as Partial<Frame>)} />
                        </Field>
                      </>
                    )}
                  </FieldGroup>
                </div>
              </div>
            ) : (
              <p className="mt-6 border border-dashed border-border px-6 py-10 text-sm text-muted-foreground">
                No frames yet. Add a cover to start.
              </p>
            )}
          </div>

          {/* ── Side panel ──────────────────────────────────────────────── */}
          <aside className="flex flex-col lg:sticky lg:top-24 lg:self-start">
            <section aria-labelledby="fn-checklist" className="border border-border bg-bone-light p-5">
              <h2 id="fn-checklist" className={cn(MONO.label, "text-muted-foreground")}>
                {ready ? "Ready to publish" : "Before you publish"}
              </h2>
              <ul className="mt-3 flex flex-col gap-2">
                {checks.map((item) => (
                  <li key={item.key} className="flex items-start gap-2 text-sm">
                    {item.ok ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-graphite" strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-clay" strokeWidth={2.4} aria-hidden="true" />
                    )}
                    <span className={item.ok ? "text-muted-foreground" : "text-graphite"}>
                      <span className="sr-only">{item.ok ? "Done: " : "To do: "}</span>
                      {item.label}
                      {!item.ok && item.frame !== undefined && (
                        <button type="button" onClick={() => setSel(item.frame!)} className="ml-1 underline decoration-clay decoration-2 underline-offset-2">
                          frame {item.frame + 1}
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-2">
              <FoldingGroup title="Details" summary={c.slug ? fieldNotePath(c.slug) : "No slug yet"} defaultOpen>
                <Field label="Title" htmlFor="fn-title" required error={errors.title}>
                  <Input id="fn-title" value={c.title} maxLength={LIMITS.title} onChange={(e) => setTitle(e.target.value)} placeholder="What the room figured out this month" />
                </Field>
                <Field
                  label="URL slug"
                  htmlFor="fn-slug"
                  required
                  error={errors.slug}
                  hint={
                    note.publishedSlug && note.publishedSlug !== c.slug
                      ? `Live at ${fieldNotePath(note.publishedSlug)} until you publish. The old address will be kept for a redirect.`
                      : `geekdom.com${fieldNotePath(c.slug || "…")}`
                  }
                >
                  <div className="flex gap-2">
                    <Input
                      id="fn-slug"
                      value={c.slug}
                      maxLength={LIMITS.slug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      aria-invalid={Boolean(errors.slug)}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => set("slug", slugify(c.title))}>
                      From title
                    </Button>
                  </div>
                </Field>
                <Field label="Dek" htmlFor="fn-dek" hint={`${c.dek.length}/${LIMITS.dek} · one line under the title`}>
                  <Input id="fn-dek" value={c.dek} maxLength={LIMITS.dek} onChange={(e) => setDek(e.target.value)} />
                </Field>
                <Field label="Author" htmlFor="fn-author" required>
                  <Input id="fn-author" value={c.author} maxLength={LIMITS.author} onChange={(e) => set("author", e.target.value)} placeholder="Full name" />
                </Field>
              </FoldingGroup>

              <FoldingGroup title="Search" summary={google.title}>
                <Field label="Search title" htmlFor="fn-seo-title" hint={<>Blank uses the title. <Counter n={(c.seo.title || c.title).length} max={LIMITS.seoTitle} /></>}>
                  <Input id="fn-seo-title" value={c.seo.title} maxLength={LIMITS.seoTitle} onChange={(e) => set("seo", { ...c.seo, title: e.target.value })} placeholder={c.title} />
                </Field>
                <Field
                  label="Description"
                  htmlFor="fn-seo-desc"
                  required
                  hint={
                    <>
                      For Google and link previews. Blank uses the dek.{" "}
                      <Counter n={(c.seo.description || c.dek).length} max={LIMITS.seoDescription} min={LIMITS.seoDescriptionMin} />
                    </>
                  }
                >
                  <Textarea
                    id="fn-seo-desc"
                    value={c.seo.description}
                    maxLength={LIMITS.seoDescription}
                    onChange={(e) => set("seo", { ...c.seo, description: e.target.value })}
                    placeholder={c.dek}
                    className="min-h-24"
                  />
                </Field>
                <div aria-label="Google result preview" className="border border-border bg-[#fff] p-4">
                  <p className="text-xs text-[#4d5156]">{google.url}</p>
                  <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{google.title}</p>
                  <p className="mt-1 text-sm leading-snug text-[#4d5156]">{google.description || "Add a description."}</p>
                </div>
              </FoldingGroup>

              <FoldingGroup title="Share card" summary={c.seo.image ? "Your upload" : "Generated"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cardSrc} alt="The share card for this Field Note" width={1200} height={630} className="w-full border border-border" />
                <div aria-label="Link preview" className="border border-border bg-bone-light">
                  <p className="px-3 pt-2.5 text-xs text-muted-foreground">geekdom.com</p>
                  <p className="px-3 text-sm font-medium text-graphite">{google.title}</p>
                  <p className="line-clamp-2 px-3 pb-3 text-xs text-muted-foreground">{google.description}</p>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {c.seo.image
                    ? "Your uploaded card is used everywhere this note is shared."
                    : "Made from the cover — title, byline and photo — and saved when you publish. This preview reflects the last save."}
                </p>
                {c.seo.image ? (
                  <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => set("seo", { ...c.seo, image: undefined })}>
                    Use the generated card instead
                  </Button>
                ) : (
                  <CardUploadField noteId={id} onChange={(url) => set("seo", { ...c.seo, image: url })} />
                )}
              </FoldingGroup>

              {note.status === "published" && (
                <FoldingGroup title="Live" summary={note.publishedSlug ? fieldNotePath(note.publishedSlug) : ""}>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    The public Field Notes page isn&rsquo;t built yet, so this note isn&rsquo;t reachable on the site. Publishing
                    now means it will be the moment that page ships.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="self-start" onClick={onUnpublish} disabled={busy}>
                    Unpublish
                  </Button>
                </FoldingGroup>
              )}
              <div className="pt-6">
                <Button type="button" variant="ghost" size="sm" onClick={onDelete} disabled={busy}>
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  Delete this Field Note
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

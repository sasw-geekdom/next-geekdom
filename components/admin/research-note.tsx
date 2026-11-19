"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { ArrowUpRight, Bold, Heading, Link2, List, ListOrdered, Unlink } from "lucide-react";
import { saveResearch } from "@/lib/admin/actions";
import type { Application } from "@/lib/admin/types";
import {
  hasWriting,
  RECOMMENDATIONS,
  RECOMMENDATION_LABELS,
  EMPTY_RESEARCH,
  type ResearchRecommendation,
} from "@/lib/application-research";
import { cleanDoc, safeHref } from "@/lib/field-notes/schemas";
import type { RichDoc, RichNode } from "@/lib/field-notes/types";
import { RichText } from "@/components/field-notes/rich-text";
import { ADMIN_LABEL, tableDate } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/*
  THE RESEARCH WRITE-UP — Monica's step (lib/application-research.ts).

  While the application is IN RESEARCH it's an editor at the top of the
  page, above the answers she's reading: blank with a one-line prompt
  (no imposed sections), bold, lists, section headings and links, plus a
  recommendation. An application with OLD STAFF NOTES and no write-up
  opens with those notes in it (lib/application-research.ts, notesToDoc)
  — they were the write-ups before this existed; there's no separate
  notes box. With THE TEAM it's the first thing on the page — read
  in the meeting, with every link she shared listed under it so nobody
  hunts through the text. Once decided it's the record, read-only.

  Rich text is the Field Notes allowlist (cleanDoc), rendered from JSON,
  never HTML — staff can paste anything, only the allowlist is kept.

  One provider wraps the page so the decision panel can see the draft:
  "Send to the team" saves unsaved work first, then sends.
*/

const TEMPLATE = EMPTY_RESEARCH;

/** Every link in a write-up, once each, in order. */
export function docLinks(doc: RichDoc): { href: string; text: string }[] {
  const seen = new Map<string, string>();
  const walk = (n: RichNode) => {
    if (n.type === "text") {
      for (const m of n.marks ?? []) {
        const href = m.type === "link" ? safeHref(m.attrs?.href) : null;
        if (href && !seen.has(href)) seen.set(href, n.text ?? href);
      }
    }
    (n.content ?? []).forEach(walk);
  };
  doc.content.forEach(walk);
  return [...seen].map(([href, text]) => ({ href, text }));
}

const hostOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
};

/** A URL as people read it: host and path, no scheme, no trailing slash. */
const prettyUrl = (href: string) => {
  try {
    const u = new URL(href);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return href.replace(/^mailto:/, "");
  }
};
const looksLikeUrl = (t: string) => /^(https?:\/\/|www\.|mailto:)/i.test(t.trim());

/**
 * For READING: drop empty paragraphs, then any section heading left with
 * nothing under it — an unfilled "Concerns" shouldn't print as a bare label.
 */
function withoutEmptySections(doc: RichDoc): RichDoc {
  const filled = doc.content.filter((n) => n.type !== "paragraph" || (n.content?.length ?? 0) > 0);
  const out = filled.filter((n, i) => n.type !== "heading" || (i + 1 < filled.length && filled[i + 1].type !== "heading"));
  return { type: "doc", content: out };
}

// ─── State shared with the decision panel ──────────────────────────────────

interface ResearchState {
  doc: RichDoc;
  recommendation: ResearchRecommendation | null;
  dirty: boolean;
  editable: boolean;
  setDoc: (d: RichDoc) => void;
  setRecommendation: (r: ResearchRecommendation | null) => void;
  /** Saves if there's anything unsaved; resolves with the server's answer. */
  save: () => Promise<{ ok: boolean; message: string }>;
}

const Ctx = React.createContext<ResearchState | null>(null);
export const useResearch = () => React.useContext(Ctx);

export function ResearchProvider({ application, children }: { application: Application; children: React.ReactNode }) {
  const editable = application.status === "initial_review" || application.status === "team_review";
  const savedDoc = application.research?.doc ?? null;
  const savedRec = application.research?.recommendation ?? null;
  const [doc, setDoc] = React.useState<RichDoc>(savedDoc ?? TEMPLATE);
  const [recommendation, setRecommendation] = React.useState<ResearchRecommendation | null>(savedRec);
  const [saved, setSaved] = React.useState({ json: JSON.stringify(savedDoc ?? TEMPLATE), rec: savedRec });
  const dirty = JSON.stringify(doc) !== saved.json || recommendation !== saved.rec;

  const save = React.useCallback(async () => {
    if (!dirty) return { ok: true, message: "No changes to save." };
    const res = await saveResearch(application.id, doc, recommendation);
    if (res.ok) setSaved({ json: JSON.stringify(doc), rec: recommendation });
    return res;
  }, [application.id, dirty, doc, recommendation]);

  // Don't lose a write-up to a closed tab.
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const value = React.useMemo(
    () => ({ doc, recommendation, dirty, editable, setDoc, setRecommendation, save }),
    [doc, recommendation, dirty, editable, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ─── The card ───────────────────────────────────────────────────────────────

export function ResearchCard({ application }: { application: Application }) {
  const r = useResearch();
  const router = useRouter();
  const inResearch = application.status === "initial_review";
  // In research it opens as the editor; with the team, as the read view (Edit to change).
  const [editing, setEditing] = React.useState(inResearch);
  const [pending, setPending] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  if (!r) return null;

  const stored = application.research;
  const showRead = !editing || !r.editable;

  // Decided, or with the team, and nothing was ever written (imported, or decided before research existed).
  if (showRead && !hasWriting(r.doc) && !r.recommendation) {
    if (!r.editable) return null;
    return (
      <section className="border border-dashed border-border px-5 py-4 text-sm text-muted-foreground">
        No write-up for this application.{" "}
        <button type="button" onClick={() => setEditing(true)} className="text-graphite underline decoration-clay underline-offset-2">
          Add it
        </button>
      </section>
    );
  }

  async function onSave() {
    setPending(true);
    setResult(null);
    const res = await r!.save();
    setResult(res);
    setPending(false);
    if (res.ok) {
      router.refresh();
      if (!inResearch) setEditing(false);
    }
  }

  const links = docLinks(r.doc);

  return (
    <section aria-labelledby="research-title" className="border border-border bg-bone-light">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-5 py-3">
        <h2 id="research-title" className={cn(ADMIN_LABEL, "text-graphite")}>
          Write-up
        </h2>
        <p className="text-xs text-muted-foreground">
          {stored?.fromNotes ? "From the earlier staff notes" : stored ? `${stored.by} · ${tableDate(stored.updatedAt)}` : "Not saved yet"}
          {r.dirty && <span className="ml-2 text-graphite">· Unsaved changes</span>}
        </p>
      </header>

      <div className="px-5 py-4">
        {showRead ? (
          <>
            {r.recommendation && <Recommendation value={r.recommendation} />}
            <div className="note-rich mt-4">
              <RichText doc={withoutEmptySections(r.doc)} />
            </div>
            {links.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h3 className={cn(ADMIN_LABEL, "text-muted-foreground")}>Links shared</h3>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {links.map((l) => (
                    <li key={l.href} className="min-w-0 text-sm">
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex max-w-full items-baseline gap-1.5 text-graphite underline decoration-clay underline-offset-2"
                      >
                        <span className="truncate">{looksLikeUrl(l.text) ? prettyUrl(l.href) : l.text}</span>
                        {!looksLikeUrl(l.text) && <span className="shrink-0 text-xs text-muted-foreground no-underline">{hostOf(l.href)}</span>}
                        <ArrowUpRight aria-hidden="true" className="h-3 w-3 shrink-0 self-center" strokeWidth={2} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.editable && (
              <button type="button" onClick={() => setEditing(true)} className="mt-5 text-sm text-graphite underline decoration-clay underline-offset-2">
                Edit the write-up
              </button>
            )}
          </>
        ) : (
          <>
            <RecommendationPicker value={r.recommendation} onChange={r.setRecommendation} />
            <NoteEditor doc={r.doc} onChange={r.setDoc} />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={onSave} disabled={pending || !r.dirty}>
                {pending ? "Saving…" : "Save write-up"}
              </Button>
              {!inResearch && (
                <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-sm text-muted-foreground underline underline-offset-2">
                  Done
                </button>
              )}
              {inResearch && (
                <p className="text-xs text-muted-foreground">Only staff see this. &ldquo;Send to the team&rdquo; saves it first.</p>
              )}
            </div>
          </>
        )}
        {result && (
          <p role={result.ok ? "status" : "alert"} className={cn("mt-3 text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
}

function Recommendation({ value }: { value: ResearchRecommendation }) {
  return (
    <p className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Recommends</span>
      <span className="inline-flex items-center gap-1.5 border border-graphite/20 bg-bone px-2 py-0.5 font-medium text-graphite">
        <span aria-hidden="true" className={cn("h-2 w-2", value === "approve" ? "bg-graphite" : value === "decline" ? "bg-concrete" : "bg-clay")} />
        {RECOMMENDATION_LABELS[value]}
      </span>
    </p>
  );
}

function RecommendationPicker({ value, onChange }: { value: ResearchRecommendation | null; onChange: (v: ResearchRecommendation | null) => void }) {
  return (
    <fieldset className="mb-4">
      <legend className={cn(ADMIN_LABEL, "text-graphite")}>Recommendation</legend>
      <p className="mt-0.5 text-xs text-muted-foreground">For the team&rsquo;s meeting. It guides the decision; it doesn&rsquo;t make it.</p>
      <div role="radiogroup" aria-label="Recommendation" className="mt-2 inline-flex border border-border bg-bone">
        {RECOMMENDATIONS.map((v, i) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(value === v ? null : v)}
            className={cn(
              "inline-flex h-8 items-center px-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
              i > 0 && "border-l border-border",
              value === v ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite",
            )}
          >
            {RECOMMENDATION_LABELS[v]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

// ─── The editor ─────────────────────────────────────────────────────────────

function Tool({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-8 w-8 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
        active ? "border-graphite bg-graphite text-bone" : "border-border bg-bone text-graphite hover:border-graphite",
      )}
    >
      {children}
    </button>
  );
}

function NoteEditor({ doc, onChange }: { doc: RichDoc; onChange: (d: RichDoc) => void }) {
  const [linking, setLinking] = React.useState(false);
  const [href, setHref] = React.useState("");
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        italic: false, // italics are Fraunces in this brand, and the admin doesn't load it
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          isAllowedUri: (url) => safeHref(url) !== null,
        },
      }),
      Placeholder.configure({
        placeholder: "What should the team know? Who they are, what you checked, any concerns — paste links as you go.",
      }),
    ],
    content: doc,
    editorProps: { attributes: { "aria-label": "Research write-up" } },
    onUpdate: ({ editor: e }) => onChangeRef.current(cleanDoc(e.getJSON())),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            heading: e.isActive("heading"),
            bold: e.isActive("bold"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
            href: (e.getAttributes("link").href as string | undefined) ?? "",
          }
        : null,
  });

  function applyLink() {
    if (!editor) return;
    const raw = href.trim();
    const clean = safeHref(raw && !/^(https?:|mailto:|\/)/i.test(raw) ? `https://${raw}` : raw);
    if (!clean) {
      setLinkError("Use a full web address (https://…) or an email (mailto:…).");
      return;
    }
    const chain = editor.chain().focus().extendMarkRange("link");
    if (editor.state.selection.empty && !state?.link) {
      chain.insertContent({ type: "text", text: clean, marks: [{ type: "link", attrs: { href: clean } }] }).run();
    } else {
      chain.setLink({ href: clean }).run();
    }
    setLinking(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-1">
        <Tool label="Section heading" active={state?.heading} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <Tool label="Bold" active={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Tool label="Bulleted list" active={state?.bullet} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <Tool label="Numbered list" active={state?.ordered} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <Tool
          label={state?.link ? "Edit link" : "Add link"}
          active={state?.link || linking}
          onClick={() => {
            setHref(state?.href ?? "");
            setLinkError(null);
            setLinking(true);
          }}
        >
          <Link2 className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        {state?.link && (
          <Tool label="Remove link" onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}>
            <Unlink className="h-4 w-4" strokeWidth={1.8} />
          </Tool>
        )}
      </div>

      {linking && (
        <div className="flex flex-col gap-2 border border-border bg-bone p-3">
          <label htmlFor="research-link" className="text-sm font-medium text-graphite">
            Link address
          </label>
          <div className="flex gap-2">
            <Input
              id="research-link"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") setLinking(false);
              }}
              placeholder="https://linkedin.com/in/…"
              autoFocus
            />
            <Button type="button" variant="ink" size="sm" onClick={applyLink}>
              Apply
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setLinking(false)}>
              Cancel
            </Button>
          </div>
          {linkError && (
            <p role="alert" className="text-sm text-geekdom-red">
              {linkError}
            </p>
          )}
        </div>
      )}

      <div className="note-rich border border-border bg-bone px-3 py-2.5 focus-within:border-graphite">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

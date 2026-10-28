"use client";

import * as React from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Node, mergeAttributes } from "@tiptap/core";
import { Bold, Italic, Link2, List, ListOrdered, Unlink } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { FrameView } from "@/components/field-notes/frame-view";
import { cleanDoc, safeHref } from "@/lib/field-notes/schemas";
import { cn } from "@/lib/utils";
import type { Frame, RichDoc } from "@/lib/field-notes/types";

/*
  A TEXT FRAME, EDITED IN PLACE — Tiptap inside the real frame, so what you
  type is set exactly as the reader sets it (`.fn-rich`, in cqw).

  BRAND STYLES, NOT FONTS (Jesse's call). The style picker is the guide's
  type, by job: Body and Heading/Subhead in Rubik, Pull quote in Fraunces
  italic, Caption in Plex Mono. Marks are bold (Rubik 500 — "never bold"),
  italic (set in Fraunces — never italic Rubik), lists and links. Nothing
  else is enabled: no underline (it would read as a link), no strike, no
  code, no colors or sizes — StarterKit's extras are switched off so a paste
  can't smuggle them in, and the server rebuilds the JSON from the same
  allowlist regardless (cleanDoc).
*/

/** Caption: a paragraph set in Plex Mono, small caps-style. */
const Caption = Node.create({
  name: "caption",
  group: "block",
  content: "inline*",
  parseHTML: () => [{ tag: 'p[data-type="caption"]', priority: 60 }],
  renderHTML: ({ HTMLAttributes }) => ["p", mergeAttributes(HTMLAttributes, { "data-type": "caption" }), 0],
});

const STYLES = [
  { value: "body", label: "Body" },
  { value: "heading", label: "Heading" },
  { value: "subhead", label: "Subhead" },
  { value: "quote", label: "Pull quote" },
  { value: "caption", label: "Caption" },
] as const;

type Style = (typeof STYLES)[number]["value"];

function currentStyle(e: Editor): Style {
  if (e.isActive("heading", { level: 2 })) return "heading";
  if (e.isActive("heading", { level: 3 })) return "subhead";
  if (e.isActive("blockquote")) return "quote";
  if (e.isActive("caption")) return "caption";
  return "body";
}

function applyStyle(e: Editor, s: Style) {
  const c = e.chain().focus();
  if (e.isActive("blockquote") && s !== "quote") c.lift("blockquote");
  if (s === "body") c.setParagraph();
  if (s === "heading") c.setHeading({ level: 2 });
  if (s === "subhead") c.setHeading({ level: 3 });
  if (s === "caption") c.setNode("caption");
  if (s === "quote") c.setParagraph().setBlockquote();
  c.run();
}

function Tool({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the selection in the editor
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
        active ? "border-graphite bg-graphite text-bone" : "border-border bg-bone-light text-graphite hover:border-graphite",
      )}
    >
      {children}
    </button>
  );
}

export function TextFrameEditor({
  frame,
  onChange,
}: {
  frame: Extract<Frame, { type: "text" }>;
  onChange: (doc: RichDoc) => void;
}) {
  const [linking, setLinking] = React.useState(false);
  const [href, setHref] = React.useState("");
  const [linkError, setLinkError] = React.useState<string | null>(null);
  const [overflow, setOverflow] = React.useState(false);
  const box = React.useRef<HTMLDivElement>(null);
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false, // SSR: render on the client only
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
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
      Caption,
      Placeholder.configure({ placeholder: "Write this frame…" }),
    ],
    content: frame.doc,
    editorProps: {
      attributes: { "aria-label": "Frame text", class: "min-h-full" },
    },
    onUpdate: ({ editor: e }) => onChangeRef.current(cleanDoc(e.getJSON())),
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            style: currentStyle(e),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            link: e.isActive("link"),
            href: (e.getAttributes("link").href as string | undefined) ?? "",
          }
        : null,
  });

  // Does the text run past the frame? Checked after every change and resize.
  React.useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(".fn-rich");
    if (!el) return;
    const check = () => setOverflow(el.scrollHeight > el.clientHeight + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    editor?.on("update", check);
    return () => {
      ro.disconnect();
      editor?.off("update", check);
    };
  }, [editor]);

  function openLink() {
    setHref(state?.href ?? "");
    setLinkError(null);
    setLinking(true);
  }

  function applyLink() {
    if (!editor) return;
    const clean = safeHref(href.trim() && !/^(https?:|mailto:|\/)/i.test(href.trim()) ? `https://${href.trim()}` : href);
    if (!clean) {
      setLinkError("Use a full web address (https://…), an email (mailto:…) or a path on this site (/club).");
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
    <div className="flex flex-col gap-3">
      <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-1.5">
        <div className="w-40">
          <Combobox
            name="text-style"
            options={STYLES}
            value={state?.style ?? "body"}
            onChange={(v) => editor && applyStyle(editor, v as Style)}
            searchable={false}
            placeholder="Style"
          />
        </div>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
        <Tool label="Bold" active={state?.bold} onClick={() => editor?.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <Tool label="Italic (Fraunces)" active={state?.italic} onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
        <Tool label="Bulleted list" active={state?.bullet} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <Tool label="Numbered list" active={state?.ordered} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
        <Tool label={state?.link ? "Edit link" : "Add link"} active={state?.link || linking} onClick={openLink}>
          <Link2 className="h-4 w-4" strokeWidth={1.8} />
        </Tool>
        {state?.link && (
          <Tool label="Remove link" onClick={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}>
            <Unlink className="h-4 w-4" strokeWidth={1.8} />
          </Tool>
        )}
      </div>

      {linking && (
        <div className="flex flex-col gap-2 border border-border bg-bone-light p-3">
          <label htmlFor="fn-link" className="text-sm font-medium text-graphite">
            Link address
          </label>
          <div className="flex gap-2">
            <Input
              id="fn-link"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === "Escape") setLinking(false);
              }}
              placeholder="https://… or /club"
              autoFocus
            />
            <Button type="button" variant="ink" size="sm" onClick={applyLink}>
              Apply
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setLinking(false)}>
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Links to other sites open in a new tab on the site.</p>
          {linkError && (
            <p role="alert" className="text-sm text-geekdom-red">
              {linkError}
            </p>
          )}
        </div>
      )}

      <div ref={box}>
        <FrameView frame={frame} className="w-full border border-border">
          <EditorContent editor={editor} className="h-full" />
        </FrameView>
      </div>
      {overflow && (
        <p role="status" className="border-l-2 border-clay pl-3 text-sm text-graphite">
          This text runs past the bottom of the frame. Trim it, or split it into a second text frame.
        </p>
      )}
    </div>
  );
}

import * as React from "react";
import { isExternal, safeHref } from "@/lib/field-notes/schemas";
import type { RichDoc, RichMark, RichNode } from "@/lib/field-notes/types";

/*
  A TEXT FRAME'S CONTENT, RENDERED FROM JSON — never from HTML.

  The stored doc has already been rebuilt from an allowlist on the way in
  (cleanDoc, lib/field-notes/schemas.ts). This renders that allowlist and
  nothing else: an unknown node renders nothing, and every link is checked
  again here, so even a doc edited by hand in the console can't put a
  `javascript:` href in front of a reader. Styling is `.fn-rich` in
  globals.css, shared with the editor.
*/

function withMarks(text: string, marks: RichMark[] | undefined, key: React.Key): React.ReactNode {
  let out: React.ReactNode = text;
  for (const m of marks ?? []) {
    if (m.type === "bold") out = <strong>{out}</strong>;
    else if (m.type === "italic") out = <em>{out}</em>;
    else if (m.type === "link") {
      const href = safeHref(m.attrs?.href);
      if (!href) continue;
      out = isExternal(href) ? (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {out}
        </a>
      ) : (
        <a href={href}>{out}</a>
      );
    }
  }
  return <React.Fragment key={key}>{out}</React.Fragment>;
}

function children(nodes: RichNode[] | undefined): React.ReactNode[] {
  return (nodes ?? []).map((n, i) => node(n, i));
}

function node(n: RichNode, key: number): React.ReactNode {
  switch (n.type) {
    case "text":
      return withMarks(n.text ?? "", n.marks, key);
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      return <p key={key}>{children(n.content)}</p>;
    case "caption":
      return (
        <p key={key} data-type="caption">
          {children(n.content)}
        </p>
      );
    case "heading":
      return n.attrs?.level === 3 ? <h3 key={key}>{children(n.content)}</h3> : <h2 key={key}>{children(n.content)}</h2>;
    case "blockquote":
      return <blockquote key={key}>{children(n.content)}</blockquote>;
    case "bulletList":
      return <ul key={key}>{children(n.content)}</ul>;
    case "orderedList": {
      const start = Number(n.attrs?.start);
      return (
        <ol key={key} start={Number.isInteger(start) && start > 1 ? start : undefined}>
          {children(n.content)}
        </ol>
      );
    }
    case "listItem":
      return <li key={key}>{children(n.content)}</li>;
    default:
      return null;
  }
}

export function RichText({ doc }: { doc: RichDoc }) {
  return <>{children(doc.content)}</>;
}

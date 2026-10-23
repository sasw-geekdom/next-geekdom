"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { HEADING, MONO } from "@/components/site/section";

/*
  A RIGHT-HAND SLIDE-OUT PANEL for admin editing — the pattern next-sasw's
  admin uses (components/ui/drawer.tsx there), rebuilt without its library.

  NATIVE <dialog>, NOT A FIXED DIV. `showModal()` puts the panel in the top
  layer, so no ancestor's transform can trap it — and every revealed block on
  this site IS a transform's stacking context (AGENTS.md, Scroll motion). It
  also gives focus containment, Escape and `inert` on the page behind it for
  free, which a div would need a focus-trap dependency for.

  CSS MOTION, NOT `motion`. next-sasw animates with motion/react; this repo
  keeps that library to /since-2011 and does everything else in CSS. The
  slide and the backdrop fade are transitions in globals.css (`.drawer`),
  using `@starting-style` for the entrance and `allow-discrete` so the exit
  plays before the dialog leaves the top layer. A browser without those
  still opens and closes the panel — instantly.

  Brand: Bone panel, a Graphite hairline on its leading edge, square corners,
  a sticky footer for the actions so Save never scrolls out of reach.
*/
export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: React.ReactNode;
  /** Pinned under the scrolling body — the form's Save and Cancel. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() moves focus to the first focusable element (the close
      // button), overriding React's `autoFocus`. Mark the field that should
      // take the cursor with `data-autofocus` instead.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // The page behind shouldn't scroll under the panel.
  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Escape fires `cancel`; route it through onClose so the parent owns
      // the state instead of the dialog closing itself behind React's back.
      onCancel={(e) => {
        // Only the dialog's OWN cancel (Escape). A file input's `cancel` —
        // the person closed the file picker without choosing — bubbles up to
        // here too, and used to close the whole drawer.
        if (e.target !== e.currentTarget) return;
        e.preventDefault();
        onClose();
      }}
      // A click on the dialog element itself (not its panel) is the backdrop.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "drawer fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-xl border-0 border-l border-graphite bg-bone p-0 text-graphite",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
          <div>
            {eyebrow && <p className={cn(MONO.label, "text-muted-foreground")}>{eyebrow}</p>}
            <h2 id={titleId} className={cn(HEADING.subhead, eyebrow && "mt-1.5")}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-graphite focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">{children}</div>

        {footer && (
          <footer className="flex flex-wrap items-center gap-3 border-t border-border bg-bone-light px-6 py-4 sm:px-8">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  THE BRANDED CONFIRM — in place of the browser's window.confirm on
  member-facing actions (cancelling a booking, taking someone off a team).

  A native <dialog> (top layer, focus held inside, Escape closes), centered,
  square, on Bone: a title, what it's about as a small receipt, what will
  happen in one plain line, and two buttons — the action in Graphite, and
  the safe choice, which the cursor starts on so Enter never destroys
  anything by accident. Errors stay inside the dialog; success closes it
  and the page says what happened.
*/
export function ConfirmDialog({
  open,
  title,
  details,
  children,
  confirmLabel,
  pendingLabel = "Working…",
  keepLabel = "Keep it",
  pending = false,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  /** The thing being acted on, as label/value rows — "Room: Pumpkin". */
  details?: [string, string][];
  /** What will happen, in a sentence or two. */
  children?: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  keepLabel?: string;
  pending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      data-lenis-prevent=""
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
      className="confirm-dialog m-auto w-[calc(100%-2rem)] max-w-md border border-graphite bg-bone p-0 text-graphite"
    >
      <div className="p-6 sm:p-7">
        <h2 id={titleId} className="text-xl font-medium tracking-tight">
          {title}
        </h2>
        {details && details.length > 0 && (
          <dl className="mt-5 border-y border-border">
            {details.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 first:border-t-0">
                <dt className={cn(MONO.label, "text-muted-foreground")}>{k}</dt>
                <dd className="text-right tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {children && <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{children}</div>}
        {error && (
          <p role="alert" className="mt-4 text-sm text-geekdom-red">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-bone-light px-6 py-4 sm:px-7">
        <Button type="button" variant="ink" onClick={onConfirm} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onClose} disabled={pending} data-autofocus>
          {keepLabel}
        </Button>
      </div>
    </dialog>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

const control = cn(
  "w-full rounded-lg border border-border bg-white px-3.5 text-base text-ink",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust focus-visible:ring-offset-1",
  "disabled:cursor-not-allowed disabled:opacity-50",
  // aria-invalid drives the error ring, so the styling and the accessibility
  // signal can't drift apart the way a separate `error` prop lets them.
  "aria-[invalid=true]:border-rust aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-rust",
);

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(control, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(control, "min-h-32 py-3 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("block text-sm font-medium text-ink", className)}
      {...props}
    >
      {children}
      {required && (
        // aria-hidden because the asterisk is decoration — the input itself
        // carries `required`, which is what a screen reader announces.
        <span aria-hidden="true" className="ml-0.5 text-rust">
          *
        </span>
      )}
    </label>
  );
}

/**
 * Label + control + error, wired together.
 *
 * The error is rendered with `role="alert"` and referenced by aria-describedby
 * so it's announced when it appears rather than only being visible.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {hint && (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-rust">
          {error}
        </p>
      )}
    </div>
  );
}

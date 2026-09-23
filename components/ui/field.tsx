/**
 * GEEKDOM RED IS DELIBERATE HERE, and it is one of only three places the
 * reserved color appears on the whole site (the others are the primary Apply
 * button and the error summary on the application form).
 *
 * The guide keeps Red for the logo and "rare accent moments". A field that
 * failed validation is exactly that: functional, infrequent, and the one
 * signal a form cannot afford to make subtle. It measures 4.6:1 on bone, which
 * passes AA for body text — Clay, at 3.5:1, does not, and an error message
 * nobody can read is worse than no color at all.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const control = cn(
  // Square, like the buttons beside them — Geekdom: "No rounded corners...
  // 90 degrees." A rounded field over a square submit read as two systems.
  "w-full rounded-none border border-border bg-bone-light px-3.5 text-base text-graphite",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-1",
  "disabled:cursor-not-allowed disabled:opacity-50",
  // aria-invalid drives the error ring, so the styling and the accessibility
  // signal can't drift apart the way a separate `error` prop lets them.
  "aria-[invalid=true]:border-clay aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-clay",
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
      className={cn("block text-sm font-medium text-graphite", className)}
      {...props}
    >
      {children}
      {required && (
        // aria-hidden because the asterisk is decoration — the input itself
        // carries `required`, which is what a screen reader announces.
        <span aria-hidden="true" className="ml-0.5 text-geekdom-red">
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
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-geekdom-red">
          {error}
        </p>
      )}
    </div>
  );
}

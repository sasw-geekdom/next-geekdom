import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";

/*
  THE FIELD NOTES LOCKUP, at page scale — the Geekdom wordmark │ "FIELD
  NOTES" in Plex Mono. A lockup of the one wordmark the guide gives Geekdom,
  not a mark of its own (the frames carry the same thing in `cqw`, in
  frame-view.tsx). Red on Bone, Bone on dark. Readers hear "Geekdom Field
  Notes"; the graphic itself is hidden from them.
*/
export function FieldNotesLockup({ dark = false, size = "md", className }: { dark?: boolean; size?: "sm" | "md"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center", size === "md" ? "gap-3" : "gap-2", className)}>
      <span className="sr-only">Geekdom Field Notes</span>
      <span
        aria-hidden="true"
        className={cn("geekdom-mask block aspect-[375/142]", size === "md" ? "h-[22px]" : "h-5", dark ? "bg-bone" : "bg-geekdom-red")}
      />
      <span aria-hidden="true" className={cn("w-px", size === "md" ? "h-5" : "h-4", dark ? "bg-bone/40" : "bg-graphite/25")} />
      <span aria-hidden="true" className={cn(MONO.label, dark ? "text-bone/80" : "text-muted-foreground")}>
        Field Notes
      </span>
    </span>
  );
}

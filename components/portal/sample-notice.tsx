import { cn } from "@/lib/utils";
import { MONO } from "@/components/site/section";

/*
  SAID ON SCREEN, NOT JUST IN A COMMENT: this page shows invented content
  for design review (data/mock/portal.ts). Anyone reviewing a screenshot —
  Geekdom included — should not mistake a sample member for a real one.
*/
export function SampleNotice({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className={cn(MONO.label, "text-graphite")}>Sample content</span>
      <span>{children ?? "Invented for design review — not real members or real policies."}</span>
    </p>
  );
}

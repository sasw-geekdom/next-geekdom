import Link from "next/link";
import { MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import { AREA_LABELS, type ActivityEntry } from "@/lib/admin/activity";

/*
  THE EDIT HISTORY, AS ROWS — the Overview's "Recent activity" tile and the
  full /portal/admin/activity page. One line per change, in words a person
  would say: "Dana published “Five questions to answer before you raise”".
  Times are Central, like every other time in the admin.
*/

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });

export function ActivityList({ entries, compact = false }: { entries: ActivityEntry[]; compact?: boolean }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing yet. Changes made in the admin show here, with who made them.</p>;
  }
  return (
    <ul className="border-b border-border">
      {entries.map((e) => {
        const label = e.href ? (
          <Link href={e.href} className="text-graphite decoration-clay decoration-2 underline-offset-4 hover:underline">
            {e.label}
          </Link>
        ) : (
          <span className="text-graphite">{e.label}</span>
        );
        return (
          <li
            key={e.id}
            className={cn(
              "grid gap-x-6 gap-y-0.5 border-t border-border py-3 first:border-t-0",
              compact ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[9rem_10rem_1fr]",
            )}
          >
            {!compact && <span className={cn(MONO.label, "text-muted-foreground tabular-nums sm:pt-0.5")}>{when(e.at)}</span>}
            {!compact && <span className="text-sm text-muted-foreground">{AREA_LABELS[e.area]}</span>}
            <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-graphite">{e.actor}</span> {e.action} {label}
            </p>
            {compact && <span className={cn(MONO.label, "text-muted-foreground tabular-nums")}>{when(e.at)}</span>}
          </li>
        );
      })}
    </ul>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ARROW, LINK_ARROW, MONO } from "@/components/site/section";
import { cn } from "@/lib/utils";
import type { IntroRow } from "@/lib/portal/intros";

/*
  INTROS ON PROFILE — who you asked, and who asked you (lib/portal/intros.ts).
  The emails carry the conversation; this is the record, so an intro isn't
  lost once it's read. Never the note: it isn't stored.
*/

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric" }).format(new Date(iso));

export function IntrosCard({ intros }: { intros: IntroRow[] }) {
  return (
    <section aria-labelledby="intros-title" className="border border-border bg-bone-light p-6 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="intros-title" className={cn(MONO.label, "text-muted-foreground")}>
          Intros
        </h2>
        <Link href="/portal/directory" className={cn("text-sm", LINK_ARROW)}>
          Directory
          <ArrowRight aria-hidden="true" className={ARROW.internal} />
        </Link>
      </div>
      {intros.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          None yet. Find someone in the directory and ask for an intro — we email them your note, and their reply comes straight to you.
        </p>
      ) : (
        <ul className="mt-3">
          {intros.map((r) => {
            const name = r.listed ? (
              <Link href={`/portal/directory?m=${r.otherId}`} className="font-medium text-graphite underline decoration-clay decoration-1 underline-offset-2">
                {r.otherName}
              </Link>
            ) : (
              <span className="font-medium text-graphite">{r.otherName}</span>
            );
            return (
              <li key={`${r.direction}-${r.otherId}-${r.at}`} className="flex items-baseline justify-between gap-4 border-t border-border py-2.5 text-sm first:border-t-0">
                <span className="text-muted-foreground">{r.direction === "sent" ? <>You asked {name} for an intro</> : <>{name} asked to meet you</>}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{day(r.at)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[13px] text-muted-foreground">Replies go by email. Didn&rsquo;t get one? A nudge in person on the floor works too.</p>
    </section>
  );
}

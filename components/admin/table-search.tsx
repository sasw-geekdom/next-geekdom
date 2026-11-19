"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/*
  A LIST'S SEARCH BOX (Vercel's list filter) — ADMIN ONLY. Types into the
  address (`?q=`), so a filtered view can be shared and the server page
  does the filtering; every other parameter (tab, sort) is kept. Waits a
  beat after typing so each keystroke isn't a request; Escape clears.
*/
export function TableSearch({ placeholder, className }: { placeholder: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = React.useState(params.get("q") ?? "");
  const timer = React.useRef<number | undefined>(undefined);

  function push(next: string) {
    const sp = new URLSearchParams(params.toString());
    if (next.trim()) sp.set("q", next.trim());
    else sp.delete("q");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function change(next: string) {
    setValue(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => push(next), 250);
  }

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
      <input
        type="search"
        value={value}
        onChange={(e) => change(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            change("");
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 w-full border border-border bg-bone-light pr-8 pl-8 text-sm text-graphite placeholder:text-muted-foreground focus-visible:border-graphite focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => change("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-1.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-graphite"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

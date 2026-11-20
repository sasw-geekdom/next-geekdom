"use client";

import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_LABEL } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import { sendTestEmail } from "@/lib/admin/email-actions";

/*
  THE EMAILS SCREEN (app/portal/admin/emails): the list on the left, grouped
  by when they go out; the chosen email on the right — who gets it, when,
  the subject and preview line as an inbox shows them, then the email itself
  in a sandboxed frame (its links don't navigate the admin), at desktop or
  phone width. `?e=<key>` keeps the choice in the address.
*/

export interface EmailView {
  key: string;
  group: string;
  title: string;
  to: string;
  when: string;
  subject: string;
  preheader: string;
  html: string;
}

export function EmailsBrowser({ emails, groups, initialKey }: { emails: EmailView[]; groups: string[]; initialKey?: string }) {
  const [key, setKey] = React.useState(() => (emails.some((e) => e.key === initialKey) ? initialKey : emails[0]?.key));
  const [width, setWidth] = React.useState<"desktop" | "phone">("desktop");
  const [result, setResult] = React.useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = React.useTransition();
  const current = emails.find((e) => e.key === key) ?? emails[0];

  function pick(k: string) {
    setKey(k);
    setResult(null);
    const url = new URL(window.location.href);
    url.searchParams.set("e", k);
    window.history.replaceState(window.history.state, "", url);
  }

  if (!current) return <p className="text-sm text-muted-foreground">No emails.</p>;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      {/* The list, grouped by when they go out. */}
      <nav aria-label="Emails" className="border border-border bg-bone-light lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
        {groups.map((g) => {
          const items = emails.filter((e) => e.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="border-b border-border last:border-b-0">
              <p className={cn(ADMIN_LABEL, "px-4 pb-1 pt-3 text-muted-foreground")}>{g}</p>
              <ul className="pb-2">
                {items.map((e) => (
                  <li key={e.key}>
                    <button
                      type="button"
                      onClick={() => pick(e.key)}
                      aria-current={e.key === current.key ? "true" : undefined}
                      className={cn(
                        "block w-full border-l-2 px-4 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-clay",
                        e.key === current.key ? "border-clay bg-bone font-medium text-graphite" : "border-transparent text-graphite/80 hover:bg-bone hover:text-graphite",
                      )}
                    >
                      {e.title}
                      <span className="block text-[12px] font-normal text-muted-foreground">To: {e.to}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* The chosen email. */}
      <section aria-labelledby="email-title" className="min-w-0 border border-border bg-bone-light">
        <div className="border-b border-border p-5">
          <h2 id="email-title" className="text-lg font-medium text-graphite">
            {current.title}
          </h2>
          <dl className="mt-3 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted-foreground">Goes to</dt>
            <dd className="text-graphite">{current.to}</dd>
            <dt className="text-muted-foreground">Sent when</dt>
            <dd className="text-graphite">{current.when}</dd>
          </dl>
          {/* As an inbox lists it. */}
          <div className="mt-4 border border-border bg-bone px-4 py-3">
            <p className="text-[12px] text-muted-foreground">In their inbox</p>
            <p className="mt-1 truncate text-sm">
              <span className="font-medium text-graphite">Geekdom</span> <span className="text-graphite">· {current.subject}</span>
            </p>
            <p className="truncate text-[13px] text-muted-foreground">{current.preheader}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div role="radiogroup" aria-label="Preview width" className="inline-flex border border-border bg-bone">
              {(["desktop", "phone"] as const).map((w, i) => (
                <button
                  key={w}
                  type="button"
                  role="radio"
                  aria-checked={width === w}
                  onClick={() => setWidth(w)}
                  className={cn("inline-flex h-8 items-center gap-1.5 px-3 text-[13px] font-medium", i > 0 && "border-l border-border", width === w ? "bg-graphite text-bone" : "text-muted-foreground hover:text-graphite")}
                >
                  {w === "desktop" ? <Monitor aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} /> : <Smartphone aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.7} />}
                  {w === "desktop" ? "Desktop" : "Phone"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-graphite" : "text-geekdom-red")}>
                  {result.message}
                </p>
              )}
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => setResult(await sendTestEmail(current.key)))}>
                {pending ? "Sending…" : "Send a test to me"}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-center bg-bone p-4 sm:p-6">
          {/* Sandboxed: the email's own links don't take over the admin. Sample names and dates. */}
          <iframe
            key={current.key + width}
            title={`Preview: ${current.title}`}
            srcDoc={current.html}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className={cn("h-[760px] border border-border bg-white", width === "phone" ? "w-[390px]" : "w-full max-w-[720px]")}
          />
        </div>
        <p className="border-t border-border px-5 py-3 text-[13px] text-muted-foreground">Names, dates and amounts are samples. The real email fills in the person&rsquo;s own details.</p>
      </section>
    </div>
  );
}

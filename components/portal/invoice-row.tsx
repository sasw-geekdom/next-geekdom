import * as React from "react";
import { cn } from "@/lib/utils";
import type { BillingInvoice } from "@/lib/stripe/billing";

/*
  ONE INVOICE ROW — shared by the member's billing drawer (billing-live.tsx)
  and staff's Billing history in a member's slide-out (members-manager.tsx),
  so the two always describe a bill the same way.

  AN INVOICE'S STATUS — a square marker and a word, the admin's convention
  in the brand's own colors (no green or blue here): Upcoming is Clay (on
  its way, nothing to do), Paid is Graphite, Due is Geekdom Red — the one
  that needs the member — and Void is hollow. Stripe sets the status;
  nobody labels an invoice by hand.
*/

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
export const monthOf = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "long", year: "numeric" }).format(new Date(iso));
export const dayOf = (iso: string) => new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric" }).format(new Date(iso));

export type Mark = "upcoming" | "paid" | "due" | "unpaid" | "void";
const MARKS: Record<Mark, [string, string]> = {
  upcoming: ["bg-clay", "Upcoming"],
  paid: ["bg-graphite", "Paid"],
  due: ["bg-geekdom-red", "Due"],
  unpaid: ["bg-geekdom-red", "Unpaid"],
  void: ["border border-muted-foreground", "Void"],
};

export const invoiceMark = (status: BillingInvoice["status"]): Mark =>
  status === "paid" ? "paid" : status === "open" ? "due" : status === "void" ? "void" : "unpaid";

export const invoiceWhen = (inv: BillingInvoice, mark: Mark) =>
  mark === "paid" ? `Paid ${shortDate(inv.date)}` : mark === "void" ? "Voided" : `Issued ${shortDate(inv.date)}`;

export function InvoiceRow({ title, mark, detail, amount, when, children }: { title: string; mark: Mark; detail: string; amount: string; when: string; children?: React.ReactNode }) {
  const [dot, word] = MARKS[mark];
  return (
    <li className="flex items-start justify-between gap-4 border-t border-border py-4 first:border-t-0">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-graphite">{title}</span>
          <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-sm", mark === "due" || mark === "unpaid" ? "text-geekdom-red" : "text-graphite")}>
            <span aria-hidden="true" className={cn("h-2 w-2 shrink-0", dot)} />
            {word}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        {children && <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div>}
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular-nums text-graphite">{amount}</p>
        <p className="mt-1 text-sm tabular-nums text-muted-foreground">{when}</p>
      </div>
    </li>
  );
}

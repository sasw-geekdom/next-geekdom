import { Download, ExternalLink } from "lucide-react";
import { listMembers } from "@/lib/admin/queries";
import { MemberBadge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { formatDate } from "@/lib/format";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const members = await listMembers();
  const active = members.filter(
    (m) => m.status === "active" || m.status === "trialing",
  ).length;

  return (
    <>
      <PageHeader
        title="Members"
        description={`${active} active · ${members.length} total`}
        actions={
          /*
            A plain <a>, not <Link>. This is a file download from a route
            handler, not a page: client-side navigation would fetch the CSV as
            an RSC payload and hand back nothing. The rule can't tell the
            difference because the path is a static string — the sibling export
            on the applications page builds its href in a template literal and
            slips past the same check.
          */
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/api/admin/export/members"
            className={buttonClass("outline", "sm", "border-border bg-white")}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
            Export CSV
          </a>
        }
      />

      <AdminSection>
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No members yet. A member appears here once Stripe confirms their
              first payment.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <ul className="divide-y divide-border">
              {members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:gap-4"
                >
                  <div className="min-w-0 md:flex-1">
                    <p className="truncate font-medium text-ink">
                      {member.name}
                    </p>
                    <a
                      href={`mailto:${member.email}`}
                      className="truncate text-sm text-muted-foreground hover:text-rust"
                    >
                      {member.email}
                    </a>
                  </div>

                  <div className="md:w-40">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Joined
                    </p>
                    <p className="text-sm tabular-nums text-ink">
                      {formatDate(member.joinedAt)}
                    </p>
                  </div>

                  <div className="md:w-44">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {member.cancelAtPeriodEnd ? "Ends" : "Renews"}
                    </p>
                    <p className="text-sm tabular-nums text-ink">
                      {member.currentPeriodEnd
                        ? formatDate(member.currentPeriodEnd)
                        : "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 md:w-44 md:justify-end">
                    {member.cancelAtPeriodEnd && (
                      <span className="text-xs text-muted-foreground">
                        Canceling
                      </span>
                    )}
                    <MemberBadge status={member.status} />
                    {/*
                      Deep link into Stripe. Billing changes — refunds, comps,
                      plan edits — belong in Stripe's own UI, which already has
                      the audit trail and the permissions model. Rebuilding a
                      slice of it here would just be a second place to get it
                      wrong.
                    */}
                    <a
                      href={`https://dashboard.stripe.com/customers/${member.stripeCustomerId}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      title="Open in Stripe"
                      className="text-muted-foreground transition-colors hover:text-rust"
                    >
                      <ExternalLink className="h-4 w-4" strokeWidth={1.7} />
                      <span className="sr-only">
                        Open {member.name} in Stripe
                      </span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </AdminSection>
    </>
  );
}

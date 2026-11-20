import Link from "next/link";
import { Download, Send } from "lucide-react";
import { listMembers } from "@/lib/admin/queries";
import { loginStates } from "@/lib/admin/member-logins";
import { readPerkTags } from "@/lib/perks-server";
import { MembersManager, type MemberRow } from "@/components/admin/members-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";

export const metadata = { title: "Members" };

/**
 * The member roster: search, filters, "Add a member", and a slide-out per
 * member (components/admin/members-manager.tsx). Billing edits — refunds,
 * comps, plan changes — stay in Stripe, linked from each Stripe-billed record.
 */
export default async function MembersPage(props: PageProps<"/portal/admin/members">) {
  const { add, view } = await props.searchParams;
  const me = await requireAdmin();
  const money = can(me.role, "members.money");
  const exports = can(me.role, "data.export");
  const [members, logins, perks] = await Promise.all([
    listMembers(),
    // Firebase being slow or down shouldn't take the roster with it.
    loginStates().catch(() => new Map()),
    readPerkTags().catch(() => []),
  ]);
  const rows: MemberRow[] = members.map((m) => ({
    ...m,
    login: logins.get(m.email) ?? { state: "none" },
  }));
  const active = members.filter(
    (m) => m.status === "active" || m.status === "trialing" || m.status === "past_due",
  ).length;

  return (
    <>
      <PageHeader
        title="Members"
        description={`${active} current · ${members.length - active} former`}
        actions={
          <div className="flex flex-wrap gap-2">
            {/*
              THE LAUNCH INVITATIONS live here, not in the sidebar: they're for
              the members who joined before the workflow existed
              (lib/invitations.ts).
            */}
            {money && (
              <Link href="/portal/admin/members/invitations" className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
                <Send className="h-3.5 w-3.5" strokeWidth={1.8} />
                Invitations
              </Link>
            )}
            {/*
              A plain <a>, not <Link>: a file download from a route handler.
              Client-side navigation would fetch the CSV as an RSC payload.
            */}
            {exports && (
              // eslint-disable-next-line @next/next/no-html-link-for-pages
              <a href="/api/admin/export/members" className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
                <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
                Export CSV
              </a>
            )}
          </div>
        }
      />
      <AdminSection>
        <MembersManager members={rows} perks={perks} canManageMoney={money} startAdding={add === "1"} startView={typeof view === "string" ? view : undefined} />
      </AdminSection>
    </>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listMembers } from "@/lib/admin/queries";
import { loginStates } from "@/lib/admin/member-logins";
import { InvitationsManager, type InviteRow } from "@/components/admin/invitations-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";

export const metadata = { title: "Invitations" };

const CURRENT = ["active", "trialing", "past_due"];

/**
 * THE LAUNCH INVITATIONS — pick a wave, see the email, send a preview.
 * Real sending is locked until launch (lib/invitations.ts).
 */
export default async function InvitationsPage() {
  const [members, logins] = await Promise.all([listMembers(), loginStates().catch(() => new Map())]);
  const rows: InviteRow[] = members
    .filter((m) => CURRENT.includes(m.status))
    .map((m) => {
      const login = logins.get(m.email);
      return {
        id: m.id,
        name: m.name,
        email: m.email,
        tags: m.tags,
        invitedAt: m.portalInvitedAt,
        signedIn: login?.state === "active",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const invited = rows.filter((r) => r.invitedAt).length;
  const signedIn = rows.filter((r) => r.signedIn).length;

  return (
    <>
      <PageHeader
        title="Invitations"
        description={`${rows.length} current members · ${invited} invited · ${signedIn} signed in`}
      />
      <AdminSection>
        <Link href="/portal/admin/members" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-graphite">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
          Members
        </Link>
        <InvitationsManager rows={rows} />
      </AdminSection>
    </>
  );
}

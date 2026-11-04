import { readMemberResources, FAQ_GROUPS } from "@/lib/content/member-resources";
import { MemberResourcesManager } from "@/components/admin/member-resources-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";

export const metadata = { title: "Member resources" };

/**
 * MEMBER RESOURCES — the member portal's basics, edited by staff instead of a
 * developer: the Slack invite (the dashboard tile), the Wi-Fi, the hours,
 * the resource links and the FAQ on /portal/resources.
 */
export default async function AdminResourcesPage() {
  const resources = await readMemberResources();
  return (
    <>
      <PageHeader
        eyebrow="Members"
        title="Member resources"
        description={
          resources.saved
            ? "What members see on FAQ & resources, and the dashboard's Slack tile."
            : "What members see on FAQ & resources, and the dashboard's Slack tile. Showing the portal's starting text until the first save."
        }
      />
      <AdminSection>
        <MemberResourcesManager resources={resources} groups={FAQ_GROUPS} />
      </AdminSection>
    </>
  );
}

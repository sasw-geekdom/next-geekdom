import { readMemberResources, FAQ_GROUPS, faqForMembers } from "@/lib/content/member-resources";
import { MemberResourcesManager } from "@/components/admin/member-resources-manager";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

export const metadata = { title: "Member resources" };

/**
 * MEMBER RESOURCES — the member portal's basics, edited by staff instead of a
 * developer: the Slack invite (the dashboard tile), the Wi-Fi, the hours,
 * the resource links and the FAQ on /portal/resources.
 */
export default async function AdminResourcesPage() {
  const resources = await readMemberResources();
  // The answers members read that are built from other fields (the Wi-Fi question), by id.
  const autoAnswers = Object.fromEntries(
    faqForMembers(resources)
      .filter((f, i) => f.a !== resources.faq[i].a)
      .map((f) => [f.id, f.a]),
  );
  return (
    <>
      <PageHeader
        title="Member resources"
        description={
          resources.saved
            ? "What members see on FAQ & resources, and the dashboard's Slack tile."
            : "What members see on FAQ & resources, and the dashboard's Slack tile. Showing the portal's starting text until the first save."
        }
        actions={
          <Link href="/portal/resources" target="_blank" className={buttonClass("outline", "sm", "border-border bg-bone-light")}>
            See it as a member
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.8} />
          </Link>
        }
      />
      <AdminSection>
        <MemberResourcesManager resources={resources} groups={FAQ_GROUPS} autoAnswers={autoAnswers} />
      </AdminSection>
    </>
  );
}

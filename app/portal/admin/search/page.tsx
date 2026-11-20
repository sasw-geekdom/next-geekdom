import { listApplications, listMembers } from "@/lib/admin/queries";
import { listInquiries } from "@/lib/admin/inquiries";
import { normalizeApplicationStatus } from "@/lib/firebase/collections";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { tableDate } from "@/components/admin/admin-ui";
import { AdminSearch, type SearchRow } from "@/components/admin/admin-search";

export const metadata = { title: "Search" };

/*
  SEARCH ACROSS THE ADMIN (Jesse, November 2026) — one box for a person,
  wherever they are: members, applications, event and Studio requests.
  The three lists are read once here, slimmed to what's searched and shown,
  and filtered AS YOU TYPE in the browser (components/admin/admin-search.tsx)
  — a few hundred rows, like Members' own list. "/" anywhere in the admin
  opens it (portal-shell). The admin layout checks the role.
*/
export default async function AdminSearchPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { q } = await props.searchParams;
  const [members, applications, requests] = await Promise.all([
    listMembers().catch(() => []),
    listApplications({ limit: 2000 }).catch(() => []),
    listInquiries(1000).catch(() => []),
  ]);

  const m: SearchRow[] = members.map((x) => ({
    id: x.id,
    name: x.name,
    email: x.email,
    extra: x.company ?? "",
    href: `/portal/admin/members?m=${x.id}`,
    meta: `Joined ${tableDate(x.joinedAt)}`,
    status: { kind: "member", value: x.status },
  }));
  const a: SearchRow[] = applications.map((x) => ({
    id: x.id,
    name: x.name,
    email: x.email,
    extra: [x.company, x.city].filter(Boolean).join(" "),
    href: `/portal/admin/applications/${x.id}`,
    meta: `Applied ${tableDate(x.createdAt)}`,
    status: { kind: "application", value: normalizeApplicationStatus(x.status) },
  }));
  const r: SearchRow[] = requests.map((x) => ({
    id: x.id,
    name: [x.company, x.name].filter(Boolean).join(" · "),
    email: x.email,
    extra: [x.company, x.name].filter(Boolean).join(" "),
    href: `/portal/admin/requests/${x.id}`,
    meta: x.kind === "event" ? "Event request" : "Studio partner",
    status: { kind: "request", value: x.status },
  }));

  return (
    <>
      <PageHeader title="Search" description="Members, applications and requests — by name, email or company." />
      <AdminSection>
        <AdminSearch initial={typeof q === "string" ? q : ""} members={m} applications={a} requests={r} />
      </AdminSection>
    </>
  );
}

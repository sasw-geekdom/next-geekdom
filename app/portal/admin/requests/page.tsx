import { listInquiries } from "@/lib/admin/inquiries";
import { INQUIRY_COPY, INQUIRY_KINDS, INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, type InquiryKind, type InquiryStatus } from "@/lib/inquiries";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { InquiryStatusLabel, RowLink, Segments, Table, Tabs, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";

export const metadata = { title: "Requests" };

/*
  REQUESTS — event requests (/club) and Studio partner requests (/studio),
  one review step each. Two tabs by kind, then status chips with counts,
  opening on what's New. One read, filtered here (no composite index).
*/
export default async function InquiriesPage(props: PageProps<"/portal/admin/requests">) {
  const params = await props.searchParams;
  const kind: InquiryKind = INQUIRY_KINDS.includes(params.kind as InquiryKind) ? (params.kind as InquiryKind) : "event";
  const status: InquiryStatus | "all" =
    params.status === "all" ? "all" : INQUIRY_STATUSES.includes(params.status as InquiryStatus) ? (params.status as InquiryStatus) : "new";

  const all = await listInquiries().catch(() => []);
  const ofKind = all.filter((i) => i.kind === kind);
  const shown = status === "all" ? ofKind : ofKind.filter((i) => i.status === status);
  const newCount = (k: InquiryKind) => all.filter((i) => i.kind === k && i.status === "new").length;

  const href = (k: InquiryKind, st: InquiryStatus | "all") => `/portal/admin/requests?kind=${k}&status=${st}`;
  const showStatus = status === "all";

  return (
    <>
      <PageHeader
        title="Requests"
        description={`${newCount("event")} new event ${newCount("event") === 1 ? "request" : "requests"} · ${newCount("partner")} new Studio partner ${newCount("partner") === 1 ? "request" : "requests"}`}
      />
      <AdminSection>
        <Tabs
          label="Kind"
          items={INQUIRY_KINDS.map((k) => ({ href: href(k, "new"), label: INQUIRY_COPY[k].label, count: newCount(k) || undefined, active: kind === k }))}
        />

        <Segments
          label="Filter by status"
          className="mt-5"
          items={[...INQUIRY_STATUSES, "all" as const].map((s) => ({
            href: href(kind, s),
            label: s === "all" ? "All" : INQUIRY_STATUS_LABELS[s],
            count: s === "all" ? ofKind.length : ofKind.filter((i) => i.status === s).length,
            active: status === s,
          }))}
        />

        {shown.length === 0 ? (
          <p className="mt-6 border border-dashed border-border bg-bone-light px-6 py-16 text-center text-sm text-muted-foreground">
            {status === "new"
              ? `Nothing new. ${kind === "event" ? "Requests from /club's “Host an event”" : "Notes from /studio's corporate-partner form"} land here.`
              : "Nothing here."}
          </p>
        ) : (
          <Table className="mt-6">
            <thead>
              <tr>
                <Th>Company</Th>
                <Th className="hidden w-[18%] md:table-cell">Contact</Th>
                <Th className="hidden w-[22%] lg:table-cell">Email</Th>
                <Th className="hidden w-[24%] md:table-cell">{kind === "event" ? "Event" : "Interest"}</Th>
                <Th className="w-28">Received</Th>
                {showStatus && <Th className="w-32">Status</Th>}
              </tr>
            </thead>
            <tbody>
              {shown.map((i) => (
                <Tr key={i.id}>
                  <Td>
                    <RowLink href={`/portal/admin/requests/${i.id}?kind=${kind}&status=${status}`}>{i.company}</RowLink>
                  </Td>
                  <Td className="hidden md:table-cell">{i.name}</Td>
                  <Td className="hidden text-muted-foreground lg:table-cell">{i.email}</Td>
                  <Td className="hidden text-muted-foreground md:table-cell">
                    {kind === "event" ? [i.eventType, i.headcount, i.when].filter(Boolean).join(" · ") : i.interest}
                  </Td>
                  <Td className="tabular-nums text-muted-foreground">{tableDate(i.createdAt)}</Td>
                  {showStatus && (
                    <Td>
                      <InquiryStatusLabel status={i.status} />
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </AdminSection>
    </>
  );
}

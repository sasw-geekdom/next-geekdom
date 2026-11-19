import { listInquiries, type Inquiry } from "@/lib/admin/inquiries";
import { upcomingEventHolds, type Booking } from "@/lib/rooms/rooms";
import { centralDay, dayLabel } from "@/lib/rooms/rules";
import { TableSearch } from "@/components/admin/table-search";
import { INQUIRY_COPY, INQUIRY_KINDS, INQUIRY_STATUSES, INQUIRY_STATUS_LABELS, type InquiryKind, type InquiryStatus } from "@/lib/inquiries";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { InquiryStatusLabel, RowLink, Segments, Table, Tabs, Td, Th, Tr, tableDate } from "@/components/admin/admin-ui";

export const metadata = { title: "Requests" };

/*
  REQUESTS — event requests (/club) and Studio partner requests (/studio),
  one review step each. Two tabs by kind, then status chips with counts,
  opening on what's New. One read, filtered here (no composite index).

  THE APPLICATIONS LIST'S CONVENTIONS (Vercel's lists): ONE "Requester"
  cell — the company, then the contact and what they asked for beneath —
  a PROGRESS cell (New: not answered yet; an accepted event: the room
  held for it, or "No room held yet"; an accepted partner: talking;
  declined), WAITING (days since it came in) while it's new, and SEARCH
  (`?q=`, company/name/email) beside the status chips.
*/
export default async function InquiriesPage(props: PageProps<"/portal/admin/requests">) {
  const params = await props.searchParams;
  const kind: InquiryKind = INQUIRY_KINDS.includes(params.kind as InquiryKind) ? (params.kind as InquiryKind) : "event";
  const status: InquiryStatus | "all" =
    params.status === "all" ? "all" : INQUIRY_STATUSES.includes(params.status as InquiryStatus) ? (params.status as InquiryStatus) : "new";
  const q = (typeof params.q === "string" ? params.q : "").trim();
  const now = new Date().getTime();

  const [everything, holds] = await Promise.all([
    listInquiries().catch(() => []),
    upcomingEventHolds(now).catch(() => new Map<string, Booking[]>()),
  ]);
  const needle = q.toLowerCase();
  const all = needle ? everything.filter((i) => [i.company, i.name, i.email].some((v) => v?.toLowerCase().includes(needle))) : everything;
  const ofKind = all.filter((i) => i.kind === kind);
  const shown = status === "all" ? ofKind : ofKind.filter((i) => i.status === status);
  const newCount = (k: InquiryKind) => everything.filter((i) => i.kind === k && i.status === "new").length;

  const withQ = (path: string) => (q ? `${path}&q=${encodeURIComponent(q)}` : path);
  const href = (k: InquiryKind, st: InquiryStatus | "all") => withQ(`/portal/admin/requests?kind=${k}&status=${st}`);
  const showStatus = status === "all";
  const waitingTab = status === "new";

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

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Segments
            label="Filter by status"
            items={[...INQUIRY_STATUSES, "all" as const].map((s) => ({
              href: href(kind, s),
              label: s === "all" ? "All" : INQUIRY_STATUS_LABELS[s],
              count: s === "all" ? ofKind.length : ofKind.filter((i) => i.status === s).length,
              active: status === s,
            }))}
          />
          <TableSearch placeholder="Search company, name, email…" className="w-full md:w-72" />
        </div>

        {shown.length === 0 ? (
          <p className="mt-6 border border-dashed border-border bg-bone-light px-6 py-16 text-center text-sm text-muted-foreground">
            {q
              ? `No ${INQUIRY_COPY[kind].label.toLowerCase()} match “${q}”.`
              : status === "new"
                ? `Nothing new. ${kind === "event" ? "Requests from /club's “Host an event”" : "Notes from /studio's corporate-partner form"} land here.`
                : "Nothing here."}
          </p>
        ) : (
          <>
            {q && (
              <p className="mt-4 text-[13px] text-muted-foreground">
                {shown.length} {shown.length === 1 ? "match" : "matches"} for “{q}”
              </p>
            )}
            <Table className={q ? "mt-2" : "mt-6"}>
              <thead>
                <tr>
                  <Th>Requester</Th>
                  <Th className="hidden w-64 sm:table-cell">Progress</Th>
                  {showStatus && <Th className="hidden w-32 md:table-cell">Status</Th>}
                  <Th className="w-28" align="right">
                    {waitingTab ? "Waiting" : "Received"}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((i) => {
                  const days = Math.floor((now - Date.parse(i.createdAt)) / 86_400_000);
                  const asked = kind === "event" ? [i.eventType, i.headcount && `${i.headcount} people`, i.when].filter(Boolean).join(" · ") : i.interest;
                  return (
                    <Tr key={i.id} className="h-14">
                      <Td>
                        <RowLink href={withQ(`/portal/admin/requests/${i.id}?kind=${kind}&status=${status}`)}>{i.company}</RowLink>
                        <span className="block truncate text-[13px] text-muted-foreground">{[i.name, asked].filter(Boolean).join(" · ")}</span>
                      </Td>
                      <Td className="hidden sm:table-cell">
                        <Progress inquiry={i} holds={holds.get(i.id) ?? []} />
                      </Td>
                      {showStatus && (
                        <Td className="hidden md:table-cell">
                          <InquiryStatusLabel status={i.status} />
                        </Td>
                      )}
                      <Td align="right" className="tabular-nums text-muted-foreground">
                        {waitingTab ? <span title={`Received ${tableDate(i.createdAt)}`}>{days <= 0 ? "Today" : `${days} ${days === 1 ? "day" : "days"}`}</span> : tableDate(i.createdAt)}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </>
        )}
      </AdminSection>
    </>
  );
}

/** Where a request is, in one cell. An accepted event's next step is a room, so it says whether one's held. */
function Progress({ inquiry, holds }: { inquiry: Inquiry; holds: Booking[] }) {
  const muted = (t: string) => <span className="text-muted-foreground">{t}</span>;
  if (inquiry.status === "new") return muted("Not answered yet");
  if (inquiry.status === "declined") return muted("Declined");
  if (inquiry.kind === "partner") return <span>Accepted — talking</span>;
  if (!holds.length) return <span>Accepted · no room held yet</span>;
  const h = holds[0];
  return (
    <span>
      Room held <span className="text-muted-foreground">· {h.roomName} · {dayLabel(centralDay(h.start)).split(", ")[1]}{holds.length > 1 ? ` +${holds.length - 1}` : ""}</span>
    </span>
  );
}

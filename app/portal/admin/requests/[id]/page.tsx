import { notFound } from "next/navigation";
import { getInquiry, listInquiries } from "@/lib/admin/inquiries";
import { INQUIRY_COPY, INQUIRY_STATUS_LABELS } from "@/lib/inquiries";
import { InquiryStatusLabel, tableDate } from "@/components/admin/admin-ui";
import { InquiryPanel } from "@/components/admin/inquiry-panel";
import { Answer, AnswerGroup, MailLink, Properties, ReviewBody, ReviewHeader, SideCard, Timeline } from "@/components/admin/review-layout";
import { inquiryPosition, inquiryQuery, parseInquiryQueue } from "@/lib/admin/review-queue";

export async function generateMetadata(props: PageProps<"/portal/admin/requests/[id]">) {
  const { id } = await props.params;
  return { title: (await getInquiry(id))?.company ?? "Request" };
}

/*
  ONE REQUEST, in the application's layout (components/admin/review-layout.tsx):
  the request on the left, the decision, notes, contact and history on the
  right, Previous / Next through the list it came from.
*/
export default async function RequestPage(props: PageProps<"/portal/admin/requests/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const [i, all] = await Promise.all([getInquiry(id), listInquiries().catch(() => [])]);
  if (!i) notFound();
  const copy = INQUIRY_COPY[i.kind];

  const queue = parseInquiryQueue(params, { kind: i.kind, status: i.status });
  const qs = inquiryQuery(queue);
  const pos = inquiryPosition(all, queue, id);
  const at = (x: string | null | undefined) => (x ? `/portal/admin/requests/${x}?${qs}` : null);
  const listHref = `/portal/admin/requests?${qs}`;
  const afterHref = at(pos?.next) ?? at(pos?.prev) ?? listHref;
  const done = typeof params.done === "string" ? params.done : null;

  const request: [string, string | null | undefined][] =
    i.kind === "event"
      ? [
          ["What kind of event", i.eventType],
          ["How many people", i.headcount],
          ["When", i.when],
          ["Anything else", i.details],
        ]
      : [
          ["What they're interested in", i.interest],
          ["What they said", i.details],
        ];

  return (
    <>
      <ReviewHeader
        crumbs={[
          { href: `/portal/admin/requests?kind=${i.kind}`, label: copy.label },
          { href: listHref, label: queue.status === "all" ? "All" : INQUIRY_STATUS_LABELS[queue.status] },
        ]}
        title={i.company}
        meta={[i.name, i.kind === "event" ? i.eventType : "Studio partner", `Received ${tableDate(i.createdAt)}`]}
        status={<InquiryStatusLabel status={i.status} />}
        pager={pos && { index: pos.index, total: pos.total, prevHref: at(pos.prev), nextHref: at(pos.next), noun: "request" }}
        flash={done}
      />
      <ReviewBody
        main={
          <AnswerGroup title={i.kind === "event" ? "The event" : "The partnership"}>
            {request
              .filter(([, v]) => v?.trim())
              .map(([q, v]) => (
                <Answer key={q} question={q}>
                  {v}
                </Answer>
              ))}
          </AnswerGroup>
        }
        side={
          <>
            <InquiryPanel key={i.id} inquiry={i} accept={copy.accept} decline={copy.decline} afterHref={afterHref} />
            <SideCard title="Contact">
              <Properties
                rows={[
                  ["Name", i.name],
                  ["Company", i.company],
                  ["Email", <MailLink key="e" email={i.email} />],
                ]}
              />
            </SideCard>
            <SideCard title="History">
              <Timeline
                steps={[
                  { what: `${i.name} sent it`, when: i.createdAt },
                  ...i.decisions.map((d) => ({ what: `${d.by} ${d.outcome}`, when: d.at, note: d.note })),
                ]}
              />
            </SideCard>
          </>
        }
      />
    </>
  );
}

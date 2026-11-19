import { notFound } from "next/navigation";
import { getInquiry, listInquiries } from "@/lib/admin/inquiries";
import { INQUIRY_COPY, INQUIRY_STATUS_LABELS } from "@/lib/inquiries";
import { InquiryStatusLabel, tableDate } from "@/components/admin/admin-ui";
import { InquiryPanel } from "@/components/admin/inquiry-panel";
import { Answer, AnswerGroup, MailLink, Properties, ReviewBody, ReviewHeader, SideCard, Timeline } from "@/components/admin/review-layout";
import { inquiryPosition, inquiryQuery, parseInquiryQueue } from "@/lib/admin/review-queue";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { holdsForInquiry } from "@/lib/rooms/rooms";
import { centralDay, dayLabel, timeLabel } from "@/lib/rooms/rules";

export async function generateMetadata(props: PageProps<"/portal/admin/requests/[id]">) {
  const { id } = await props.params;
  return { title: (await getInquiry(id))?.company ?? "Request" };
}

/*
  ONE REQUEST, in the application's layout (components/admin/review-layout.tsx):
  the request on the left, the decision, notes, contact and history on the
  right, Previous / Next through the list it came from. An EVENT request
  also shows the rooms held for it (lib/rooms — a block linked by
  `heldFor.inquiryId`) and "Hold a room", which opens the Rooms page's
  block form already linked to this request.
*/
export default async function RequestPage(props: PageProps<"/portal/admin/requests/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const [i, all] = await Promise.all([getInquiry(id), listInquiries().catch(() => [])]);
  if (!i) notFound();
  const copy = INQUIRY_COPY[i.kind];
  const holds = i.kind === "event" ? await holdsForInquiry(i.id, new Date().getTime()).catch(() => []) : [];

  const queue = parseInquiryQueue(params, { kind: i.kind, status: i.status });
  const qs = inquiryQuery(queue);
  const pos = inquiryPosition(all, queue, id);
  const at = (x: string | null | undefined) => (x ? `/portal/admin/requests/${x}?${qs}` : null);
  const listHref = `/portal/admin/requests?${qs}`;
  const afterHref = at(pos?.next) ?? at(pos?.prev) ?? listHref;
  const done = typeof params.done === "string" ? params.done : null;

  // [the form's question, the answer, the SHORT LABEL the row shows] — as on an application.
  const request: [string, string | null | undefined, string][] =
    i.kind === "event"
      ? [
          ["What kind of event", i.eventType, "Type"],
          ["How many people", i.headcount, "People"],
          ["When", i.when, "When"],
          ["Anything else", i.details, "Anything else"],
        ]
      : [
          ["What they're interested in", i.interest, "Interested in"],
          ["What they said", i.details, "What they said"],
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
              .map(([q, v, label]) => (
                <Answer key={q} question={q} label={label}>
                  {v}
                </Answer>
              ))}
          </AnswerGroup>
        }
        side={
          <>
            <InquiryPanel
              key={i.id}
              inquiry={i}
              accept={copy.accept}
              decline={copy.decline}
              afterHref={afterHref}
              rooms={
                i.kind === "event" ? (
                  <SideCard title="Rooms">
                    {holds.length > 0 ? (
                      <ul className="mb-3 flex flex-col gap-2 text-sm">
                        {holds.map((h) => (
                          <li key={h.id}>
                            <Link href={`/portal/admin/rooms?day=${centralDay(h.start)}`} className="text-graphite underline decoration-clay decoration-1 underline-offset-2">
                              {h.roomName}, {dayLabel(centralDay(h.start))} · {timeLabel(h.start)} – {timeLabel(h.end)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-3 text-sm text-muted-foreground">No room held yet.</p>
                    )}
                    <Link href={`/portal/admin/rooms?inquiry=${i.id}`} className="inline-flex items-center gap-1.5 text-sm text-graphite underline decoration-clay decoration-1 underline-offset-2">
                      {holds.length ? "Hold another room" : "Hold a room"}
                      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </Link>
                  </SideCard>
                ) : undefined
              }
            />
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

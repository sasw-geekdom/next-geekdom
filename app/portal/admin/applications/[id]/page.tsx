import { notFound } from "next/navigation";
import { getApplication, listApplications } from "@/lib/admin/queries";
import { ApplicationStatusLabel, tableDate } from "@/components/admin/admin-ui";
import { APPLICATION_LABELS } from "@/components/ui/badge";
import { BanLink, ReviewPanel } from "@/components/admin/review-panel";
import { ResearchCard, ResearchProvider } from "@/components/admin/research-note";
import {
  Answer,
  AnswerGroup,
  hasLinks,
  LinkList,
  MailLink,
  Properties,
  ReviewBody,
  ReviewHeader,
  SideCard,
  Timeline,
} from "@/components/admin/review-layout";
import { applicationPosition, applicationQuery, parseApplicationQueue } from "@/lib/admin/review-queue";
import { planOf, planPrice } from "@/lib/membership";
import { Q } from "@/lib/application-questions";
import { isNothing } from "@/lib/linkify";

export async function generateMetadata(props: PageProps<"/portal/admin/applications/[id]">) {
  const { id } = await props.params;
  const application = await getApplication(id);
  return { title: application?.name ?? "Application" };
}

/*
  ONE APPLICATION — READ LEFT, WRITE RIGHT (components/admin/review-layout.tsx):
  what they wrote fills the centre, grouped by what decides it, in
  Geekdom's own wording (lib/application-questions.ts), "Who they are"
  first. The side column, which stays in view: the next step, then the
  WRITE-UP beside the answers it's about (the editor in research; the
  write-up, its recommendation and every link once it's with the team),
  then details and history.
  ResearchProvider wraps both columns so "Send to the team" can save the
  write-up first. Blank answers and empty
  details are left out rather than shown as dashes.
*/
export default async function ApplicationDetailPage(props: PageProps<"/portal/admin/applications/[id]">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const [application, all] = await Promise.all([getApplication(id), listApplications({ limit: 2000 }).catch(() => [])]);
  if (!application) notFound();

  // The queue it was opened from; from an email link, its own stage.
  const queue = parseApplicationQueue(params, application.status);
  const qs = applicationQuery(queue);
  const pos = applicationPosition(all, queue, id);
  const at = (x: string | null | undefined) => (x ? `/portal/admin/applications/${x}?${qs}` : null);
  const listHref = `/portal/admin/applications?${qs}`;
  // After a decision: the next one, else the one before (the last in a stage), else the list.
  const afterHref = at(pos?.next) ?? at(pos?.prev) ?? listHref;
  const done = typeof params.done === "string" ? params.done : null;

  const a = application;
  const plan = planOf(a.plan);
  // [Geekdom's question, the answer, the SHORT LABEL the row shows] — the
  // full question stays on hover (components/admin/review-layout.tsx, Answer).
  type Row = [string, React.ReactNode, string];
  const heard = [a.heardAbout, a.heardAboutOther].filter(Boolean).join(" — ");
  const groups: [string, Row[]][] = [
    [
      "Who they are",
      [
        [Q.brag, a.brag, "In one sentence"],
        [
          Q.describes,
          a.describes.length || a.describesOther ? (
            // One choice per line, plain text — no tags (Geekdom's options are
            // phrases, and boxed they stacked into a wall of white chips) and
            // no markers (a square read as a status nobody could explain).
            <ul className="flex flex-col gap-1.5 whitespace-normal">
              {[...a.describes.filter((d) => d !== "Other"), ...(a.describesOther ? [a.describesOther] : a.describes.includes("Other") ? ["Other"] : [])].map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          ) : null,
          "Describes themselves",
        ],
        [Q.building, a.building, "Building"],
        [Q.shipped, a.shipped, "Shipped, last 90 days"],
        // The site answer and the links answer, as one clickable list.
        [`${Q.site} · ${Q.links}`, hasLinks(a.website, a.links) ? <LinkList values={[a.website, a.links]} /> : null, "Links"],
        [Q.heardAbout, heard, "Heard about us"],
      ],
    ],
    [
      "Why Geekdom",
      [
        [Q.whyGeekdom, a.whyGeekdom, "Why Geekdom"],
        [Q.giveBack, a.giveBack, "Will give back"],
        [Q.excited, a.excited, "Next 6 months"],
      ],
    ],
    [
      "Anything else",
      [
        [Q.otherCommunities, a.otherCommunities, "Other communities"],
        [Q.anythingElse, a.anythingElse, "Anything else"],
      ],
    ],
  ];
  const answered = groups
    // A blank answer and an "N/A" say the same thing, so both rows are left out.
    .map(([title, rows]) => [title, rows.filter(([, v]) => (typeof v === "string" ? v.trim() && !isNothing(v) : v))] as const)
    .filter(([, rows]) => rows.length > 0);

  const details: [string, React.ReactNode][] = [
    ["Membership", `${plan.name} · ${planPrice(plan)}`],
    ["Email", <MailLink key="e" email={a.email} />],
    ...(a.phone ? ([["Phone", <a key="p" href={`tel:${a.phone}`} className="text-graphite">{a.phone}</a>]] as [string, React.ReactNode][]) : []),
    ...(a.city ? ([["City", a.city]] as [string, React.ReactNode][]) : []),
    ...(a.company ? ([["Company", a.company]] as [string, React.ReactNode][]) : []),
    ["Current member", a.formerMember ? "Yes" : "No"],
  ];

  return (
    <>
      <ReviewHeader
        crumbs={[
          { href: "/portal/admin/applications", label: "Applications" },
          { href: listHref, label: queue.status === "all" ? "All" : APPLICATION_LABELS[queue.status] },
        ]}
        title={a.name}
        meta={[plan.name, a.city, `Applied ${tableDate(a.createdAt)}`, a.source === "airtable" && "Imported from Airtable"]}
        status={<ApplicationStatusLabel status={a.status} />}
        pager={pos && { index: pos.index, total: pos.total, prevHref: at(pos.prev), nextHref: at(pos.next), noun: "application" }}
        flash={done}
      />
      <ResearchProvider key={a.id} application={a}>
      <ReviewBody
        wide
        main={
          <>
            {answered.length === 0 ? (
              <p className="border border-dashed border-border px-6 py-10 text-sm text-muted-foreground">They didn&rsquo;t answer any of the questions.</p>
            ) : (
              answered.map(([title, qs]) => (
                <AnswerGroup key={title} title={title}>
                  {qs.map(([q, v, label]) => (
                    <Answer key={q} question={q} label={label}>
                      {v}
                    </Answer>
                  ))}
                </AnswerGroup>
              ))
            )}
          </>
        }
        side={
          <>
            <ReviewPanel key={a.id} application={a} afterHref={afterHref} />
            <ResearchCard application={a} />
            <SideCard title="Details">
              <Properties rows={details} />
            </SideCard>
            <SideCard title="History">
              <Timeline
                steps={[
                  { what: "Applied", when: a.createdAt },
                  ...a.decisions.map((d) => ({ what: `${d.by} ${d.outcome}`, when: d.at, note: d.note })),
                  ...(a.paidAt ? [{ what: "Paid — now a member", when: a.paidAt }] : []),
                ]}
              />
            </SideCard>
            <BanLink application={a} afterHref={afterHref} />
          </>
        }
      />
      </ResearchProvider>
    </>
  );
}

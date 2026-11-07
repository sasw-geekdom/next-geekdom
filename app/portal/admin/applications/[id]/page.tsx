import { notFound } from "next/navigation";
import { getApplication, listApplications } from "@/lib/admin/queries";
import { ApplicationStatusLabel, tableDate } from "@/components/admin/admin-ui";
import { APPLICATION_LABELS } from "@/components/ui/badge";
import { ReviewPanel } from "@/components/admin/review-panel";
import {
  Answer,
  AnswerGroup,
  MailLink,
  OutLink,
  Properties,
  ReviewBody,
  ReviewHeader,
  SideCard,
  siteHref,
  Timeline,
} from "@/components/admin/review-layout";
import { applicationPosition, applicationQuery, parseApplicationQueue } from "@/lib/admin/review-queue";
import { planOf, planPrice } from "@/lib/membership";
import { Q } from "@/lib/application-questions";

export async function generateMetadata(props: PageProps<"/portal/admin/applications/[id]">) {
  const { id } = await props.params;
  const application = await getApplication(id);
  return { title: application?.name ?? "Application" };
}

/*
  ONE APPLICATION, laid out for deciding (components/admin/review-layout.tsx):
  what they wrote on the left, grouped by what decides it, in Geekdom's own
  wording (lib/application-questions.ts); the decision, staff notes, the
  contact details and the history on the right. Blank answers and empty
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
  const site = siteHref(a.website);
  const groups: [string, [string, React.ReactNode][]][] = [
    [
      "Who they are",
      [
        [Q.brag, a.brag],
        [
          Q.describes,
          a.describes.length || a.describesOther ? (
            <span className="flex flex-wrap gap-1.5 whitespace-normal">
              {[...a.describes.filter((d) => d !== "Other"), ...(a.describesOther ? [a.describesOther] : a.describes.includes("Other") ? ["Other"] : [])].map((d) => (
                <span key={d} className="border border-border bg-bone-light px-2 py-0.5 text-sm">
                  {d}
                </span>
              ))}
            </span>
          ) : null,
        ],
        [Q.building, a.building],
        [Q.shipped, a.shipped],
        [Q.links, a.links],
      ],
    ],
    [
      "Why Geekdom",
      [
        [Q.whyGeekdom, a.whyGeekdom],
        [Q.giveBack, a.giveBack],
        [Q.excited, a.excited],
      ],
    ],
    [
      "Anything else",
      [
        [Q.otherCommunities, a.otherCommunities],
        [Q.anythingElse, a.anythingElse],
      ],
    ],
  ];
  const answered = groups
    .map(([title, qs]) => [title, qs.filter(([, v]) => (typeof v === "string" ? v.trim() : v))] as const)
    .filter(([, qs]) => qs.length > 0);

  const details: [string, React.ReactNode][] = [
    ["Membership", `${plan.name} · ${planPrice(plan)}`],
    ["Email", <MailLink key="e" email={a.email} />],
    ...(a.phone ? ([["Phone", <a key="p" href={`tel:${a.phone}`} className="text-graphite">{a.phone}</a>]] as [string, React.ReactNode][]) : []),
    ...(a.city ? ([["City", a.city]] as [string, React.ReactNode][]) : []),
    ...(a.company ? ([["Company", a.company]] as [string, React.ReactNode][]) : []),
    ...(site ? ([["Site", <OutLink key="s" href={site} />]] as [string, React.ReactNode][]) : []),
    ...(a.heardAbout ? ([["Heard about us", [a.heardAbout, a.heardAboutOther].filter(Boolean).join(" — ")]] as [string, React.ReactNode][]) : []),
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
      <ReviewBody
        main={
          answered.length === 0 ? (
            <p className="border border-dashed border-border px-6 py-10 text-sm text-muted-foreground">They didn&rsquo;t answer any of the questions.</p>
          ) : (
            answered.map(([title, qs]) => (
              <AnswerGroup key={title} title={title}>
                {qs.map(([q, v]) => (
                  <Answer key={q} question={q}>
                    {v}
                  </Answer>
                ))}
              </AnswerGroup>
            ))
          )
        }
        side={
          <>
            <ReviewPanel key={a.id} application={a} afterHref={afterHref} />
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
          </>
        }
      />
    </>
  );
}

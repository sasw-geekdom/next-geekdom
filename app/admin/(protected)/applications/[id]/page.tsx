import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getApplication } from "@/lib/admin/queries";
import { ApplicationBadge } from "@/components/ui/badge";
import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { ReviewPanel } from "@/components/admin/review-panel";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata(
  props: PageProps<"/admin/applications/[id]">,
) {
  const { id } = await props.params;
  const application = await getApplication(id);
  return { title: application?.name ?? "Application" };
}

export default async function ApplicationDetailPage(
  props: PageProps<"/admin/applications/[id]">,
) {
  const { id } = await props.params;
  const application = await getApplication(id);
  if (!application) notFound();

  return (
    <>
      <PageHeader
        title={application.name}
        description={application.company || application.email}
        actions={<ApplicationBadge status={application.status} />}
      />

      <AdminSection>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
          All applications
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* The application itself */}
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">Contact</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Email">
                  <a
                    href={`mailto:${application.email}`}
                    className="text-rust hover:underline"
                  >
                    {application.email}
                  </a>
                </Detail>
                <Detail label="Phone">{application.phone || "—"}</Detail>
                <Detail label="Company">{application.company || "—"}</Detail>
                <Detail label="Role">{application.role || "—"}</Detail>
                <Detail label="Website">
                  <ExternalDetail href={application.website} />
                </Detail>
                <Detail label="LinkedIn">
                  <ExternalDetail href={application.linkedin} />
                </Detail>
                <Detail label="They are">{application.audience}</Detail>
                <Detail label="Stage">{application.stage}</Detail>
                <Detail label="Referred by">
                  {application.referredBy || "—"}
                </Detail>
                <Detail label="Former coworking member">
                  {application.formerMember ? "Yes" : "No"}
                </Detail>
              </dl>
            </section>

            <section className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">
                What they&rsquo;re building
              </h2>
              {/* whitespace-pre-line preserves the paragraph breaks people
                  actually type into a textarea. */}
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/85">
                {application.building}
              </p>

              <h2 className="mt-8 text-sm font-semibold text-ink">
                What they need from the room
              </h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/85">
                {application.needs}
              </p>
            </section>

            <section className="rounded-xl border border-border bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">History</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Applied">
                  {formatDateTime(application.createdAt)}
                </Detail>
                <Detail label="Reviewed">
                  {application.reviewedAt
                    ? `${formatDateTime(application.reviewedAt)}${
                        application.reviewedBy
                          ? ` by ${application.reviewedBy}`
                          : ""
                      }`
                    : "—"}
                </Detail>
                <Detail label="Invitation sent">
                  {application.invitedAt
                    ? formatDateTime(application.invitedAt)
                    : "—"}
                </Detail>
              </dl>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <ReviewPanel application={application} />
          </aside>
        </div>
      </AdminSection>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-ink">{children}</dd>
    </div>
  );
}

function ExternalDetail({ href }: { href?: string }) {
  if (!href) return <>—</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1 text-rust hover:underline"
    >
      <span className="truncate">{href.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.8} />
    </a>
  );
}

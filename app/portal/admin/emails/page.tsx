import { PageHeader, AdminSection } from "@/components/admin/page-header";
import { EmailsBrowser, type EmailView } from "@/components/admin/emails-browser";
import { CATALOG, EMAIL_GROUPS } from "@/lib/email/catalog";
import { EMAIL_FROM } from "@/lib/email/resend";

export const metadata = { title: "Emails" };

/*
  SETTINGS → EMAILS (Jesse, November 2026): every automated email the site
  sends through Resend, as the person receives it — who gets it, when, the
  subject and the preview line — with "Send a test to me". VIEW ONLY: the
  wording lives in the code; editing it can come later if the team asks.
  Every admin can see it (the admin layout checks the role).
*/
export default async function AdminEmailsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { e } = await props.searchParams;
  const emails: EmailView[] = CATALOG.map((e) => {
    const m = e.build();
    return { key: e.key, group: e.group, title: e.title, to: e.to, when: e.when, subject: m.subject, preheader: m.preheader, html: m.html };
  });
  return (
    <>
      <PageHeader title="Emails" description={`Every automated email the site sends, exactly as people receive it — ${emails.length} in all, from ${EMAIL_FROM.replace(/^.*</, "").replace(/>$/, "")}.`} />
      <AdminSection>
        <EmailsBrowser emails={emails} groups={[...EMAIL_GROUPS]} initialKey={typeof e === "string" ? e : undefined} />
      </AdminSection>
    </>
  );
}

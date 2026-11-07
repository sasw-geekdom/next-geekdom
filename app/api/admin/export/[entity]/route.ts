import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/session";
import { listApplications, listMembers } from "@/lib/admin/queries";
import { csvFilename, toCsv } from "@/lib/admin/csv";
import { logActivity } from "@/lib/admin/activity";
import { APPLICATION_LABELS } from "@/components/ui/badge";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
} from "@/lib/firebase/collections";

/**
 * CSV export for the admin tables.
 *
 * Auth is re-checked here rather than relying on the admin layout: a route
 * handler never runs a layout, and proxy.ts only checks that a cookie exists.
 * Without this, the entire member roster and every application would be one
 * unauthenticated GET away.
 *
 * STAFF ONLY, not "signed in". This checked `getSessionUser()`, which was the
 * same thing while only staff could sign in — and stopped being the moment
 * members could: any member could GET the whole roster and every
 * application as a CSV. `requireAdminApi()` is the role check.
 *
 * EVERY EXPORT IS LOGGED (who, what, how many rows): it's the one admin
 * action that takes people's personal details off the site.
 *
 * A 401 is returned rather than a redirect — this URL is opened directly by the
 * browser, and bouncing to an HTML login page would download it as a .csv.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/export/[entity]">,
) {
  const user = await requireAdminApi();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { entity } = await ctx.params;

  if (entity === "applications") {
    const raw = request.nextUrl.searchParams.get("status") ?? undefined;
    const status = APPLICATION_STATUSES.includes(raw as ApplicationStatus)
      ? (raw as ApplicationStatus)
      : undefined;

    // Filtered after the read, like the list page — no composite index.
    const rows = (await listApplications({ limit: 5000 })).filter((r) => !status || r.status === status);

    // Geekdom's questions, in their order (lib/application-questions.ts).
    const flat = rows.map((r) => ({ ...r, describes: r.describes.join("; ") }));
    const csv = toCsv(flat, [
      { key: "createdAt", label: "Applied" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "plan", label: "Membership" },
      { key: "phone", label: "Phone" },
      { key: "city", label: "City" },
      { key: "company", label: "Company" },
      { key: "website", label: "LinkedIn or personal site" },
      { key: "heardAbout", label: "How did you hear about Geekdom?" },
      { key: "heardAboutOther", label: "Other (how did you hear?)" },
      { key: "brag", label: "Brag about yourself in one sentence." },
      { key: "building", label: "What are you building?" },
      { key: "shipped", label: "Shipped, sold or built in the last 90 days" },
      { key: "links", label: "Links to work" },
      { key: "describes", label: "Which best describes you?" },
      { key: "describesOther", label: "Other (which describes you?)" },
      { key: "whyGeekdom", label: "Why Geekdom?" },
      { key: "giveBack", label: "What will you give back?" },
      { key: "excited", label: "Most excited to do in the next 6 months" },
      { key: "otherCommunities", label: "Other communities or programs" },
      { key: "anythingElse", label: "Anything else" },
      { key: "formerMember", label: "Current Geekdom member" },
      { key: "status", label: "Status" },
      { key: "reviewedBy", label: "Reviewed by" },
      { key: "notes", label: "Notes" },
      { key: "source", label: "Source" },
    ]);

    await logActivity(user, {
      area: "applications",
      action: "exported",
      label: `${rows.length} ${rows.length === 1 ? "application" : "applications"}${status ? ` (${APPLICATION_LABELS[status]})` : ""} to CSV`,
      href: "/portal/admin/applications",
    });
    return csvResponse(csv, `geekdom-applications${status ? `-${status}` : ""}`);
  }

  if (entity === "members") {
    const rows = await listMembers({ limit: 5000 });

    const csv = toCsv(rows, [
      { key: "joinedAt", label: "Joined" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "currentPeriodEnd", label: "Period end" },
      { key: "cancelAtPeriodEnd", label: "Canceling" },
      { key: "stripeCustomerId", label: "Stripe customer" },
      { key: "stripeSubscriptionId", label: "Stripe subscription" },
    ]);

    await logActivity(user, {
      area: "members",
      action: "exported",
      label: `the member roster (${rows.length} ${rows.length === 1 ? "member" : "members"}) to CSV`,
      href: "/portal/admin/members",
    });
    return csvResponse(csv, "geekdom-members");
  }

  return NextResponse.json({ error: "Unknown export." }, { status: 404 });
}

function csvResponse(csv: string, basename: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": csvFilename(basename),
      // Rosters and applications are personal data — never let a CDN or a
      // shared proxy hold a copy.
      "Cache-Control": "no-store, private",
    },
  });
}

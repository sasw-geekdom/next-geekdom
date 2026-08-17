import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listApplications, listMembers } from "@/lib/admin/queries";
import { csvFilename, toCsv } from "@/lib/admin/csv";
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
 * A 401 is returned rather than a redirect — this URL is opened directly by the
 * browser, and bouncing to an HTML login page would download it as a .csv.
 */
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/export/[entity]">,
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { entity } = await ctx.params;

  if (entity === "applications") {
    const raw = request.nextUrl.searchParams.get("status") ?? undefined;
    const status = APPLICATION_STATUSES.includes(raw as ApplicationStatus)
      ? (raw as ApplicationStatus)
      : undefined;

    const rows = await listApplications({ status, limit: 5000 });

    const csv = toCsv(rows, [
      { key: "createdAt", label: "Applied" },
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "company", label: "Company" },
      { key: "role", label: "Role" },
      { key: "audience", label: "They are" },
      { key: "stage", label: "Stage" },
      { key: "building", label: "Building" },
      { key: "needs", label: "Needs" },
      { key: "referredBy", label: "Referred by" },
      { key: "formerMember", label: "Former member" },
      { key: "website", label: "Website" },
      { key: "linkedin", label: "LinkedIn" },
      { key: "status", label: "Status" },
      { key: "reviewedBy", label: "Reviewed by" },
      { key: "notes", label: "Notes" },
    ]);

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

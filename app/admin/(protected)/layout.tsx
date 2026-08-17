import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // The real gate. proxy.ts only checks that a cookie exists; this verifies the
  // cookie's signature, that it hasn't been revoked, and that the account still
  // resolves to a role. Route handlers and server actions re-check on their own,
  // because neither runs a layout.
  const user = await requireAdmin();

  return <AdminShell user={user}>{children}</AdminShell>;
}

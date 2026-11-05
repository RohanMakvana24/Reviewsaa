import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/auth";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("SUPER_ADMIN");
  return <DashboardShell session={session}>{children}</DashboardShell>;
}

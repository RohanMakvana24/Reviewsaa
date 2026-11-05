import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/auth";
import { getWorkspace } from "@/lib/workspace";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const organization = session.organizations[0];
  const workspace = organization ? await getWorkspace(organization.id) : null;
  return (
    <DashboardShell session={session} workspace={workspace}>
      {children}
    </DashboardShell>
  );
}

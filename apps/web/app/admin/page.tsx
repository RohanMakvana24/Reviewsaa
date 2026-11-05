import { requireSession } from "@/lib/auth";
import { AdminOverview } from "@/components/dashboard-pages";
export const metadata = { title: "Platform overview" };
export default async function Page() {
  await requireSession("SUPER_ADMIN");
  return <AdminOverview />;
}

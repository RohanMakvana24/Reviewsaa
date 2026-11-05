import { requireSession } from "@/lib/auth";
import { AdminPlansPage } from "@/components/dashboard-pages";
export const metadata = { title: "Plans" };
export default async function Page() {
  await requireSession("SUPER_ADMIN");
  return <AdminPlansPage />;
}

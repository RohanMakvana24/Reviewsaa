import { requireSession } from "@/lib/auth";
import { HealthPage } from "@/components/dashboard-pages";
export const metadata = { title: "System health" };
export default async function Page() {
  await requireSession("SUPER_ADMIN");
  return <HealthPage />;
}

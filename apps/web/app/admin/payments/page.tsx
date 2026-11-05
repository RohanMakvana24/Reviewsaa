import { requireSession } from "@/lib/auth";
import { PaymentsPage } from "@/components/dashboard-pages";
export const metadata = { title: "Payments" };
export default async function Page() {
  await requireSession("SUPER_ADMIN");
  return <PaymentsPage />;
}

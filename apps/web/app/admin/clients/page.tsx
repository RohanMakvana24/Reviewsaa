import { requireSession } from "@/lib/auth";
import { ClientsPage } from "@/components/dashboard-pages";
export const metadata = { title: "Clients" };
export default async function Page() {
  await requireSession("SUPER_ADMIN");
  return <ClientsPage />;
}

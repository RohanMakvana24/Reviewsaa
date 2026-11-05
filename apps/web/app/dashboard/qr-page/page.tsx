import { requireSession } from "@/lib/auth";
import { QrPage } from "@/components/dashboard-pages";
export const metadata = { title: "QR page" };
export default async function Page() {
  await requireSession();
  return <QrPage />;
}

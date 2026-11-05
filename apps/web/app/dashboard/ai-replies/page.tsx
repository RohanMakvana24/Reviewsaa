import { requireSession } from "@/lib/auth";
import { AiPage } from "@/components/dashboard-pages";
export const metadata = { title: "AI replies" };
export default async function Page() {
  await requireSession();
  return <AiPage />;
}

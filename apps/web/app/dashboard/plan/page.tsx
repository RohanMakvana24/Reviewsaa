import { requireSession } from "@/lib/auth";
import { getWorkspace, getPublicOffer } from "@/lib/workspace";
import { RealPlanPage } from "@/components/trial-status";
export const metadata = { title: "Plan & billing" };
export default async function Page() {
  const session = await requireSession();
  const org = session.organizations[0];
  const [workspace, offer] = await Promise.all([
    org ? getWorkspace(org.id) : Promise.resolve(null),
    getPublicOffer(),
  ]);
  return (
    <RealPlanPage
      workspace={workspace}
      config={offer.config}
      offerAvailable={offer.available}
    />
  );
}

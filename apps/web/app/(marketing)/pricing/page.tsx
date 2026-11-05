import { PricingContent } from "@/components/marketing-content";
import { publicMetadata } from "@/lib/site";
import { getPublicOffer } from "@/lib/workspace";
export const metadata = publicMetadata(
  "Simple pricing and a 14-day trial",
  "Explore the free workspace trial and proposed ₹99/month Basic plan. No automatic billing or AutoPay.",
  "/pricing",
);
export const revalidate = 60;
export default async function Pricing() {
  const offer = await getPublicOffer();
  return <PricingContent {...offer} />;
}

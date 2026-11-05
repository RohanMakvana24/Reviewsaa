import { HomeContent } from "@/components/marketing-content";
import { publicMetadata } from "@/lib/site";
import { getPublicOffer } from "@/lib/workspace";
export const metadata = publicMetadata(
  "A little more care for your business reputation",
  "An early-access reputation workspace for local businesses. Start with business onboarding and a transparent 14-day trial.",
  "/",
);
export const revalidate = 60;
export default async function Home() {
  const offer = await getPublicOffer();
  return <HomeContent {...offer} />;
}

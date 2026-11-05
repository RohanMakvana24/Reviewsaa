import { FeaturesContent } from "@/components/marketing-content";
import { publicMetadata } from "@/lib/site";
export const metadata = publicMetadata(
  "A simple workspace for local business",
  "See what is available in ReviesNest early access and what is coming next.",
  "/features",
);
export default function Page() {
  return <FeaturesContent />;
}

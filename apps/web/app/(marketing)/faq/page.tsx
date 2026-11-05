import { FaqContent } from "@/components/marketing-content";
import { publicMetadata } from "@/lib/site";
export const metadata = publicMetadata(
  "Frequently asked questions",
  "Understand the trial, Google permissions, genuine reviews and early-access availability.",
  "/faq",
);
export default function Page() {
  return <FaqContent />;
}

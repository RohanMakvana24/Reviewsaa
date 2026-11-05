import { LegalContent } from "@/components/legal-content";
import { publicMetadata } from "@/lib/site";
export const metadata = publicMetadata(
  "Refunds and cancellation",
  "ReviesNest early-access policies in plain language.",
  "/refund-policy",
);
export default function Page() {
  return <LegalContent kind="refund-policy" />;
}

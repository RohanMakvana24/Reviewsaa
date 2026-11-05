import { LegalContent } from "@/components/legal-content";
import { publicMetadata } from "@/lib/site";
export const metadata = publicMetadata(
  "Privacy policy",
  "ReviesNest early-access policies in plain language.",
  "/privacy",
);
export default function Page() {
  return <LegalContent kind="privacy" />;
}

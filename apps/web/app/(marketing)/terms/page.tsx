import { LegalContent } from "@/components/legal-content";
import { publicMetadata } from "@/lib/site";
export const metadata = publicMetadata(
  "Terms of use",
  "ReviesNest early-access policies in plain language.",
  "/terms",
);
export default function Page() {
  return <LegalContent kind="terms" />;
}

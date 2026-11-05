import type { Metadata } from "next";
import { MarketingHeader, MarketingFooter } from "@/components/marketing-shell";
export const metadata: Metadata = { robots: { index: true, follow: true } };
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-site">
      <a
        href="#public-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:p-3"
      >
        Skip to content
      </a>
      <MarketingHeader />
      <main id="public-content">{children}</main>
      <MarketingFooter />
    </div>
  );
}

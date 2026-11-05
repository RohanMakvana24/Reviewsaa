import type { Metadata } from "next";
const configured = new URL(process.env.SITE_URL || "http://localhost:3000");
if (!["http:", "https:"].includes(configured.protocol))
  throw new Error("SITE_URL must use HTTP or HTTPS");
export const siteUrl = configured.origin;
export const publicPaths = [
  "/",
  "/features",
  "/pricing",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
];
export function publicMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | ReviesNest`,
      description,
      url: path,
      siteName: "ReviesNest",
      type: "website",
      locale: "en_IN",
    },
  };
}

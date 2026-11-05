import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  publicConfigSchema,
  workspaceSchema,
  type PublicConfig,
} from "@reviesnest/contracts";
const api = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
export async function authenticatedApi(path: string) {
  const jar = await cookies();
  const name = jar.has("__Host-reviesnest_session")
    ? "__Host-reviesnest_session"
    : "reviesnest_session";
  const token = jar.get(name)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) redirect("/login");
  const response = await fetch(`${api}${path}`, {
    headers: { cookie: `${name}=${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (response.status === 401) redirect("/login");
  if (response.status === 403) redirect("/forbidden");
  return response;
}
export async function getWorkspace(organizationId: string) {
  const response = await authenticatedApi(
    `/organizations/${encodeURIComponent(organizationId)}/onboarding`,
  );
  if (!response.ok)
    throw new Error("Your workspace could not be loaded. Please retry.");
  return workspaceSchema.parse(await response.json());
}
const provisional: PublicConfig = {
  priceMonthlyInr: 99,
  paidAiAllowance: 30,
  trialDays: 14,
  trialAiAllowance: 20,
  integrations: { googleBusiness: false, aiReplies: false, payments: false },
  contactAvailable: true,
};
export async function getPublicOffer() {
  try {
    const response = await fetch(`${api}/public/config`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error("Unavailable");
    return {
      config: publicConfigSchema.parse(await response.json()),
      available: true,
    };
  } catch {
    return { config: provisional, available: false };
  }
}
export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  business: string;
  message: string;
  createdAt: string;
};
export async function getContactInquiries() {
  const response = await authenticatedApi("/admin/contact-inquiries");
  if (!response.ok)
    throw new Error("Contact requests are temporarily unavailable.");
  const body = await response.json();
  if (
    !Array.isArray(body.inquiries) ||
    !body.inquiries.every((item: Record<string, unknown>) =>
      ["id", "name", "email", "business", "message", "createdAt"].every(
        (key) => typeof item[key] === "string",
      ),
    )
  )
    throw new Error("Contact requests could not be read.");
  return body.inquiries as ContactInquiry[];
}

export async function getGoogleBusinessState(organizationId: string) {
  const { googleBusinessStateSchema } = await import("@reviesnest/contracts");
  const response = await authenticatedApi(
    `/organizations/${encodeURIComponent(organizationId)}/google-business`,
  );
  if (!response.ok)
    throw new Error(
      "Google connection status could not be loaded. Please retry.",
    );
  return googleBusinessStateSchema.parse(await response.json());
}
export async function getGoogleReviews(organizationId: string) {
  const { googleReviewsSchema } = await import("@reviesnest/contracts");
  const response = await authenticatedApi(
    `/organizations/${encodeURIComponent(organizationId)}/google-business/reviews`,
  );
  if (!response.ok) return null;
  const parsed = googleReviewsSchema.safeParse(await response.json());
  return parsed.success ? parsed.data : null;
}

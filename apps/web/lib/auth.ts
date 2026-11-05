import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionResponseSchema, type AuthSession } from "@reviesnest/contracts";
const api = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
export type SessionResult =
  | { state: "signed-in"; session: AuthSession }
  | { state: "signed-out" | "disabled" | "unavailable" };
export async function getSession(): Promise<SessionResult> {
  const jar = await cookies();
  // Production uses a host-prefixed secure cookie; never forward arbitrary cookies.
  const name = jar.has("__Host-reviesnest_session")
    ? "__Host-reviesnest_session"
    : "reviesnest_session";
  const token = jar.get(name)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return { state: "signed-out" };
  try {
    const response = await fetch(`${api}/auth/me`, {
      headers: { cookie: `${name}=${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401) return { state: "signed-out" };
    if (response.status === 403) return { state: "disabled" };
    if (!response.ok) return { state: "unavailable" };
    const parsed = sessionResponseSchema.safeParse(await response.json());
    return parsed.success
      ? { state: "signed-in", session: parsed.data }
      : { state: "unavailable" };
  } catch {
    return { state: "unavailable" };
  }
}
export async function requireSession(role?: "SUPER_ADMIN") {
  const result = await getSession();
  if (result.state === "signed-out") redirect("/login");
  if (result.state === "disabled") redirect("/login?error=disabled");
  if (result.state !== "signed-in")
    throw new Error(
      "The sign-in service is temporarily unavailable. Please retry.",
    );
  if (role && result.session.user.role !== role) redirect("/forbidden");
  return result.session;
}
export async function googleAvailability() {
  try {
    const response = await fetch(`${api}/auth/config`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return "unavailable";
    const body = await response.json();
    return body.googleConfigured === true ? "ready" : "unconfigured";
  } catch {
    return "unavailable";
  }
}

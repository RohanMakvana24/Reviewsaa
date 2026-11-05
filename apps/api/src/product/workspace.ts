import type { PrismaClient } from "@prisma/client";
import type { Workspace } from "@reviesnest/contracts";
import { AuthError } from "../auth/security.js";
import { trialSummary } from "./trial.js";
export async function workspace(
  db: PrismaClient,
  organizationId: string,
  userId: string,
): Promise<Workspace> {
  const membership = await db.membership.findFirst({
    where: {
      organizationId,
      userId,
      user: { status: "ACTIVE" },
      organization: { status: "ACTIVE" },
    },
    include: { organization: { include: { onboarding: true } } },
  });
  if (!membership) throw new AuthError(404, "NOT_FOUND");
  const org = membership.organization,
    details = org.onboarding;
  const grant = await db.trialGrant.findUnique({ where: { organizationId } });
  const businessSaved = !!details?.businessSavedAt,
    qrSaved = !!details?.qrSavedAt;
  const google = await db.googleBusinessConnection.findUnique({
    where: { organizationId },
    include: { location: true },
  });
  const connected = google?.status === "CONNECTED";
  const selected =
    connected &&
    !!google?.location &&
    google.location.cacheExpiresAt > new Date();
  return {
    organization: { id: org.id, name: org.name },
    trial: trialSummary(grant),
    onboarding: {
      business: businessSaved
        ? {
            name: org.name,
            category: details?.category || "",
            city: details?.city || "",
            phone: details?.phone || "",
          }
        : null,
      qr: qrSaved
        ? {
            greeting: details?.greeting || "",
            accentColor: details?.accentColor || "#0f766e",
          }
        : null,
      businessSaved,
      qrSaved,
      status:
        businessSaved && qrSaved && selected
          ? "READY"
          : businessSaved && qrSaved
            ? "AWAITING_GOOGLE"
            : businessSaved
              ? "IN_PROGRESS"
              : "NOT_STARTED",
      steps: [
        { key: "business", status: businessSaved ? "complete" : "pending" },
        { key: "google", status: connected ? "complete" : "pending" },
        {
          key: "location",
          status: selected ? "complete" : connected ? "pending" : "blocked",
        },
        { key: "qr", status: qrSaved ? "complete" : "pending" },
      ],
    },
  };
}

import type { Prisma, PrismaClient, TrialGrant } from "@prisma/client";
import type { TrialSummary } from "@reviesnest/contracts";
import { AuthError, hashToken } from "../auth/security.js";
import {
  defaultProductConfig,
  trialDays,
  type ProductConfig,
} from "./config.js";
export function trialSummary(
  grant: TrialGrant | null,
  now = new Date(),
): TrialSummary {
  if (!grant)
    return {
      status: "UNAVAILABLE",
      startedAt: null,
      expiresAt: null,
      allowance: 0,
      used: 0,
      remaining: 0,
      daysRemaining: 0,
      serverNow: now.toISOString(),
    };
  const expired = grant.expiresAt <= now || grant.startedAt > now;
  const remaining = Math.max(0, grant.allowance - grant.used);
  return {
    status: expired ? "EXPIRED" : remaining === 0 ? "EXHAUSTED" : "ACTIVE",
    startedAt: grant.startedAt.toISOString(),
    expiresAt: grant.expiresAt.toISOString(),
    allowance: grant.allowance,
    used: grant.used,
    remaining: expired ? 0 : remaining,
    daysRemaining: expired
      ? 0
      : Math.ceil((grant.expiresAt.getTime() - now.getTime()) / 86400000),
    serverNow: now.toISOString(),
  };
}
export async function createTrial(
  tx: Prisma.TransactionClient,
  identity: { subject: string; email: string },
  organizationId: string,
  startedAt: Date,
  config: ProductConfig = defaultProductConfig,
) {
  const googleSubjectHash = hashToken(identity.subject),
    emailHash = hashToken(identity.email.trim().toLowerCase());
  const existing = await tx.trialGrant.findFirst({
    where: { OR: [{ googleSubjectHash }, { emailHash }] },
    select: { id: true },
  });
  if (existing) return null;
  return tx.trialGrant.create({
    data: {
      organizationId,
      googleSubjectHash,
      emailHash,
      startedAt,
      expiresAt: new Date(startedAt.getTime() + trialDays * 86400000),
      allowance: config.trialAiAllowance,
    },
  });
}
// Internal service for the future AI job path. Not a public AI endpoint.
// Caller must not call a provider again when alreadyReserved=true.
export async function reserveTrialGeneration(
  db: PrismaClient,
  input: {
    organizationId: string;
    actorUserId: string;
    idempotencyKey: string;
    requestId: string;
  },
) {
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(input.idempotencyKey))
    throw new AuthError(400, "INVALID_IDEMPOTENCY_KEY");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const membership = await tx.membership.findFirst({
            where: {
              organizationId: input.organizationId,
              userId: input.actorUserId,
              user: { status: "ACTIVE" },
              organization: { status: "ACTIVE" },
            },
          });
          if (!membership) throw new AuthError(404, "NOT_FOUND");
          const previous = await tx.trialUsageReservation.findUnique({
            where: {
              organizationId_idempotencyKey: {
                organizationId: input.organizationId,
                idempotencyKey: input.idempotencyKey,
              },
            },
          });
          if (previous) {
            if (previous.actorUserId !== input.actorUserId)
              throw new AuthError(409, "IDEMPOTENCY_CONFLICT");
            return { alreadyReserved: true, reservationId: previous.id };
          }
          const grant = await tx.trialGrant.findUnique({
            where: { organizationId: input.organizationId },
          });
          const now = new Date();
          if (!grant) throw new AuthError(402, "TRIAL_UNAVAILABLE");
          const changed = await tx.trialGrant.updateMany({
            where: {
              id: grant.id,
              startedAt: { lte: now },
              expiresAt: { gt: now },
              used: { lt: grant.allowance },
            },
            data: { used: { increment: 1 } },
          });
          if (changed.count !== 1)
            throw new AuthError(
              402,
              grant.expiresAt <= now ? "TRIAL_EXPIRED" : "TRIAL_LIMIT_REACHED",
            );
          const reservation = await tx.trialUsageReservation.create({
            data: {
              organizationId: input.organizationId,
              actorUserId: input.actorUserId,
              idempotencyKey: input.idempotencyKey,
            },
          });
          await tx.auditLog.create({
            data: {
              actorUserId: input.actorUserId,
              organizationId: input.organizationId,
              action: "TRIAL_USAGE_RESERVED",
              targetId: reservation.id,
              requestId: input.requestId,
            },
          });
          return { alreadyReserved: false, reservationId: reservation.id };
        },
        { isolationLevel: "ReadCommitted" },
      );
    } catch (error) {
      if (
        attempt < 3 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        ["P2002", "P2034"].includes(String(error.code))
      )
        continue;
      throw error;
    }
  }
  throw new Error("Unable to reserve trial usage");
}

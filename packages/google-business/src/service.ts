import type { GoogleBusinessConnection, PrismaClient } from "@prisma/client";
import type { GoogleBusinessState } from "@reviesnest/contracts";
import { BusinessError, TokenCipher, tokenAad, digest } from "./crypto.js";
import {
  BUSINESS_SCOPE,
  type BusinessProvider,
  type Grant,
} from "./provider.js";
export type BusinessContext = {
  db: PrismaClient;
  provider: BusinessProvider;
  cipher: TokenCipher;
};
export const cacheLifetimeMs = 7 * 86400000;
export const unusableStatuses = [
  "DISCONNECTED",
  "REVOCATION_PENDING",
  "NEEDS_RECONNECT",
];
export const hiddenContentStatuses = [
  ...unusableStatuses,
  "ACCESS_DENIED",
  "API_ACCESS_REQUIRED",
];
export async function businessState(
  db: PrismaClient,
  organizationId: string,
  configured: boolean,
): Promise<GoogleBusinessState> {
  const connection = await db.googleBusinessConnection.findUnique({
    where: { organizationId },
    include: { location: true },
  });
  const location = connection?.location;
  const visible =
    connection && !hiddenContentStatuses.includes(connection.status);
  return {
    configured,
    connection: connection
      ? {
          status: connection.status,
          errorCode: connection.errorCode,
          retryAt: connection.retryAt?.toISOString() || null,
          connectedAt: connection.connectedAt?.toISOString() || null,
        }
      : null,
    location:
      location && location.cacheExpiresAt > new Date()
        ? {
            id: location.id,
            title: visible
              ? location.title
              : "Selected profile (access unavailable)",
            verification: location.verification as
              "UNKNOWN" | "VERIFIED" | "UNVERIFIED",
            syncStatus: location.syncStatus as
              "IDLE" | "QUEUED" | "SYNCING" | "ERROR",
            errorCode: location.errorCode,
            lastSyncAt: visible
              ? location.lastSyncAt?.toISOString() || null
              : null,
            cacheExpiresAt: location.cacheExpiresAt.toISOString(),
            truncated: location.truncated,
            googleTotalReviewCount: visible
              ? location.googleTotalReviewCount
              : null,
            googleAverageRating: visible ? location.googleAverageRating : null,
          }
        : null,
  };
}
export async function usableConnection(
  ctx: BusinessContext,
  organizationId: string,
) {
  const connection = await ctx.db.googleBusinessConnection.findUnique({
    where: { organizationId },
    include: { organization: true, authorizedUser: true },
  });
  if (
    !connection ||
    unusableStatuses.includes(connection.status) ||
    !connection.encryptedRefreshToken
  )
    throw new BusinessError("NEEDS_RECONNECT", 409);
  if (
    connection.organization.status !== "ACTIVE" ||
    connection.authorizedUser.status !== "ACTIVE"
  )
    throw new BusinessError("ACCESS_DENIED", 403);
  if (connection.retryAt && connection.retryAt > new Date())
    throw new BusinessError(
      connection.status === "RATE_LIMITED"
        ? "RATE_LIMITED"
        : "PROVIDER_UNAVAILABLE",
      connection.status === "RATE_LIMITED" ? 429 : 503,
      true,
      Math.ceil((connection.retryAt.getTime() - Date.now()) / 1000),
    );
  return connection;
}
export async function accessToken(
  ctx: BusinessContext,
  connection: GoogleBusinessConnection,
) {
  if (
    connection.encryptedAccessToken &&
    connection.accessExpiresAt &&
    connection.accessExpiresAt.getTime() > Date.now() + 60000
  )
    return ctx.cipher.decrypt(
      connection.encryptedAccessToken,
      tokenAad(connection.organizationId, connection.id, "access"),
    );
  if (!connection.encryptedRefreshToken)
    throw new BusinessError("NEEDS_RECONNECT", 409);
  const refresh = ctx.cipher.decrypt(
    connection.encryptedRefreshToken,
    tokenAad(connection.organizationId, connection.id, "refresh"),
  );
  const grant = await ctx.provider.refresh(refresh);
  const encryptedAccessToken = ctx.cipher.encrypt(
    grant.accessToken,
    tokenAad(connection.organizationId, connection.id, "access"),
  );
  const changed = await ctx.db.googleBusinessConnection.updateMany({
    where: {
      id: connection.id,
      revision: connection.revision,
      encryptedRefreshToken: connection.encryptedRefreshToken,
      status: { notIn: unusableStatuses },
    },
    data: {
      encryptedAccessToken,
      accessExpiresAt: new Date(Date.now() + grant.expiresIn * 1000),
      ...(grant.refreshToken
        ? {
            encryptedRefreshToken: ctx.cipher.encrypt(
              grant.refreshToken,
              tokenAad(connection.organizationId, connection.id, "refresh"),
            ),
          }
        : {}),
    },
  });
  if (changed.count !== 1) {
    const current = await ctx.db.googleBusinessConnection.findUnique({
      where: { id: connection.id },
    });
    if (
      current &&
      current.revision === connection.revision &&
      !unusableStatuses.includes(current.status) &&
      current.encryptedAccessToken &&
      current.accessExpiresAt &&
      current.accessExpiresAt.getTime() > Date.now() + 60000
    )
      return ctx.cipher.decrypt(
        current.encryptedAccessToken,
        tokenAad(current.organizationId, current.id, "access"),
      );
    throw new BusinessError("CONNECTION_CHANGED", 409);
  }
  return grant.accessToken;
}
export async function recordFailure(
  ctx: BusinessContext,
  connection: GoogleBusinessConnection,
  error: unknown,
) {
  const e =
    error instanceof BusinessError
      ? error
      : new BusinessError("PROVIDER_UNAVAILABLE", 503, true);
  if (
    ![
      "PROFILE_UNVERIFIED",
      "PROFILE_NOT_FOUND",
      "RATE_LIMITED",
      "API_ACCESS_REQUIRED",
      "ACCESS_DENIED",
      "NEEDS_RECONNECT",
      "PROVIDER_UNAVAILABLE",
      "INVALID_PROVIDER_RESPONSE",
      "TOKEN_CONFIGURATION_ERROR",
      "QUEUE_UNAVAILABLE",
    ].includes(e.code)
  )
    return e;
  const status =
    e.code === "PROFILE_UNVERIFIED"
      ? "CONNECTED"
      : e.code === "PROFILE_NOT_FOUND"
        ? "ACCESS_DENIED"
        : e.code === "RATE_LIMITED"
          ? "RATE_LIMITED"
          : e.code === "API_ACCESS_REQUIRED"
            ? "API_ACCESS_REQUIRED"
            : e.code === "ACCESS_DENIED"
              ? "ACCESS_DENIED"
              : e.code === "NEEDS_RECONNECT"
                ? "NEEDS_RECONNECT"
                : "PROVIDER_ERROR";
  await ctx.db.$transaction(async (tx) => {
    const changed = await tx.googleBusinessConnection.updateMany({
      where: {
        id: connection.id,
        revision: connection.revision,
        status: { notIn: ["DISCONNECTED", "REVOCATION_PENDING"] },
        ...(e.code === "NEEDS_RECONNECT"
          ? { encryptedRefreshToken: connection.encryptedRefreshToken }
          : {}),
      },
      data: {
        status,
        errorCode: e.code,
        retryAt: e.retryable
          ? new Date(Date.now() + e.retryAfterSeconds * 1000)
          : null,
        ...(e.code === "NEEDS_RECONNECT"
          ? {
              encryptedAccessToken: null,
              encryptedRefreshToken: null,
              accessExpiresAt: null,
            }
          : {}),
      },
    });
    if (changed.count !== 1) return;
    await tx.googleBusinessLocation.updateMany({
      where: { connectionId: connection.id },
      data: {
        syncStatus: "ERROR",
        errorCode: e.code,
        ...(e.code === "PROFILE_UNVERIFIED"
          ? { verification: "UNVERIFIED" }
          : {}),
      },
    });
    if (
      [
        "NEEDS_RECONNECT",
        "ACCESS_DENIED",
        "API_ACCESS_REQUIRED",
        "PROFILE_NOT_FOUND",
        "PROFILE_UNVERIFIED",
      ].includes(e.code)
    )
      await tx.googleReviewCache.deleteMany({
        where: { organizationId: connection.organizationId },
      });
  });
  return e;
}
export async function saveGrant(
  ctx: BusinessContext,
  input: {
    organizationId: string;
    userId: string;
    revision: number;
    grant: Grant;
    requestId: string;
  },
) {
  if (!input.grant.scopes.includes(BUSINESS_SCOPE))
    throw new BusinessError("SCOPE_REQUIRED", 403);
  return ctx.db.$transaction(async (tx) => {
    const member = await tx.membership.findFirst({
      where: {
        organizationId: input.organizationId,
        userId: input.userId,
        user: { status: "ACTIVE" },
        organization: { status: "ACTIVE" },
      },
    });
    if (!member) throw new BusinessError("ACCESS_DENIED", 403);
    const current = await tx.googleBusinessConnection.findUnique({
      where: { organizationId: input.organizationId },
    });
    if (
      !current ||
      current.revision !== input.revision ||
      current.status === "REVOCATION_PENDING"
    )
      throw new BusinessError("CONNECTION_CHANGED", 409);
    if (
      current.subjectHash &&
      current.subjectHash !== digest(input.grant.subject) &&
      current.encryptedRefreshToken
    )
      throw new BusinessError("ACCOUNT_MISMATCH", 409);
    const refresh = input.grant.refreshToken
      ? ctx.cipher.encrypt(
          input.grant.refreshToken,
          tokenAad(input.organizationId, current.id, "refresh"),
        )
      : current.subjectHash === digest(input.grant.subject)
        ? current.encryptedRefreshToken
        : null;
    if (!refresh) throw new BusinessError("REFRESH_TOKEN_REQUIRED", 409);
    const updated = await tx.googleBusinessConnection.updateMany({
      where: {
        id: current.id,
        revision: input.revision,
        status: { not: "REVOCATION_PENDING" },
      },
      data: {
        authorizedUserId: input.userId,
        subjectHash: digest(input.grant.subject),
        encryptedRefreshToken: refresh,
        encryptedAccessToken: ctx.cipher.encrypt(
          input.grant.accessToken,
          tokenAad(input.organizationId, current.id, "access"),
        ),
        accessExpiresAt: new Date(Date.now() + input.grant.expiresIn * 1000),
        status: "CONNECTED",
        errorCode: null,
        retryAt: null,
        connectedAt: new Date(),
        revision: { increment: 1 },
      },
    });
    if (updated.count !== 1) throw new BusinessError("CONNECTION_CHANGED", 409);
    await tx.googleBusinessLocation.deleteMany({
      where: { connectionId: current.id },
    });
    await tx.googleLocationCandidate.deleteMany({
      where: { connectionId: current.id },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: input.userId,
        organizationId: input.organizationId,
        action: "GOOGLE_BUSINESS_CONNECTED",
        targetId: current.id,
        requestId: input.requestId,
      },
    });
  });
}
export async function retryRevocation(
  ctx: BusinessContext,
  organizationId: string,
) {
  const connection = await ctx.db.googleBusinessConnection.findUnique({
    where: { organizationId },
  });
  if (!connection?.encryptedRevocationToken) return;
  try {
    await ctx.provider.revoke(
      ctx.cipher.decrypt(
        connection.encryptedRevocationToken,
        tokenAad(organizationId, connection.id, "refresh"),
      ),
    );
    await ctx.db.googleBusinessConnection.updateMany({
      where: {
        id: connection.id,
        revision: connection.revision,
        status: "REVOCATION_PENDING",
        encryptedRevocationToken: connection.encryptedRevocationToken,
      },
      data: {
        status: "DISCONNECTED",
        subjectHash: null,
        encryptedRevocationToken: null,
        errorCode: null,
        retryAt: null,
      },
    });
  } catch {
    await ctx.db.googleBusinessConnection.updateMany({
      where: {
        id: connection.id,
        revision: connection.revision,
        status: "REVOCATION_PENDING",
      },
      data: {
        errorCode: "REVOCATION_PENDING",
        retryAt: new Date(Date.now() + 60000),
      },
    });
  }
}
export async function disconnectLocal(
  db: PrismaClient,
  input: { organizationId: string; userId: string; requestId: string },
) {
  await db.$transaction(async (tx) => {
    const connection = await tx.googleBusinessConnection.findUnique({
      where: { organizationId: input.organizationId },
    });
    if (!connection) return;
    const encryptedRevocationToken =
      connection.encryptedRefreshToken || connection.encryptedRevocationToken;
    const changed = await tx.googleBusinessConnection.updateMany({
      where: { id: connection.id, revision: connection.revision },
      data: {
        revision: { increment: 1 },
        status: encryptedRevocationToken
          ? "REVOCATION_PENDING"
          : "DISCONNECTED",
        encryptedRevocationToken,
        encryptedAccessToken: null,
        encryptedRefreshToken: null,
        accessExpiresAt: null,
        errorCode: encryptedRevocationToken ? "REVOCATION_PENDING" : null,
      },
    });
    if (!changed.count) throw new BusinessError("CONNECTION_CHANGED", 409);
    await tx.googleBusinessLocation.deleteMany({
      where: { connectionId: connection.id },
    });
    await tx.googleLocationCandidate.deleteMany({
      where: { connectionId: connection.id },
    });
    await tx.googleBusinessAttempt.deleteMany({
      where: { organizationId: input.organizationId },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: input.userId,
        organizationId: input.organizationId,
        action: "GOOGLE_BUSINESS_DISCONNECTED",
        targetId: connection.id,
        requestId: input.requestId,
      },
    });
  });
}
export async function cleanupExpiredContent(
  db: PrismaClient,
  now = new Date(),
) {
  await db.$transaction([
    db.googleBusinessAttempt.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.googleLocationCandidate.deleteMany({
      where: { expiresAt: { lte: now } },
    }),
    db.googleReviewCache.deleteMany({ where: { expiresAt: { lte: now } } }),
    db.googleBusinessLocation.deleteMany({
      where: { cacheExpiresAt: { lte: now } },
    }),
  ]);
}

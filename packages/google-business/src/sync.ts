import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { BusinessError } from "./crypto.js";
import {
  accessToken,
  cacheLifetimeMs,
  recordFailure,
  usableConnection,
  type BusinessContext,
} from "./service.js";
export type SyncRequest = {
  organizationId: string;
  locationId: string;
  revision: number;
};
export async function syncReviews(ctx: BusinessContext, input: SyncRequest) {
  const connection = await usableConnection(ctx, input.organizationId);
  if (connection.revision !== input.revision)
    throw new BusinessError("STALE_JOB", 409);
  const initial = await ctx.db.googleBusinessLocation.findFirst({
    where: {
      id: input.locationId,
      organizationId: input.organizationId,
      connectionId: connection.id,
      cacheExpiresAt: { gt: new Date() },
    },
  });
  if (!initial) throw new BusinessError("STALE_JOB", 409);
  const runId = randomUUID(),
    startedAt = new Date();
  const lease = await ctx.db.googleBusinessLocation.updateMany({
    where: {
      id: initial.id,
      connection: {
        revision: input.revision,
        status: {
          notIn: ["DISCONNECTED", "REVOCATION_PENDING", "NEEDS_RECONNECT"],
        },
      },
      OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lt: startedAt } }],
    },
    data: {
      syncLeaseOwner: runId,
      syncLeaseUntil: new Date(Date.now() + 5 * 60000),
      syncStatus: "SYNCING",
      errorCode: null,
    },
  });
  if (!lease.count) return { skipped: true };
  const full =
    !initial.lastFullSyncAt ||
    Date.now() - initial.lastFullSyncAt.getTime() > 86400000;
  let nextPage: string | undefined,
    truncated = false,
    total: number | undefined,
    average: number | undefined;
  try {
    const token = await accessToken(ctx, connection);
    const profile = await ctx.provider.location(token, initial.locationName);
    for (let page = 0; page < 10; page++) {
      const data = await ctx.provider.reviews(
        token,
        initial.accountName,
        initial.locationName,
        nextPage,
      );
      if (page === 0) {
        total = data.totalReviewCount;
        average = data.averageRating;
      }
      const expiresAt = new Date(Date.now() + cacheLifetimeMs);
      await ctx.db.$transaction(async (tx) => {
        // Mutating the connection row takes the same lock as disconnect/reconnect.
        const active = await tx.googleBusinessConnection.updateMany({
          where: {
            id: connection.id,
            revision: input.revision,
            status: {
              notIn: ["DISCONNECTED", "REVOCATION_PENDING", "NEEDS_RECONNECT"],
            },
          },
          data: { updatedAt: new Date() },
        });
        if (!active.count) throw new BusinessError("STALE_JOB", 409);
        const location = await tx.googleBusinessLocation.findFirst({
          where: {
            id: initial.id,
            organizationId: input.organizationId,
            syncLeaseOwner: runId,
          },
        });
        if (!location) throw new BusinessError("STALE_JOB", 409);
        for (const review of data.reviews) {
          const updated = review.updateTime
            ? new Date(review.updateTime)
            : startedAt;
          await tx.googleReviewCache.upsert({
            where: {
              locationId_googleReviewId: {
                locationId: initial.id,
                googleReviewId: review.reviewId,
              },
            },
            create: {
              organizationId: input.organizationId,
              locationId: initial.id,
              googleReviewId: review.reviewId,
              content: review as Prisma.InputJsonValue,
              googleUpdatedAt: Number.isFinite(updated.getTime())
                ? updated
                : startedAt,
              cachedAt: new Date(),
              expiresAt,
              seenRunId: runId,
            },
            update: {
              content: review as Prisma.InputJsonValue,
              googleUpdatedAt: Number.isFinite(updated.getTime())
                ? updated
                : startedAt,
              cachedAt: new Date(),
              expiresAt,
              seenRunId: runId,
            },
          });
        }
        const excess = await tx.googleReviewCache.findMany({
          where: { locationId: initial.id },
          orderBy: [{ googleUpdatedAt: "desc" }, { id: "desc" }],
          skip: 500,
          select: { id: true },
        });
        if (excess.length)
          await tx.googleReviewCache.deleteMany({
            where: { id: { in: excess.map((item) => item.id) } },
          });
      });
      nextPage = data.nextPageToken;
      const older =
        !full &&
        initial.lastSyncAt &&
        data.reviews.length > 0 &&
        data.reviews.every(
          (review) =>
            review.updateTime &&
            Date.parse(review.updateTime) <
              initial.lastSyncAt!.getTime() - 5 * 60000,
        );
      if (!nextPage || older) {
        nextPage = undefined;
        break;
      }
      if (page === 9) truncated = true;
    }
    await ctx.db.$transaction(async (tx) => {
      const active = await tx.googleBusinessConnection.updateMany({
        where: {
          id: connection.id,
          revision: input.revision,
          status: {
            notIn: ["DISCONNECTED", "REVOCATION_PENDING", "NEEDS_RECONNECT"],
          },
        },
        data: { status: "CONNECTED", errorCode: null, retryAt: null },
      });
      if (!active.count) throw new BusinessError("STALE_JOB", 409);
      if (full)
        await tx.googleReviewCache.deleteMany({
          where: {
            locationId: initial.id,
            organizationId: input.organizationId,
            seenRunId: { not: runId },
          },
        });
      // Enforce the limited current-review cache even during incremental runs.
      const excess = await tx.googleReviewCache.findMany({
        where: { locationId: initial.id },
        orderBy: [{ googleUpdatedAt: "desc" }, { id: "desc" }],
        skip: 500,
        select: { id: true },
      });
      if (excess.length)
        await tx.googleReviewCache.deleteMany({
          where: { id: { in: excess.map((item) => item.id) } },
        });
      await tx.googleBusinessLocation.updateMany({
        where: {
          id: initial.id,
          organizationId: input.organizationId,
          syncLeaseOwner: runId,
        },
        data: {
          title: profile.title,
          verification: "VERIFIED",
          syncStatus: "IDLE",
          errorCode: null,
          lastSyncAt: startedAt,
          ...(full ? { lastFullSyncAt: startedAt } : {}),
          cacheExpiresAt: new Date(Date.now() + cacheLifetimeMs),
          googleTotalReviewCount: total ?? null,
          googleAverageRating: average ?? null,
          truncated: truncated || !!(total && total > 500),
          syncLeaseUntil: null,
          syncLeaseOwner: null,
        },
      });
    });
    return { skipped: false };
  } catch (error) {
    throw await recordFailure(ctx, connection, error);
  } finally {
    await ctx.db.googleBusinessLocation.updateMany({
      where: {
        id: initial.id,
        organizationId: input.organizationId,
        syncLeaseOwner: runId,
      },
      data: { syncLeaseUntil: null, syncLeaseOwner: null },
    });
  }
}

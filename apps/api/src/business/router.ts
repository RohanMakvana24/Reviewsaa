import { Router } from "express";
import { z } from "zod";
import type { AuthOptions } from "../auth/router.js";
import { sessionContext, writeSessionContext } from "../auth/service.js";
import {
  AuthError,
  randomToken,
  hashToken,
  challenge,
  readCookie,
  setAuthCookie,
  cookieName,
  equalToken,
} from "../auth/security.js";
import {
  BusinessError,
  businessState,
  usableConnection,
  accessToken,
  recordFailure,
  saveGrant,
  disconnectLocal,
  retryRevocation,
  hiddenContentStatuses,
  type BusinessContext,
  type SyncRequest,
  type Review,
} from "@reviesnest/google-business";
export type BusinessIntegration = {
  context?: BusinessContext;
  enqueue?: (request: SyncRequest) => Promise<void>;
};
export function businessRouter(
  auth: AuthOptions,
  integration: BusinessIntegration = {},
) {
  const { db, production, webOrigin } = auth,
    ctx = integration.context;
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  const base = "/organizations/:organizationId/google-business";
  async function allowed(userId: string, organizationId: string) {
    const member = await db.membership.findFirst({
      where: { organizationId, userId, organization: { status: "ACTIVE" } },
    });
    if (!member) throw new AuthError(404, "NOT_FOUND");
  }
  const configured = () => {
    if (!ctx) throw new BusinessError("BUSINESS_NOT_CONFIGURED", 503);
    return ctx;
  };
  async function connection(organizationId: string) {
    return usableConnection(configured(), organizationId);
  }
  async function googleCall<T>(
    organizationId: string,
    work: (
      context: BusinessContext,
      c: Awaited<ReturnType<typeof connection>>,
      token: string,
    ) => Promise<T>,
  ) {
    const c = await connection(organizationId);
    try {
      return await work(configured(), c, await accessToken(configured(), c));
    } catch (error) {
      throw await recordFailure(configured(), c, error);
    }
  }
  async function queueSync(
    organizationId: string,
    userId: string,
    requestId: string,
    initial = false,
  ) {
    const c = await connection(organizationId);
    if (!integration.enqueue)
      throw new BusinessError("QUEUE_UNAVAILABLE", 503, true);
    const location = await db.googleBusinessLocation.findUnique({
      where: { organizationId },
    });
    if (!location || location.cacheExpiresAt <= new Date())
      throw new BusinessError("SELECT_PROFILE_FIRST", 409);
    const changed = await db.googleBusinessLocation.updateMany({
      where: {
        id: location.id,
        connection: {
          revision: c.revision,
          status: {
            notIn: ["DISCONNECTED", "REVOCATION_PENDING", "NEEDS_RECONNECT"],
          },
        },
        ...(initial
          ? {}
          : {
              OR: [
                { lastSyncRequestedAt: null },
                {
                  lastSyncRequestedAt: { lt: new Date(Date.now() - 5 * 60000) },
                },
              ],
            }),
      },
      data: {
        syncStatus: "QUEUED",
        errorCode: null,
        lastSyncRequestedAt: new Date(),
      },
    });
    if (!changed.count)
      throw new BusinessError("SYNC_COOLDOWN", 429, true, 300);
    try {
      await integration.enqueue({
        organizationId,
        locationId: location.id,
        revision: c.revision,
      });
    } catch {
      await db.googleBusinessLocation.updateMany({
        where: { id: location.id, connection: { revision: c.revision } },
        data: {
          syncStatus: "ERROR",
          errorCode: "QUEUE_UNAVAILABLE",
          lastSyncRequestedAt: null,
        },
      });
      throw new BusinessError("QUEUE_UNAVAILABLE", 503, true);
    }
    await db.auditLog.create({
      data: {
        actorUserId: userId,
        organizationId,
        action: "GOOGLE_REVIEWS_SYNC_REQUESTED",
        targetId: location.id,
        requestId,
      },
    });
  }
  router.get(base, async (req, res) => {
    const session = await sessionContext(db, req, production);
    const org = String(req.params.organizationId);
    await allowed(session.userId, org);
    res.json(await businessState(db, org, !!ctx));
  });
  router.post(`${base}/connect`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    const context = configured();
    const c = await db.googleBusinessConnection.upsert({
      where: { organizationId: org },
      create: { organizationId: org, authorizedUserId: session.userId },
      update: {},
    });
    if (c.status === "REVOCATION_PENDING")
      throw new BusinessError("REVOCATION_PENDING", 409);
    const state = randomToken(),
      browser = randomToken(),
      verifier = randomToken(),
      nonce = randomToken(),
      stateHash = hashToken(state);
    await db.googleBusinessAttempt.create({
      data: {
        stateHash,
        organizationId: org,
        userId: session.userId,
        sessionId: session.id,
        revision: c.revision,
        encryptedVerifier: context.cipher.encrypt(
          verifier,
          `business-oauth:${org}:${stateHash}`,
        ),
        nonce,
        browserHash: hashToken(browser),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    setAuthCookie(res, production, "business", browser, 600);
    res.json({
      authorizationUrl: context.provider.authorizationUrl({
        state,
        nonce,
        challenge: challenge(verifier),
      }),
    });
  });
  router.get("/google-business/callback", async (req, res) => {
    const finish = (result: string) =>
      res.redirect(`${webOrigin}/onboarding?google=${result}`);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const browser = readCookie(req, cookieName(production, "business")) || "";
    setAuthCookie(res, production, "business", "", 0);
    if (!ctx || !browser || !/^[A-Za-z0-9_-]{43}$/.test(state))
      return finish("invalid_state");
    const attempt = await db.googleBusinessAttempt.findUnique({
      where: { stateHash: hashToken(state) },
    });
    if (
      !attempt ||
      attempt.expiresAt <= new Date() ||
      !equalToken(attempt.browserHash, hashToken(browser))
    )
      return finish("invalid_state");
    try {
      const session = await sessionContext(db, req, production);
      if (session.id !== attempt.sessionId || session.userId !== attempt.userId)
        return finish("invalid_state");
      await allowed(session.userId, attempt.organizationId);
      const consumed = await db.googleBusinessAttempt.deleteMany({
        where: { stateHash: attempt.stateHash, expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1) return finish("invalid_state");
      if (req.query.error) return finish("cancelled");
      if (typeof req.query.code !== "string" || req.query.code.length > 4096)
        return finish("failed");
      const grant = await ctx.provider.exchange(
        req.query.code,
        ctx.cipher.decrypt(
          attempt.encryptedVerifier,
          `business-oauth:${attempt.organizationId}:${attempt.stateHash}`,
        ),
        attempt.nonce,
      );
      await saveGrant(ctx, {
        organizationId: attempt.organizationId,
        userId: session.userId,
        revision: attempt.revision,
        grant,
        requestId: res.locals.requestId,
      });
      return finish("connected");
    } catch (error) {
      return finish(
        error instanceof BusinessError && error.code === "ACCOUNT_MISMATCH"
          ? "account_mismatch"
          : error instanceof BusinessError &&
              error.code === "REFRESH_TOKEN_REQUIRED"
            ? "reconnect"
            : "failed",
      );
    }
  });
  router.get(`${base}/accounts`, async (req, res) => {
    const session = await sessionContext(db, req, production),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    res.json(
      await googleCall(org, (context, _c, token) =>
        context.provider.accounts(token),
      ),
    );
  });
  router.get(`${base}/locations`, async (req, res) => {
    const session = await sessionContext(db, req, production),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    const query = z
      .object({
        accountName: z.string().regex(/^accounts\/[A-Za-z0-9_-]+$/),
        pageToken: z.string().max(2000).optional(),
      })
      .safeParse(req.query);
    if (!query.success) throw new AuthError(400, "INVALID_INPUT");
    const result = await googleCall(org, async (context, c, token) => {
      const accounts = await context.provider.accounts(token);
      if (
        !accounts.accounts.some(
          (account) => account.name === query.data.accountName,
        )
      )
        throw new BusinessError("ACCOUNT_NOT_ACCESSIBLE", 403);
      const page = await context.provider.locations(
        token,
        query.data.accountName,
        query.data.pageToken,
      );
      const candidates = await db.$transaction(async (tx) => {
        const active = await tx.googleBusinessConnection.updateMany({
          where: {
            id: c.id,
            revision: c.revision,
            status: {
              notIn: ["DISCONNECTED", "REVOCATION_PENDING", "NEEDS_RECONNECT"],
            },
          },
          data: { updatedAt: new Date() },
        });
        if (!active.count) throw new BusinessError("CONNECTION_CHANGED", 409);
        const out = [];
        for (const profile of page.locations) {
          const row = await tx.googleLocationCandidate.upsert({
            where: {
              connectionId_accountName_locationName: {
                connectionId: c.id,
                accountName: query.data.accountName,
                locationName: profile.name,
              },
            },
            create: {
              organizationId: org,
              connectionId: c.id,
              revision: c.revision,
              accountName: query.data.accountName,
              locationName: profile.name,
              title: profile.title,
              expiresAt: new Date(Date.now() + 600000),
            },
            update: {
              revision: c.revision,
              title: profile.title,
              expiresAt: new Date(Date.now() + 600000),
            },
          });
          out.push({ candidateId: row.id, title: row.title });
        }
        return out;
      });
      return {
        locations: candidates,
        nextPageToken: page.nextPageToken || null,
      };
    });
    res.json(result);
  });
  router.post(`${base}/location`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    const input = z
      .object({ candidateId: z.string().max(191) })
      .strict()
      .safeParse(req.body);
    if (!input.success) throw new AuthError(400, "INVALID_INPUT");
    await googleCall(org, async (context, c, token) => {
      const candidate = await db.googleLocationCandidate.findFirst({
        where: {
          id: input.data.candidateId,
          organizationId: org,
          connectionId: c.id,
          revision: c.revision,
          expiresAt: { gt: new Date() },
        },
      });
      if (!candidate) throw new BusinessError("PROFILE_LIST_EXPIRED", 409);
      const profile = await context.provider.location(
        token,
        candidate.locationName,
      );
      if (profile.name !== candidate.locationName)
        throw new BusinessError("INVALID_PROVIDER_RESPONSE");
      try {
        await db.$transaction(async (tx) => {
          const active = await tx.googleBusinessConnection.updateMany({
            where: {
              id: c.id,
              revision: c.revision,
              status: {
                notIn: [
                  "DISCONNECTED",
                  "REVOCATION_PENDING",
                  "NEEDS_RECONNECT",
                ],
              },
            },
            data: {
              revision: { increment: 1 },
              status: "CONNECTED",
              errorCode: null,
              retryAt: null,
            },
          });
          if (!active.count) throw new BusinessError("CONNECTION_CHANGED", 409);
          const existing = await tx.googleBusinessLocation.findUnique({
            where: { organizationId: org },
          });
          if (existing) {
            if (
              existing.locationName === candidate.locationName &&
              existing.accountName === candidate.accountName
            )
              return;
            throw new BusinessError("PROFILE_LIMIT_REACHED", 409);
          }
          await tx.googleBusinessLocation.create({
            data: {
              organizationId: org,
              connectionId: c.id,
              accountName: candidate.accountName,
              locationName: candidate.locationName,
              title: profile.title,
              cacheExpiresAt: new Date(Date.now() + 7 * 86400000),
            },
          });
          await tx.googleLocationCandidate.deleteMany({
            where: { connectionId: c.id },
          });
          await tx.auditLog.create({
            data: {
              actorUserId: session.userId,
              organizationId: org,
              action: "GOOGLE_PROFILE_SELECTED",
              requestId: res.locals.requestId,
            },
          });
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
        )
          throw new BusinessError("PROFILE_LIMIT_REACHED", 409);
        throw error;
      }
    });
    try {
      await queueSync(org, session.userId, res.locals.requestId, true);
    } catch (error) {
      if (
        !(error instanceof BusinessError) ||
        error.code !== "QUEUE_UNAVAILABLE"
      )
        throw error;
    }
    res.json(await businessState(db, org, !!ctx));
  });
  router.delete(`${base}/location`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    await db.$transaction(async (tx) => {
      await tx.googleBusinessConnection.updateMany({
        where: { organizationId: org },
        data: { revision: { increment: 1 } },
      });
      await tx.googleBusinessLocation.deleteMany({
        where: { organizationId: org },
      });
      await tx.googleLocationCandidate.deleteMany({
        where: { organizationId: org },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: session.userId,
          organizationId: org,
          action: "GOOGLE_PROFILE_CLEARED",
          requestId: res.locals.requestId,
        },
      });
    });
    res.json(await businessState(db, org, !!ctx));
  });
  router.post(`${base}/sync`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    await queueSync(org, session.userId, res.locals.requestId);
    res.status(202).json({ queued: true });
  });
  router.post(`${base}/disconnect`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    await disconnectLocal(db, {
      organizationId: org,
      userId: session.userId,
      requestId: res.locals.requestId,
    });
    if (ctx) await retryRevocation(ctx, org);
    res.json(await businessState(db, org, !!ctx));
  });
  router.post(`${base}/revoke-retry`, async (req, res) => {
    const session = await writeSessionContext(db, req, production, webOrigin),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    await retryRevocation(configured(), org);
    res.json(await businessState(db, org, !!ctx));
  });
  router.get(`${base}/reviews`, async (req, res) => {
    const session = await sessionContext(db, req, production),
      org = String(req.params.organizationId);
    await allowed(session.userId, org);
    const query = z
      .object({
        page: z.coerce.number().int().min(1).max(100).default(1),
        query: z.string().max(100).default(""),
        rating: z.coerce.number().int().min(1).max(5).optional(),
        reply: z.enum(["all", "replied", "unanswered"]).default("all"),
      })
      .safeParse(req.query);
    if (!query.success) throw new AuthError(400, "INVALID_INPUT");
    const state = await businessState(db, org, !!ctx);
    const location = state.location,
      visible =
        !!state.connection &&
        !hiddenContentStatuses.includes(state.connection.status);
    const rows =
      location && visible
        ? await db.googleReviewCache.findMany({
            where: {
              organizationId: org,
              locationId: location.id,
              expiresAt: { gt: new Date() },
            },
            orderBy: [{ googleUpdatedAt: "desc" }, { id: "desc" }],
            take: 500,
          })
        : [];
    const ratings: Record<string, number> = {
      ONE: 1,
      TWO: 2,
      THREE: 3,
      FOUR: 4,
      FIVE: 5,
    };
    const reviews = rows.map((row) => {
      const raw = row.content as unknown as Review;
      return {
        id: row.id,
        reviewerName: raw.reviewer?.displayName || null,
        rating: ratings[raw.starRating || ""] ?? null,
        comment: raw.comment ?? null,
        createTime: raw.createTime ?? null,
        updateTime: raw.updateTime ?? null,
        replyComment: raw.reviewReply?.comment ?? null,
        replyUpdatedAt: raw.reviewReply?.updateTime ?? null,
      };
    });
    const needle = query.data.query.toLocaleLowerCase();
    const filtered = reviews.filter(
      (review) =>
        (!query.data.rating || review.rating === query.data.rating) &&
        (!needle ||
          `${review.reviewerName || ""} ${review.comment || ""}`
            .toLocaleLowerCase()
            .includes(needle)) &&
        (query.data.reply === "all" ||
          (query.data.reply === "replied"
            ? review.replyComment !== null
            : review.replyComment === null)),
    );
    const start = (query.data.page - 1) * 25;
    res.json({
      reviews: filtered.slice(start, start + 25),
      page: query.data.page,
      pageSize: 25,
      cachedCount: reviews.length,
      totalMatched: filtered.length,
      googleTotalReviewCount: visible
        ? (location?.googleTotalReviewCount ?? null)
        : null,
      googleAverageRating: visible
        ? (location?.googleAverageRating ?? null)
        : null,
      lastSyncedAt: visible ? (location?.lastSyncAt ?? null) : null,
      truncated: location?.truncated ?? false,
      nextPage: start + 25 < filtered.length,
    });
  });
  return router;
}

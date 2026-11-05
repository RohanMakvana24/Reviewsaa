import { Router, type Request, type Response } from "express";
import type { PrismaClient } from "@prisma/client";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import type { GoogleProvider } from "./google.js";
import {
  AuthError,
  challenge,
  cookieName,
  equalToken,
  hashToken,
  randomToken,
  readCookie,
  setAuthCookie,
} from "./security.js";
import {
  provisionUser,
  sessionContext,
  sessionDto,
  sessionLifetimeSeconds,
} from "./service.js";
import { defaultProductConfig, type ProductConfig } from "../product/config.js";
export type AuthOptions = {
  db: PrismaClient;
  webOrigin: string;
  production: boolean;
  google?: GoogleProvider;
  product?: ProductConfig;
};
export function authRouter({
  db,
  webOrigin,
  production,
  google,
  product = defaultProductConfig,
}: AuthOptions) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  function sameOrigin(req: Request) {
    if (req.get("origin") !== webOrigin)
      throw new AuthError(403, "CSRF_REJECTED");
  }
  async function authenticated(req: Request) {
    return sessionContext(db, req, production);
  }
  async function writeContext(req: Request) {
    sameOrigin(req);
    const context = await authenticated(req);
    if (!equalToken(req.get("x-csrf-token") || "", context.csrfToken))
      throw new AuthError(403, "CSRF_REJECTED");
    return context;
  }
  function clearSession(res: Response) {
    setAuthCookie(res, production, "session", "", 0);
  }
  router.get("/auth/config", (_req, res) =>
    res.json({ googleConfigured: !!google }),
  );
  router.get("/auth/google", loginLimit, async (req, res) => {
    if (!google) throw new AuthError(503, "GOOGLE_NOT_CONFIGURED");
    const state = randomToken(),
      browser = randomToken(),
      verifier = randomToken(),
      nonce = randomToken();
    await db.oAuthAttempt.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await db.oAuthAttempt.create({
      data: {
        stateHash: hashToken(state),
        browserHash: hashToken(browser),
        verifier,
        nonce,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    setAuthCookie(res, production, "oauth", browser, 600);
    res.redirect(
      google.authorizationUrl({ state, nonce, challenge: challenge(verifier) }),
    );
  });
  router.get("/auth/google/callback", loginLimit, async (req, res) => {
    const redirectError = (code: string) =>
      res.redirect(`${webOrigin}/login?error=${code}`);
    if (!google) return redirectError("unavailable");
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const browser = readCookie(req, cookieName(production, "oauth")) || "";
    setAuthCookie(res, production, "oauth", "", 0);
    if (!/^[A-Za-z0-9_-]{43}$/.test(state) || !browser)
      return redirectError("invalid_state");
    const pending = await db.oAuthAttempt.findUnique({
      where: { stateHash: hashToken(state) },
    });
    if (
      !pending ||
      pending.expiresAt <= new Date() ||
      !equalToken(pending.browserHash, hashToken(browser))
    )
      return redirectError("invalid_state");
    // Atomically consume state. Neither a replay nor a concurrent callback can create a session.
    const consumed = await db.oAuthAttempt.deleteMany({
      where: {
        stateHash: pending.stateHash,
        browserHash: pending.browserHash,
        expiresAt: { gt: new Date() },
      },
    });
    if (consumed.count !== 1) return redirectError("invalid_state");
    if (req.query.error) return redirectError("cancelled");
    if (typeof req.query.code !== "string" || req.query.code.length > 4096)
      return redirectError("failed");
    try {
      const identity = await google.identity(
        req.query.code,
        pending.verifier,
        pending.nonce,
      );
      const user = await provisionUser(
        db,
        identity,
        res.locals.requestId,
        product,
      );
      const token = randomToken(),
        csrfToken = randomToken();
      await db.$transaction(async (tx) => {
        // Re-check within login transaction so disabled accounts cannot acquire valid access.
        const active = await tx.user.findUnique({ where: { id: user.id } });
        if (active?.status !== "ACTIVE")
          throw new AuthError(403, "ACCOUNT_DISABLED");
        const previous = readCookie(req, cookieName(production, "session"));
        if (previous)
          await tx.session.deleteMany({
            where: { tokenHash: hashToken(previous) },
          });
        await tx.session.deleteMany({
          where: { expiresAt: { lte: new Date() } },
        });
        await tx.session.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            csrfToken,
            expiresAt: new Date(Date.now() + sessionLifetimeSeconds * 1000),
          },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: user.id,
            action: "LOGIN",
            targetId: user.id,
            requestId: res.locals.requestId,
          },
        });
      });
      setAuthCookie(res, production, "session", token, sessionLifetimeSeconds);
      const firstMembership = await db.membership.findFirst({
        where: { userId: user.id, organization: { status: "ACTIVE" } },
        orderBy: { createdAt: "asc" },
        include: { organization: { include: { onboarding: true } } },
      });
      const setup = firstMembership?.organization.onboarding;
      const destination =
        user.role === "SUPER_ADMIN"
          ? "/admin"
          : setup?.businessSavedAt && setup?.qrSavedAt
            ? "/dashboard"
            : "/onboarding";
      return res.redirect(`${webOrigin}${destination}`);
    } catch (error) {
      clearSession(res);
      return redirectError(
        error instanceof AuthError && error.code === "ACCOUNT_DISABLED"
          ? "disabled"
          : "failed",
      );
    }
  });
  router.get("/auth/me", async (req, res) => {
    const context = await authenticated(req);
    res.json(sessionDto(context));
  });
  router.post("/auth/logout", async (req, res) => {
    const context = await writeContext(req);
    await db.$transaction([
      db.session.deleteMany({ where: { id: context.id } }),
      db.auditLog.create({
        data: {
          actorUserId: context.userId,
          action: "LOGOUT",
          targetId: context.userId,
          requestId: res.locals.requestId,
        },
      }),
    ]);
    clearSession(res);
    res.status(204).end();
  });
  router.patch("/auth/account", async (req, res) => {
    const context = await writeContext(req);
    const data = z
      .object({ name: z.string().trim().min(1).max(100) })
      .strict()
      .safeParse(req.body);
    if (!data.success) throw new AuthError(400, "INVALID_INPUT");
    await db.$transaction([
      db.user.update({ where: { id: context.userId }, data: data.data }),
      db.auditLog.create({
        data: {
          actorUserId: context.userId,
          action: "ACCOUNT_UPDATED",
          targetId: context.userId,
          requestId: res.locals.requestId,
        },
      }),
    ]);
    res.json({ name: data.data.name });
  });
  router.get("/organizations/:organizationId", async (req, res) => {
    const context = await authenticated(req);
    const organizationId = String(req.params.organizationId);
    const membership = await db.membership.findFirst({
      where: {
        organizationId,
        userId: context.userId,
        organization: { status: "ACTIVE" },
      },
      select: {
        organization: { select: { id: true, name: true, status: true } },
      },
    });
    if (!membership) throw new AuthError(404, "NOT_FOUND");
    res.json({ organization: membership.organization });
  });
  router.patch("/organizations/:organizationId", async (req, res) => {
    const context = await writeContext(req);
    const organizationId = String(req.params.organizationId);
    const data = z
      .object({ name: z.string().trim().min(1).max(100) })
      .strict()
      .safeParse(req.body);
    if (!data.success) throw new AuthError(400, "INVALID_INPUT");
    // Scope mutation in SQL, not just a preflight check. Tenant IDs never grant access.
    await db.$transaction(async (tx) => {
      const changed = await tx.organization.updateMany({
        where: {
          id: organizationId,
          status: "ACTIVE",
          memberships: { some: { userId: context.userId } },
        },
        data: data.data,
      });
      if (changed.count !== 1) throw new AuthError(404, "NOT_FOUND");
      await tx.auditLog.create({
        data: {
          actorUserId: context.userId,
          organizationId,
          action: "ORGANIZATION_UPDATED",
          targetId: organizationId,
          requestId: res.locals.requestId,
        },
      });
    });
    res.json({ organization: { id: organizationId, name: data.data.name } });
  });
  router.get("/admin/organizations", async (req, res) => {
    const context = await authenticated(req);
    if (context.user.role !== "SUPER_ADMIN")
      throw new AuthError(403, "FORBIDDEN");
    const organizations = await db.organization.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true, createdAt: true },
    });
    res.json({ organizations });
  });
  router.patch("/admin/users/:userId/status", async (req, res) => {
    const context = await writeContext(req);
    if (context.user.role !== "SUPER_ADMIN")
      throw new AuthError(403, "FORBIDDEN");
    const data = z
      .object({ status: z.enum(["ACTIVE", "DISABLED"]) })
      .strict()
      .safeParse(req.body);
    if (!data.success) throw new AuthError(400, "INVALID_INPUT");
    const userId = String(req.params.userId);
    if (userId === context.userId)
      throw new AuthError(400, "SELF_STATUS_CHANGE_FORBIDDEN");
    const exists = await db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!exists) throw new AuthError(404, "NOT_FOUND");
    await db.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: data.data });
      if (data.data.status === "DISABLED")
        await tx.session.deleteMany({ where: { userId } });
      await tx.auditLog.create({
        data: {
          actorUserId: context.userId,
          action:
            data.data.status === "DISABLED"
              ? "ACCOUNT_DISABLED"
              : "ACCOUNT_ENABLED",
          targetId: userId,
          requestId: res.locals.requestId,
        },
      });
    });
    res.status(204).end();
  });
  return router;
}

import type { PrismaClient } from "@prisma/client";
import type { Request } from "express";
import {
  AuthError,
  cookieName,
  hashToken,
  readCookie,
  equalToken,
} from "./security.js";
import type { GoogleIdentity } from "./google.js";
import { createTrial } from "../product/trial.js";
import { defaultProductConfig, type ProductConfig } from "../product/config.js";
export const sessionLifetimeSeconds = 7 * 24 * 60 * 60;
export async function sessionContext(
  db: PrismaClient,
  req: Request,
  production: boolean,
) {
  const token = readCookie(req, cookieName(production, "session"));
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new AuthError(401, "UNAUTHENTICATED");
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: { include: { memberships: { include: { organization: true } } } },
    },
  });
  if (!session || session.expiresAt <= new Date())
    throw new AuthError(401, "SESSION_EXPIRED");
  if (session.user.status !== "ACTIVE")
    throw new AuthError(403, "ACCOUNT_DISABLED");
  return session;
}
export type SessionContext = Awaited<ReturnType<typeof sessionContext>>;
export function sessionDto(session: SessionContext) {
  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    organizations: session.user.memberships
      .filter((m) => m.organization.status === "ACTIVE")
      .map((m) => ({ id: m.organization.id, name: m.organization.name })),
    csrfToken: session.csrfToken,
    expiresAt: session.expiresAt.toISOString(),
  };
}
export async function provisionUser(
  db: PrismaClient,
  identity: GoogleIdentity,
  requestId: string,
  product: ProductConfig = defaultProductConfig,
) {
  // Retry uniqueness/serialization races; first login creates one atomic owner workspace.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.user.findUnique({
            where: { googleSubject: identity.subject },
          });
          if (existing) {
            if (existing.status !== "ACTIVE")
              throw new AuthError(403, "ACCOUNT_DISABLED");
            return tx.user.update({
              where: { id: existing.id },
              data: { email: identity.email },
            });
          }
          const user = await tx.user.create({
            data: {
              googleSubject: identity.subject,
              email: identity.email,
              name: identity.name,
            },
          });
          const org = await tx.organization.create({
            data: {
              name: `${identity.name.slice(0, 80)}’s workspace`,
              memberships: { create: { userId: user.id } },
            },
          });
          await createTrial(tx, identity, org.id, org.createdAt, product);
          await tx.auditLog.create({
            data: {
              actorUserId: user.id,
              organizationId: org.id,
              action: "ACCOUNT_CREATED",
              targetId: user.id,
              requestId,
            },
          });
          return user;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (
        attempt < 2 &&
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        ["P2002", "P2034"].includes(String(error.code))
      )
        continue;
      throw error;
    }
  }
  throw new Error("Provision failed");
}

export async function writeSessionContext(
  db: PrismaClient,
  req: Request,
  production: boolean,
  webOrigin: string,
) {
  if (req.get("origin") !== webOrigin)
    throw new AuthError(403, "CSRF_REJECTED");
  const context = await sessionContext(db, req, production);
  if (!equalToken(req.get("x-csrf-token") || "", context.csrfToken))
    throw new AuthError(403, "CSRF_REJECTED");
  return context;
}

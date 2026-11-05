import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import type { AuthOptions } from "../auth/router.js";
import { sessionContext, writeSessionContext } from "../auth/service.js";
import { AuthError } from "../auth/security.js";
import { publicConfig, defaultProductConfig } from "./config.js";
import { workspace } from "./workspace.js";
const businessInput = z
  .object({
    step: z.literal("business"),
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .regex(/^[+0-9 ()-]*$/)
      .default(""),
  })
  .strict();
const qrInput = z
  .object({
    step: z.literal("qr"),
    greeting: z.string().trim().min(1).max(160),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })
  .strict();
const inquiryInput = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.email().max(320),
    business: z.string().trim().max(100).default(""),
    message: z.string().trim().min(10).max(2000),
    website: z.string().max(1000).default(""),
  })
  .strict();
export function productRouter({
  db,
  webOrigin,
  production,
  product = defaultProductConfig,
}: AuthOptions) {
  const router = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  router.get("/public/config", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json(publicConfig(product));
  });
  const contactLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  router.post("/public/contact", contactLimit, async (req, res) => {
    if (req.get("origin") !== webOrigin)
      throw new AuthError(403, "CSRF_REJECTED");
    const data = inquiryInput.safeParse(req.body);
    if (!data.success) throw new AuthError(400, "INVALID_INPUT");
    if (!data.data.website) {
      const { name, email, business, message } = data.data;
      await db.contactInquiry.create({
        data: { name, email, business, message },
      });
    }
    res.status(202).json({ received: true });
  });
  router.get("/organizations/:organizationId/onboarding", async (req, res) => {
    const session = await sessionContext(db, req, production);
    res.json(
      await workspace(db, String(req.params.organizationId), session.userId),
    );
  });
  router.patch(
    "/organizations/:organizationId/onboarding",
    async (req, res) => {
      const session = await writeSessionContext(db, req, production, webOrigin);
      const organizationId = String(req.params.organizationId);
      const input = z
        .discriminatedUnion("step", [businessInput, qrInput])
        .safeParse(req.body);
      if (!input.success) throw new AuthError(400, "INVALID_INPUT");
      await db.$transaction(async (tx) => {
        // Lock and authorize the workspace through the same mutation predicate.
        const allowed = await tx.organization.updateMany({
          where: {
            id: organizationId,
            status: "ACTIVE",
            memberships: { some: { userId: session.userId } },
          },
          data: { updatedAt: new Date() },
        });
        if (allowed.count !== 1) throw new AuthError(404, "NOT_FOUND");
        if (input.data.step === "business") {
          const { name, category, city, phone } = input.data;
          await tx.organization.update({
            where: { id: organizationId },
            data: { name },
          });
          await tx.businessOnboarding.upsert({
            where: { organizationId },
            create: {
              organizationId,
              category,
              city,
              phone,
              businessSavedAt: new Date(),
            },
            update: { category, city, phone, businessSavedAt: new Date() },
          });
        } else {
          const existing = await tx.businessOnboarding.findUnique({
            where: { organizationId },
          });
          if (!existing?.businessSavedAt)
            throw new AuthError(409, "BUSINESS_DETAILS_REQUIRED");
          const { greeting, accentColor } = input.data;
          await tx.businessOnboarding.update({
            where: { organizationId },
            data: { greeting, accentColor, qrSavedAt: new Date() },
          });
        }
        await tx.auditLog.create({
          data: {
            actorUserId: session.userId,
            organizationId,
            action:
              input.data.step === "business"
                ? "ONBOARDING_BUSINESS_SAVED"
                : "ONBOARDING_QR_DRAFT_SAVED",
            targetId: organizationId,
            requestId: res.locals.requestId,
          },
        });
      });
      res.json(await workspace(db, organizationId, session.userId));
    },
  );
  router.get("/admin/contact-inquiries", async (req, res) => {
    const session = await sessionContext(db, req, production);
    if (session.user.role !== "SUPER_ADMIN")
      throw new AuthError(403, "FORBIDDEN");
    const inquiries = await db.contactInquiry.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        business: true,
        message: true,
        createdAt: true,
      },
    });
    res.json({ inquiries });
  });
  return router;
}

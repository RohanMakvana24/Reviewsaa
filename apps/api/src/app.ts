import { randomUUID } from "node:crypto";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import pino from "pino";
import { healthResponseSchema } from "@reviesnest/contracts";
import { authRouter, type AuthOptions } from "./auth/router.js";
import { productRouter } from "./product/router.js";
import { businessRouter, type BusinessIntegration } from "./business/router.js";
import { BusinessError } from "@reviesnest/google-business";
import { AuthError } from "./auth/security.js";
const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
});
type Options = {
  webOrigin: string;
  checkDependencies: () => Promise<void>;
  auth?: AuthOptions;
  business?: BusinessIntegration;
};
export function createApp({
  webOrigin,
  checkDependencies,
  auth,
  business,
}: Options) {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.setHeader("X-Request-Id", res.locals.requestId);
    next();
  });
  app.use(helmet());
  app.use(cors({ origin: webOrigin, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use((req, res, next) => {
    res.on("finish", () =>
      logger.info(
        {
          requestId: res.locals.requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
        },
        "request",
      ),
    );
    next();
  });
  app.get("/health/live", (_req, res) => {
    res.json(
      healthResponseSchema.parse({
        status: "ok",
        service: "api",
        requestId: res.locals.requestId,
      }),
    );
  });
  app.get("/health/ready", async (_req, res) => {
    try {
      await checkDependencies();
      res.json({
        status: "ok",
        service: "api",
        requestId: res.locals.requestId,
      });
    } catch {
      res.status(503).json({
        status: "unavailable",
        service: "api",
        requestId: res.locals.requestId,
      });
    }
  });
  if (auth) {
    app.use(authRouter(auth));
    app.use(productRouter(auth));
    app.use(businessRouter(auth, business));
  }
  app.use((_req, res) => {
    res
      .status(404)
      .json({ error: "NOT_FOUND", requestId: res.locals.requestId });
  });
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof BusinessError) {
      if (err.status === 429)
        res.setHeader("Retry-After", err.retryAfterSeconds);
      res
        .status(err.code === "NEEDS_RECONNECT" ? 409 : err.status)
        .json({
          error: err.code,
          requestId: res.locals.requestId,
          retryAfterSeconds: err.retryAfterSeconds,
        });
      return;
    }
    if (err instanceof AuthError) {
      res
        .status(err.status)
        .json({ error: err.code, requestId: res.locals.requestId });
      return;
    }
    const invalidJson =
      err instanceof SyntaxError && "status" in err && err.status === 400;
    const tooLarge =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      err.status === 413;
    logger.error(
      {
        requestId: res.locals.requestId,
        errorType: err instanceof Error ? err.name : "Unknown",
      },
      "request failed",
    );
    res.status(invalidJson ? 400 : tooLarge ? 413 : 500).json({
      error: invalidJson
        ? "INVALID_JSON"
        : tooLarge
          ? "BODY_TOO_LARGE"
          : "INTERNAL_ERROR",
      requestId: res.locals.requestId,
    });
  };
  app.use(errorHandler);
  return app;
}

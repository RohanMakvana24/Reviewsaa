import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import { z } from "zod";
import pino from "pino";
import { googleProvider } from "./auth/google.js";
import { Queue } from "bullmq";
import {
  googleBusinessProvider,
  TokenCipher,
  googleQuota,
  type BusinessContext,
} from "@reviesnest/google-business";
import { createApp } from "./app.js";
const env = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    WEB_ORIGIN: z.url(),
    DATABASE_URL: z.string().min(1),
    REDIS_URL: z.url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    TRIAL_AI_ALLOWANCE: z.coerce.number().int().min(1).max(10000).default(20),
    BASIC_MONTHLY_PRICE_INR: z.coerce.number().int().min(1).default(99),
    PAID_AI_ALLOWANCE: z.coerce.number().int().min(1).default(30),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_REDIRECT_URI: z.url().optional(),
    GOOGLE_BUSINESS_REDIRECT_URI: z.url().optional(),
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
  })
  .parse(process.env);
if (env.NODE_ENV === "production" && !env.WEB_ORIGIN.startsWith("https://"))
  throw new Error("Production WEB_ORIGIN must use HTTPS");
const googleFields = [
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI,
];
if (googleFields.some(Boolean) && !googleFields.every(Boolean))
  throw new Error("Configure all three Google OAuth settings");
if (
  env.GOOGLE_REDIRECT_URI &&
  env.GOOGLE_REDIRECT_URI !== `${env.WEB_ORIGIN}/api/auth/google/callback`
)
  throw new Error(
    "GOOGLE_REDIRECT_URI must match WEB_ORIGIN/api/auth/google/callback",
  );
const log = pino();
const db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  commandTimeout: 2000,
  enableOfflineQueue: false,
});
redis.on("error", () => log.warn("Redis connection unavailable"));
const businessQueue = new Queue("google-business", { connection: redis });
businessQueue.on("error", () => log.warn("Google Business queue unavailable"));
const businessRedirect =
  env.GOOGLE_BUSINESS_REDIRECT_URI ||
  `${env.WEB_ORIGIN}/api/google-business/callback`;
if (businessRedirect !== `${env.WEB_ORIGIN}/api/google-business/callback`)
  throw new Error(
    "Google Business redirect must match WEB_ORIGIN/api/google-business/callback",
  );
const businessContext: BusinessContext | undefined =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENCRYPTION_KEY
    ? {
        db,
        cipher: new TokenCipher(env.TOKEN_ENCRYPTION_KEY),
        provider: googleBusinessProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          redirectUri: businessRedirect,
          beforeRequest: googleQuota(redis),
        }),
      }
    : undefined;
const app = createApp({
  business: {
    context: businessContext,
    enqueue: async (data) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await Promise.race([
          businessQueue.add("sync", data, {
            jobId: `${data.locationId}-${data.revision}-${Math.floor(Date.now() / 300000)}`,
            attempts: 5,
            backoff: { type: "exponential", delay: 3000 },
            removeOnComplete: { age: 3600 },
            removeOnFail: { age: 86400 },
          }),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("Queue timeout")), 5000);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
  },
  webOrigin: env.WEB_ORIGIN,
  auth: {
    db,
    product: {
      trialAiAllowance: env.TRIAL_AI_ALLOWANCE,
      priceMonthlyInr: env.BASIC_MONTHLY_PRICE_INR,
      paidAiAllowance: env.PAID_AI_ALLOWANCE,
    },
    webOrigin: env.WEB_ORIGIN,
    production: env.NODE_ENV === "production",
    google:
      env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET &&
      env.GOOGLE_REDIRECT_URI
        ? googleProvider(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET,
            env.GOOGLE_REDIRECT_URI,
          )
        : undefined,
  },
  checkDependencies: async () => {
    await Promise.all([db.$queryRaw`SELECT 1`, redis.ping()]);
  },
});
const server = app.listen(env.PORT, () =>
  log.info({ port: env.PORT }, "API listening"),
);
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 10000).unref();
  server.close(async () => {
    await businessQueue.close();
    await db.$disconnect();
    redis.disconnect();
    clearTimeout(deadline);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

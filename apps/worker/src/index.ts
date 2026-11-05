import "dotenv/config";
import { Worker, Queue, UnrecoverableError } from "bullmq";
import { Redis } from "ioredis";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import pino from "pino";
import {
  BusinessError,
  TokenCipher,
  googleBusinessProvider,
  googleQuota,
  syncReviews,
  cleanupExpiredContent,
  retryRevocation,
  type BusinessContext,
  type SyncRequest,
} from "@reviesnest/google-business";
const env = z
  .object({
    REDIS_URL: z.url(),
    DATABASE_URL: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_BUSINESS_REDIRECT_URI: z
      .url()
      .default("http://localhost:3000/api/google-business/callback"),
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
  })
  .parse(process.env);
const log = pino(),
  db = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
connection.on("error", () => log.warn("Redis connection unavailable"));
const context: BusinessContext | undefined =
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.TOKEN_ENCRYPTION_KEY
    ? {
        db,
        cipher: new TokenCipher(env.TOKEN_ENCRYPTION_KEY),
        provider: googleBusinessProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          redirectUri: env.GOOGLE_BUSINESS_REDIRECT_URI,
          beforeRequest: googleQuota(connection),
        }),
      }
    : undefined;
const businessQueue = new Queue("google-business", { connection });
async function enqueue(data: SyncRequest) {
  await businessQueue.add("sync", data, {
    jobId: `${data.locationId}-${data.revision}-${Math.floor(Date.now() / 300000)}`,
    attempts: 5,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  });
}
const worker = new Worker(
  "google-business",
  async (job) => {
    const data = z
      .object({
        organizationId: z.string(),
        locationId: z.string(),
        revision: z.number().int().positive(),
      })
      .parse(job.data);
    if (job.name !== "sync" || !context)
      throw new UnrecoverableError("BUSINESS_NOT_CONFIGURED");
    try {
      return await syncReviews(context, data);
    } catch (error) {
      if (error instanceof BusinessError && !error.retryable)
        throw new UnrecoverableError(error.code);
      throw error;
    }
  },
  { connection, concurrency: 2, limiter: { max: 4, duration: 1000 } },
);
worker.on("error", () => log.warn("Google Business worker unavailable"));
worker.on("failed", (job) =>
  log.warn({ jobId: job?.id }, "Google review job failed"),
);
const infrastructureQueue = new Queue("infrastructure", { connection });
const maintenance = new Worker(
  "infrastructure",
  async (job) => {
    if (job.name !== "heartbeat")
      throw new UnrecoverableError("UNSUPPORTED_JOB");
    await cleanupExpiredContent(db);
    if (context) {
      const pending = await db.googleBusinessConnection.findMany({
        where: {
          status: "REVOCATION_PENDING",
          OR: [{ retryAt: null }, { retryAt: { lte: new Date() } }],
        },
        take: 20,
        select: { organizationId: true },
      });
      for (const item of pending)
        await retryRevocation(context, item.organizationId);
      const selected = await db.googleBusinessLocation.findMany({
        where: {
          cacheExpiresAt: { gt: new Date() },
          OR: [
            { lastSyncAt: null },
            { lastSyncAt: { lt: new Date(Date.now() - 15 * 60000) } },
          ],
          connection: {
            status: { in: ["CONNECTED", "RATE_LIMITED", "PROVIDER_ERROR"] },
            organization: { status: "ACTIVE" },
            authorizedUser: { status: "ACTIVE" },
            OR: [{ retryAt: null }, { retryAt: { lte: new Date() } }],
          },
        },
        orderBy: { lastSyncAt: "asc" },
        take: 50,
        include: { connection: true },
      });
      for (const item of selected)
        await enqueue({
          organizationId: item.organizationId,
          locationId: item.id,
          revision: item.connection.revision,
        });
    }
    log.info("Infrastructure maintenance complete");
  },
  { connection, concurrency: 1 },
);
maintenance.on("error", () => log.warn("Maintenance worker unavailable"));
maintenance.on("failed", (job) =>
  log.warn({ jobId: job?.id }, "Maintenance failed"),
);
await infrastructureQueue.upsertJobScheduler(
  "worker-heartbeat",
  { every: 60000 },
  {
    name: "heartbeat",
    data: {},
    opts: { removeOnComplete: 5, removeOnFail: 5 },
  },
);
log.info({ businessConfigured: !!context }, "Worker ready");
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timer = setTimeout(() => process.exit(1), 15000).unref();
  await Promise.all([worker.close(), maintenance.close()]);
  await Promise.all([businessQueue.close(), infrastructureQueue.close()]);
  connection.disconnect();
  await db.$disconnect();
  clearTimeout(timer);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

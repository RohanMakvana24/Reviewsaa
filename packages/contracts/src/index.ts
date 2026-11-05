import { z } from "zod";
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "unavailable"]),
  service: z.string(),
  requestId: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["OWNER", "SUPER_ADMIN"]),
  }),
  organizations: z.array(z.object({ id: z.string(), name: z.string() })),
  csrfToken: z.string(),
  expiresAt: z.string(),
});
export type AuthSession = z.infer<typeof sessionResponseSchema>;

export const publicConfigSchema = z.object({
  priceMonthlyInr: z.number(),
  paidAiAllowance: z.number(),
  trialDays: z.literal(14),
  trialAiAllowance: z.number(),
  integrations: z.object({
    googleBusiness: z.boolean(),
    aiReplies: z.boolean(),
    payments: z.boolean(),
  }),
  contactAvailable: z.boolean(),
});
export type PublicConfig = z.infer<typeof publicConfigSchema>;
export const trialSummarySchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "EXHAUSTED", "UNAVAILABLE"]),
  startedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  allowance: z.number(),
  used: z.number(),
  remaining: z.number(),
  daysRemaining: z.number(),
  serverNow: z.string(),
});
export type TrialSummary = z.infer<typeof trialSummarySchema>;
export const workspaceSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string() }),
  trial: trialSummarySchema,
  onboarding: z.object({
    business: z
      .object({
        name: z.string(),
        category: z.string(),
        city: z.string(),
        phone: z.string(),
      })
      .nullable(),
    qr: z.object({ greeting: z.string(), accentColor: z.string() }).nullable(),
    businessSaved: z.boolean(),
    qrSaved: z.boolean(),
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "AWAITING_GOOGLE", "READY"]),
    steps: z.array(
      z.object({
        key: z.enum(["business", "google", "location", "qr"]),
        status: z.enum(["complete", "pending", "blocked"]),
      }),
    ),
  }),
});
export type Workspace = z.infer<typeof workspaceSchema>;

export const googleBusinessStateSchema = z.object({
  configured: z.boolean(),
  connection: z
    .object({
      status: z.string(),
      errorCode: z.string().nullable(),
      retryAt: z.string().nullable(),
      connectedAt: z.string().nullable(),
    })
    .nullable(),
  location: z
    .object({
      id: z.string(),
      title: z.string(),
      verification: z.enum(["UNKNOWN", "VERIFIED", "UNVERIFIED"]),
      syncStatus: z.enum(["IDLE", "QUEUED", "SYNCING", "ERROR"]),
      errorCode: z.string().nullable(),
      lastSyncAt: z.string().nullable(),
      cacheExpiresAt: z.string(),
      truncated: z.boolean(),
      googleTotalReviewCount: z.number().nullable(),
      googleAverageRating: z.number().nullable(),
    })
    .nullable(),
});
export type GoogleBusinessState = z.infer<typeof googleBusinessStateSchema>;
export const googleAccountsSchema = z.object({
  accounts: z.array(z.object({ name: z.string(), accountName: z.string() })),
  truncated: z.boolean(),
});
export const googleLocationsSchema = z.object({
  locations: z.array(z.object({ candidateId: z.string(), title: z.string() })),
  nextPageToken: z.string().nullable(),
});
export const googleReviewsSchema = z.object({
  reviews: z.array(
    z.object({
      id: z.string(),
      reviewerName: z.string().nullable(),
      rating: z.number().nullable(),
      comment: z.string().nullable(),
      createTime: z.string().nullable(),
      updateTime: z.string().nullable(),
      replyComment: z.string().nullable(),
      replyUpdatedAt: z.string().nullable(),
    }),
  ),
  page: z.number(),
  pageSize: z.number(),
  cachedCount: z.number(),
  totalMatched: z.number(),
  googleTotalReviewCount: z.number().nullable(),
  googleAverageRating: z.number().nullable(),
  lastSyncedAt: z.string().nullable(),
  truncated: z.boolean(),
  nextPage: z.boolean(),
});
export type GoogleReviews = z.infer<typeof googleReviewsSchema>;

import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { BusinessError } from "./crypto.js";
export const BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";
export type Grant = {
  subject: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scopes: string[];
};
export type RefreshGrant = {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
};
export type Review = Record<string, unknown> & {
  reviewId: string;
  starRating?: string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewer?: { displayName?: string };
  reviewReply?: { comment?: string; updateTime?: string };
};
export type ReviewPage = {
  reviews: Review[];
  averageRating?: number;
  totalReviewCount?: number;
  nextPageToken?: string;
};
export interface BusinessProvider {
  authorizationUrl(input: {
    state: string;
    nonce: string;
    challenge: string;
  }): string;
  exchange(code: string, verifier: string, nonce: string): Promise<Grant>;
  refresh(refreshToken: string): Promise<RefreshGrant>;
  revoke(refreshToken: string): Promise<void>;
  accounts(
    token: string,
  ): Promise<{
    accounts: { name: string; accountName: string }[];
    truncated: boolean;
  }>;
  locations(
    token: string,
    account: string,
    pageToken?: string,
  ): Promise<{
    locations: { name: string; title: string }[];
    nextPageToken?: string;
  }>;
  location(
    token: string,
    name: string,
  ): Promise<{ name: string; title: string }>;
  reviews(
    token: string,
    account: string,
    location: string,
    pageToken?: string,
  ): Promise<ReviewPage>;
}
const accountPattern = /^accounts\/[A-Za-z0-9_-]+$/;
const locationPattern = /^locations\/[A-Za-z0-9_-]+$/;
function resource(name: string, pattern: RegExp) {
  if (!pattern.test(name))
    throw new BusinessError("INVALID_GOOGLE_RESOURCE", 400);
  return name;
}
const grantSchema = z.object({
  access_token: z.string().min(1).max(16384),
  refresh_token: z.string().min(1).max(16384).optional(),
  expires_in: z.number().int().positive(),
  scope: z.string().optional(),
  id_token: z.string().optional(),
});
export function googleBusinessProvider(config: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  beforeRequest?: () => Promise<void>;
}): BusinessProvider {
  const keys = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
    { timeoutDuration: 10000 },
  );
  async function call(
    url: string,
    init: RequestInit = {},
    business = false,
  ): Promise<unknown> {
    if (business) await config.beforeRequest?.();
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new BusinessError("PROVIDER_UNAVAILABLE", 503, true);
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (!response.ok) {
      const raw = JSON.stringify(body);
      const retry = Math.min(
        3600,
        Math.max(1, Number(response.headers.get("retry-after")) || 60),
      );
      if (response.status === 401 || raw.includes("invalid_grant"))
        throw new BusinessError("NEEDS_RECONNECT", 401);
      if (response.status === 429)
        throw new BusinessError("RATE_LIMITED", 429, true, retry);
      if (
        response.status === 403 &&
        /SERVICE_DISABLED|accessNotConfigured|API has not been used|disabled|not been enabled/i.test(
          raw,
        )
      )
        throw new BusinessError("API_ACCESS_REQUIRED", 403);
      if (
        [400, 403].includes(response.status) &&
        /not verified|unverified/i.test(raw)
      )
        throw new BusinessError("PROFILE_UNVERIFIED", 403);
      if (response.status === 403)
        throw new BusinessError("ACCESS_DENIED", 403);
      if (response.status === 404)
        throw new BusinessError("PROFILE_NOT_FOUND", 404);
      throw new BusinessError(
        "PROVIDER_UNAVAILABLE",
        502,
        response.status >= 500,
      );
    }
    return body;
  }
  async function token(body: Record<string, string>) {
    const raw = await call("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        ...body,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });
    const parsed = grantSchema.safeParse(raw);
    if (!parsed.success) throw new BusinessError("INVALID_PROVIDER_RESPONSE");
    return parsed.data;
  }
  const locationSchema = z.object({
    name: z.string().regex(locationPattern),
    title: z.string().max(512),
  });
  return {
    authorizationUrl({ state, nonce, challenge }) {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: `openid ${BUSINESS_SCOPE}`,
        access_type: "offline",
        prompt: "consent select_account",
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }).toString();
      return url.toString();
    },
    async exchange(code, verifier, nonce) {
      const t = await token({
        code,
        code_verifier: verifier,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      });
      if (!t.id_token) throw new BusinessError("IDENTITY_REQUIRED", 401);
      const { payload } = await jwtVerify(t.id_token, keys, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: config.clientId,
        algorithms: ["RS256"],
        requiredClaims: ["exp", "iat", "sub", "nonce"],
      });
      if (
        payload.nonce !== nonce ||
        (payload.azp !== undefined && payload.azp !== config.clientId) ||
        !payload.sub
      )
        throw new BusinessError("INVALID_IDENTITY", 401);
      const scopes = (t.scope || "").split(" ");
      if (!scopes.includes(BUSINESS_SCOPE))
        throw new BusinessError("SCOPE_REQUIRED", 403);
      return {
        subject: payload.sub,
        accessToken: t.access_token,
        refreshToken: t.refresh_token,
        expiresIn: t.expires_in,
        scopes,
      };
    },
    async refresh(refreshToken) {
      const t = await token({
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      });
      if (t.scope && !t.scope.split(" ").includes(BUSINESS_SCOPE))
        throw new BusinessError("NEEDS_RECONNECT", 401);
      return {
        accessToken: t.access_token,
        refreshToken: t.refresh_token,
        expiresIn: t.expires_in,
      };
    },
    async revoke(refreshToken) {
      let response: Response;
      try {
        response = await fetch("https://oauth2.googleapis.com/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ token: refreshToken }),
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        throw new BusinessError("REVOCATION_PENDING", 503, true);
      }
      if (!response.ok) {
        const body = await response.text();
        if (response.status !== 400 || !/invalid_token/i.test(body))
          throw new BusinessError("REVOCATION_PENDING", 503, true);
      }
    },
    async accounts(access) {
      const all: { name: string; accountName: string }[] = [];
      let page: string | undefined;
      for (let i = 0; i < 5; i++) {
        const url = new URL(
          "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        );
        url.search = new URLSearchParams({
          pageSize: "20",
          ...(page ? { pageToken: page } : {}),
        }).toString();
        const raw = await call(
          url.toString(),
          { headers: { Authorization: `Bearer ${access}` } },
          true,
        );
        const parsed = z
          .object({
            accounts: z
              .array(
                z.object({
                  name: z.string().regex(accountPattern),
                  accountName: z.string(),
                }),
              )
              .default([]),
            nextPageToken: z.string().optional(),
          })
          .safeParse(raw);
        if (!parsed.success)
          throw new BusinessError("INVALID_PROVIDER_RESPONSE");
        all.push(...parsed.data.accounts);
        page = parsed.data.nextPageToken;
        if (!page) break;
      }
      return { accounts: all, truncated: !!page };
    },
    async locations(access, account, pageToken) {
      resource(account, accountPattern);
      const url = new URL(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations`,
      );
      url.search = new URLSearchParams({
        readMask: "name,title",
        pageSize: "100",
        ...(pageToken ? { pageToken } : {}),
      }).toString();
      const raw = await call(
        url.toString(),
        { headers: { Authorization: `Bearer ${access}` } },
        true,
      );
      const parsed = z
        .object({
          locations: z.array(locationSchema).default([]),
          nextPageToken: z.string().optional(),
        })
        .safeParse(raw);
      if (!parsed.success) throw new BusinessError("INVALID_PROVIDER_RESPONSE");
      return parsed.data;
    },
    async location(access, name) {
      resource(name, locationPattern);
      const parsed = locationSchema.safeParse(
        await call(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${name}?readMask=name,title`,
          { headers: { Authorization: `Bearer ${access}` } },
          true,
        ),
      );
      if (!parsed.success) throw new BusinessError("INVALID_PROVIDER_RESPONSE");
      return parsed.data;
    },
    async reviews(access, account, location, pageToken) {
      resource(account, accountPattern);
      resource(location, locationPattern);
      const url = new URL(
        `https://mybusiness.googleapis.com/v4/${account}/${location}/reviews`,
      );
      url.search = new URLSearchParams({
        pageSize: "50",
        orderBy: "updateTime desc",
        ...(pageToken ? { pageToken } : {}),
      }).toString();
      const raw = await call(
        url.toString(),
        { headers: { Authorization: `Bearer ${access}` } },
        true,
      );
      const parsed = z
        .object({
          reviews: z
            .array(
              z
                .object({
                  reviewId: z.string().min(1).max(191),
                  starRating: z.string().optional(),
                  comment: z.string().optional(),
                  createTime: z.string().optional(),
                  updateTime: z.string().optional(),
                  reviewer: z
                    .object({ displayName: z.string().optional() })
                    .passthrough()
                    .optional(),
                  reviewReply: z
                    .object({
                      comment: z.string().optional(),
                      updateTime: z.string().optional(),
                    })
                    .passthrough()
                    .optional(),
                })
                .passthrough(),
            )
            .default([]),
          averageRating: z.number().optional(),
          totalReviewCount: z.number().int().nonnegative().optional(),
          nextPageToken: z.string().optional(),
        })
        .safeParse(raw);
      if (!parsed.success) throw new BusinessError("INVALID_PROVIDER_RESPONSE");
      return parsed.data;
    },
  };
}

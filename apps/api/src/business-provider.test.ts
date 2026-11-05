import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import {
  googleBusinessProvider,
  BusinessError,
  BUSINESS_SCOPE,
} from "@reviesnest/google-business";
const config = {
  clientId: "test-client",
  clientSecret: "test-secret",
  redirectUri: "https://app.example.test/api/google-business/callback",
};
const { privateKey, publicKey } = await generateKeyPair("RS256");
const publicJwk = await exportJWK(publicKey);
publicJwk.kid = "test-key";
publicJwk.alg = "RS256";
async function identity(nonce = "expected", audience = "test-client") {
  return new SignJWT({ nonce })
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer("https://accounts.google.com")
    .setAudience(audience)
    .setSubject("google-subject")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}
test("Business OAuth uses offline consent, PKCE and verifies signed identity and granted scope", async (t) => {
  const jwt = await identity();
  let verifier = "";
  t.mock.method(globalThis, "fetch", async (input, init) => {
    if (String(input).includes("/certs"))
      return Response.json({ keys: [publicJwk] });
    verifier =
      new URLSearchParams(String(init?.body)).get("code_verifier") || "";
    return Response.json({
      access_token: "test-access",
      refresh_token: "test-refresh",
      expires_in: 3600,
      scope: BUSINESS_SCOPE,
      id_token: jwt,
    });
  });
  const provider = googleBusinessProvider(config);
  const url = new URL(
    provider.authorizationUrl({
      state: "state",
      nonce: "expected",
      challenge: "challenge",
    }),
  );
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.ok(url.searchParams.get("scope")?.includes(BUSINESS_SCOPE));
  const grant = await provider.exchange("code", "verifier", "expected");
  assert.equal(grant.subject, "google-subject");
  assert.equal(verifier, "verifier");
  assert.equal(grant.refreshToken, "test-refresh");
});
test("Business OAuth rejects nonce/audience mismatch and missing Business permission", async (t) => {
  let jwt = await identity(),
    scope = BUSINESS_SCOPE;
  t.mock.method(globalThis, "fetch", async (input) =>
    String(input).includes("/certs")
      ? Response.json({ keys: [publicJwk] })
      : Response.json({
          access_token: "test-access",
          refresh_token: "test-refresh",
          expires_in: 3600,
          scope,
          id_token: jwt,
        }),
  );
  await assert.rejects(
    () => googleBusinessProvider(config).exchange("code", "verifier", "wrong"),
    (error: unknown) =>
      error instanceof BusinessError && error.code === "INVALID_IDENTITY",
  );
  jwt = await identity("expected", "other-client");
  await assert.rejects(() =>
    googleBusinessProvider(config).exchange("code", "verifier", "expected"),
  );
  jwt = await identity();
  scope = "openid";
  await assert.rejects(
    () =>
      googleBusinessProvider(config).exchange("code", "verifier", "expected"),
    (error: unknown) =>
      error instanceof BusinessError && error.code === "SCOPE_REQUIRED",
  );
});
test("provider classifies Google API approval, revocation and rate-limit errors without raw payloads", async (t) => {
  let status = 403,
    body: unknown = {
      error: {
        message:
          "API has not been used and is disabled: private-provider-detail",
      },
    };
  t.mock.method(globalThis, "fetch", async () =>
    Response.json(body, { status, headers: { "Retry-After": "120" } }),
  );
  const provider = googleBusinessProvider(config);
  await assert.rejects(
    () => provider.accounts("token"),
    (error: unknown) =>
      error instanceof BusinessError &&
      error.code === "API_ACCESS_REQUIRED" &&
      !error.message.includes("private-provider-detail"),
  );
  status = 400;
  body = { error: "invalid_grant" };
  await assert.rejects(
    () => provider.refresh("token"),
    (error: unknown) =>
      error instanceof BusinessError && error.code === "NEEDS_RECONNECT",
  );
  status = 429;
  body = { error: "rate limit" };
  await assert.rejects(
    () => provider.accounts("token"),
    (error: unknown) =>
      error instanceof BusinessError &&
      error.retryAfterSeconds === 120 &&
      error.retryable,
  );
});
test("provider paginates accounts, uses current location/review endpoints and rejects arbitrary resource paths", async (t) => {
  const urls: string[] = [];
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(String(input));
    urls.push(url.toString());
    if (url.hostname === "mybusinessaccountmanagement.googleapis.com")
      return Response.json(
        url.searchParams.has("pageToken")
          ? { accounts: [{ name: "accounts/2", accountName: "Two" }] }
          : {
              accounts: [{ name: "accounts/1", accountName: "One" }],
              nextPageToken: "next",
            },
      );
    if (url.hostname === "mybusinessbusinessinformation.googleapis.com")
      return Response.json({
        locations: [{ name: "locations/3", title: "Cafe" }],
      });
    return Response.json({ reviews: [], totalReviewCount: 0 });
  });
  const provider = googleBusinessProvider(config);
  assert.equal((await provider.accounts("token")).accounts.length, 2);
  assert.equal(
    (await provider.locations("token", "accounts/1")).locations[0].title,
    "Cafe",
  );
  await provider.reviews("token", "accounts/1", "locations/3");
  assert.ok(
    urls.some((url) =>
      url.includes(
        "mybusiness.googleapis.com/v4/accounts/1/locations/3/reviews",
      ),
    ),
  );
  assert.ok(urls.some((url) => url.includes("readMask=name%2Ctitle")));
  const before = urls.length;
  await assert.rejects(() => provider.locations("token", "https://evil.test"));
  assert.equal(urls.length, before);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";
import { verifyGoogleIdentity } from "./auth/google.js";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = await exportJWK(publicKey);
jwk.kid = "test";
jwk.alg = "RS256";
const keys = createLocalJWKSet({ keys: [jwk] });
async function token(claims: Record<string, unknown> = {}) {
  return new SignJWT({
    nonce: "expected-nonce",
    email: "owner@example.test",
    email_verified: true,
    name: "Owner",
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://accounts.google.com")
    .setAudience("client-id")
    .setSubject("subject-123")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}
test("verified Google identity accepts a correctly signed, scoped, nonced token", async () => {
  assert.deepEqual(
    await verifyGoogleIdentity(
      await token(),
      keys,
      "client-id",
      "expected-nonce",
    ),
    { subject: "subject-123", email: "owner@example.test", name: "Owner" },
  );
});
test("ID token rejects wrong nonce, audience and unverified email", async () => {
  await assert.rejects(() =>
    verifyGoogleIdentity(tokenValue, keys, "client-id", "wrong"),
  );
  async function reject(claims: Record<string, unknown>, client = "client-id") {
    const value = await token(claims);
    await assert.rejects(() =>
      verifyGoogleIdentity(value, keys, client, "expected-nonce"),
    );
  }
  await reject({ email_verified: false });
  await reject({ azp: "other-client" });
  await reject({}, "other-client");
});
const tokenValue = await token();
test("ID token rejects expired token and wrong issuer", async () => {
  const expired = await new SignJWT({
    nonce: "expected-nonce",
    email: "owner@example.test",
    email_verified: true,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://accounts.google.com")
    .setAudience("client-id")
    .setSubject("subject")
    .setIssuedAt(1)
    .setExpirationTime(2)
    .sign(privateKey);
  await assert.rejects(() =>
    verifyGoogleIdentity(expired, keys, "client-id", "expected-nonce"),
  );
  const wrong = await new SignJWT({
    nonce: "expected-nonce",
    email: "owner@example.test",
    email_verified: true,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://evil.test")
    .setAudience("client-id")
    .setSubject("subject")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
  await assert.rejects(() =>
    verifyGoogleIdentity(wrong, keys, "client-id", "expected-nonce"),
  );
});
test("ID token rejects forged signature", async () => {
  const other = await generateKeyPair("RS256");
  const forged = await new SignJWT({
    nonce: "expected-nonce",
    email: "owner@example.test",
    email_verified: true,
  })
    .setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://accounts.google.com")
    .setAudience("client-id")
    .setSubject("subject")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(other.privateKey);
  await assert.rejects(() =>
    verifyGoogleIdentity(forged, keys, "client-id", "expected-nonce"),
  );
});

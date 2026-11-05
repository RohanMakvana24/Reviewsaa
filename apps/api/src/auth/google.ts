import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { z } from "zod";
import { AuthError } from "./security.js";
export type GoogleIdentity = { subject: string; email: string; name: string };
export interface GoogleProvider {
  authorizationUrl(input: {
    state: string;
    nonce: string;
    challenge: string;
  }): string;
  identity(
    code: string,
    verifier: string,
    nonce: string,
  ): Promise<GoogleIdentity>;
}
export function googleProvider(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): GoogleProvider {
  const keys = createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs"),
    { timeoutDuration: 10000 },
  );
  return {
    authorizationUrl({ state, nonce, challenge }) {
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt: "select_account",
      }).toString();
      return url.toString();
    },
    async identity(code, verifier, nonce) {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new AuthError(401, "GOOGLE_AUTH_FAILED");
      const token = z
        .object({ id_token: z.string() })
        .parse(await response.json());
      return verifyGoogleIdentity(token.id_token, keys, clientId, nonce);
    },
  };
}

export async function verifyGoogleIdentity(
  token: string,
  keys: JWTVerifyGetKey,
  clientId: string,
  nonce: string,
): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(token, keys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
    algorithms: ["RS256"],
    requiredClaims: ["exp", "iat", "sub", "nonce", "email", "email_verified"],
  });
  if (
    payload.nonce !== nonce ||
    payload.email_verified !== true ||
    (payload.azp !== undefined && payload.azp !== clientId)
  )
    throw new AuthError(401, "GOOGLE_AUTH_FAILED");
  const identity = z
    .object({
      sub: z.string().min(1).max(191),
      email: z.email().max(320),
      name: z.string().trim().min(1).max(100).optional(),
    })
    .parse(payload);
  // Access/refresh/ID tokens are deliberately not persisted for login.
  return {
    subject: identity.sub,
    email: identity.email,
    name: identity.name || identity.email.split("@")[0],
  };
}

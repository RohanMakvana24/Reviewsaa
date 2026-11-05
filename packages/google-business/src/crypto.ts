import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
export const digest = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const random = () => randomBytes(32).toString("base64url");
export class BusinessError extends Error {
  constructor(
    public code: string,
    public status = 502,
    public retryable = false,
    public retryAfterSeconds = 60,
  ) {
    super(code);
    this.name = "BusinessError";
  }
}
export class TokenCipher {
  private key: Buffer;
  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, "base64");
    if (this.key.length !== 32)
      throw new Error(
        "TOKEN_ENCRYPTION_KEY must be 32 bytes encoded as base64",
      );
  }
  encrypt(value: string, aad: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(Buffer.from(aad));
    const body = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return [
      "v1",
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      body.toString("base64url"),
    ].join(".");
  }
  decrypt(value: string, aad: string) {
    try {
      const [v, iv, tag, body] = value.split(".");
      if (v !== "v1" || !iv || !tag || !body) throw new Error();
      const decipher = createDecipheriv(
        "aes-256-gcm",
        this.key,
        Buffer.from(iv, "base64url"),
      );
      decipher.setAAD(Buffer.from(aad));
      decipher.setAuthTag(Buffer.from(tag, "base64url"));
      return Buffer.concat([
        decipher.update(Buffer.from(body, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      throw new BusinessError("TOKEN_CONFIGURATION_ERROR", 503);
    }
  }
}
export const tokenAad = (org: string, id: string, kind: "access" | "refresh") =>
  `org:${org}:connection:${id}:${kind}`;

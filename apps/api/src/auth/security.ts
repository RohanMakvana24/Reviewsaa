import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { parse, serialize } from "cookie";
import type { Request, Response } from "express";
export const randomToken = () => randomBytes(32).toString("base64url");
export const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const challenge = (value: string) =>
  createHash("sha256").update(value).digest("base64url");
export function equalToken(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function cookieName(
  production: boolean,
  kind: "session" | "oauth" | "business",
) {
  return `${production ? "__Host-" : ""}reviesnest_${kind}`;
}
export function readCookie(req: Request, name: string) {
  return parse(req.headers.cookie || "")[name];
}
export function setAuthCookie(
  res: Response,
  production: boolean,
  kind: "session" | "oauth" | "business",
  value: string,
  maxAge: number,
) {
  res.append(
    "Set-Cookie",
    serialize(cookieName(production, kind), value, {
      httpOnly: true,
      secure: production,
      sameSite: "lax",
      path: "/",
      maxAge,
    }),
  );
}
export class AuthError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

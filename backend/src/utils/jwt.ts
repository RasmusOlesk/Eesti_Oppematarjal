import crypto from "node:crypto";
import type { UserRole } from "../models/User.ts";

export interface JwtPayload {
  id: string;
  username: string;
  role: UserRole;
  exp: number;
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in .env");
  }
  return secret;
};

const base64UrlEncode = (data: string): string =>
  Buffer.from(data).toString("base64url");

const base64UrlDecode = (data: string): string =>
  Buffer.from(data, "base64url").toString("utf8");

export const signToken = (
  payload: Omit<JwtPayload, "exp">,
  expiresInSeconds = 60 * 60 * 24 // 24 hours
): string => {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const fullPayload: JwtPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  if (!header || !body || !signature) return null; //string only
  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(`${header}.${body}`)
    .digest("base64url");

  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(base64UrlDecode(body)) as JwtPayload;
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // token expired
    }
    return decoded;
  } catch {
    return null;
  }
};
import crypto from "crypto";
import type { NextResponse } from "next/server";

// A signed, HttpOnly session cookie. Before this, "who is logged in" lived
// only in the browser (localStorage), so no API route could tell who was
// calling — every route just believed whatever user id the client sent.
//
// Token = base64url(JSON{uid, exp}) + "." + HMAC-SHA256(payload, secret).
// Tampering with the user id or expiry invalidates the signature.

export const SESSION_COOKIE = "wb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const SESSION_SHORT_TTL_SECONDS = 60 * 60 * 24; // 1 day

function getSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  // No dedicated secret configured: derive one from the database URL, which
  // is private to this deployment. Set SESSION_SECRET in production so it
  // doesn't depend on that.
  if (process.env.DATABASE_URL) {
    return crypto.createHash("sha256").update(`wb-session:${process.env.DATABASE_URL}`).digest("hex");
  }
  return "workboard-dev-only-session-secret";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: string, now = Date.now(), ttl = SESSION_TTL_SECONDS): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Math.floor(now / 1000) + ttl })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Returns the user id if the token is genuine and unexpired, else null.
export function verifySessionToken(token: string | undefined | null, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof uid !== "string" || typeof exp !== "number") return null;
    if (exp * 1000 < now) return null;
    return uid;
  } catch {
    return null;
  }
}

// Reads the session from the request's Cookie header.
export function getSessionUserId(request: Request): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) return verifySessionToken(rest.join("="));
  }
  return null;
}

export function setSessionCookie(response: NextResponse, userId: string, rememberMe = true): void {
  const ttl = rememberMe ? SESSION_TTL_SECONDS : SESSION_SHORT_TTL_SECONDS;
  response.cookies.set(SESSION_COOKIE, createSessionToken(userId, Date.now(), ttl), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

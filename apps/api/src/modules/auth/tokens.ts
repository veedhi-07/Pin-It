import jwt from "jsonwebtoken";
import type { Response } from "express";
import { env } from "../../config/env.js";
import { redis } from "../../lib/redis.js";

const ACCESS_TTL = "15m";
const REFRESH_TTL_SEC = 60 * 60 * 24 * 7;

function cookieBase() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax" as const,
    path: "/",
  };
}

export function signAccessToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtAccessSecret, {
    expiresIn: ACCESS_TTL,
  });
}

export function signRefreshToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TTL_SEC,
  });
}

export async function setAuthCookies(res: Response, user: { id: string; email: string }) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  try {
    await redis.set(`refresh:${user.id}:${refreshToken.slice(-24)}`, "1", "EX", REFRESH_TTL_SEC);
  } catch {
    // Redis is optional for local auth; cookies still work.
  }
  res.cookie("accessToken", accessToken, { ...cookieBase(), maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieBase(), maxAge: REFRESH_TTL_SEC * 1000 });
}

export async function clearAuthCookies(res: Response, userId?: string, refreshToken?: string) {
  if (userId && refreshToken) {
    try {
      await redis.del(`refresh:${userId}:${refreshToken.slice(-24)}`);
    } catch {
      /* ignore */
    }
  }
  res.clearCookie("accessToken", cookieBase());
  res.clearCookie("refreshToken", cookieBase());
}

export function verifyRefresh(token: string) {
  return jwt.verify(token, env.jwtRefreshSecret) as { sub: string; email: string };
}

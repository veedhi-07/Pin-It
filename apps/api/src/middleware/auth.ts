import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../lib/http.js";

export interface AuthPayload {
  sub: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function readAccessToken(req: Request): AuthPayload | null {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) return null;
  try {
    return jwt.verify(token, env.jwtAccessSecret) as AuthPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readAccessToken(req);
  if (!user) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }
  req.user = user;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = readAccessToken(req) ?? undefined;
  next();
}

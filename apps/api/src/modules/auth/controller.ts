import type { Request, Response } from "express";
import * as authService from "./service.js";
import { clearAuthCookies, setAuthCookies, verifyRefresh } from "./tokens.js";
import { HttpError } from "../../lib/http.js";

export async function register(req: Request, res: Response) {
  const user = await authService.register(req.body);
  await setAuthCookies(res, { id: user.id, email: user.email });
  res.status(201).json({ user });
}

export async function login(req: Request, res: Response) {
  const user = await authService.login(req.body);
  await setAuthCookies(res, { id: user.id, email: user.email });
  res.json({ user });
}

export async function logout(req: Request, res: Response) {
  await clearAuthCookies(res, req.user?.sub, req.cookies?.refreshToken);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.sub);
  res.json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const user = await authService.updateProfile(req.user!.sub, req.body);
  res.json({ user });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    throw new HttpError(401, "Missing refresh token");
  }
  try {
    const payload = verifyRefresh(token);
    await setAuthCookies(res, { id: payload.sub, email: payload.email });
    const user = await authService.getProfile(payload.sub);
    res.json({ user });
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }
}

export async function users(req: Request, res: Response) {
  const q = String(req.query.q ?? "");
  const results = q.length < 1 ? [] : await authService.searchUsers(q, req.user!.sub);
  res.json({ users: results });
}

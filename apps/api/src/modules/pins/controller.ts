import type { Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import * as pinService from "./service.js";
import { localFilePath } from "../media/service.js";

function absoluteMedia(req: Request, url: string) {
  if (url.startsWith("http")) return url;
  return `${req.protocol}://${req.get("host")}${url}`;
}

function withHost(req: Request, pin: { mediaUrl: string; thumbnailUrl: string }) {
  return {
    ...pin,
    mediaUrl: absoluteMedia(req, pin.mediaUrl),
    thumbnailUrl: pin.thumbnailUrl.startsWith("/")
      ? absoluteMedia(req, pin.thumbnailUrl)
      : pin.thumbnailUrl,
  };
}

export async function create(req: Request, res: Response) {
  const pin = await pinService.createPin(req.user!.sub, req.file, req.body);
  res.status(201).json({ pin: withHost(req, pin) });
}

export async function feed(req: Request, res: Response) {
  const pins = await pinService.listFeed(req.user?.sub, String(req.query.q ?? ""));
  res.json({ pins: pins.map((pin) => withHost(req, pin)) });
}

export async function get(req: Request, res: Response) {
  const pin = await pinService.getPin(req.params.id, req.user?.sub);
  res.json({ pin: withHost(req, pin) });
}

export async function update(req: Request, res: Response) {
  const pin = await pinService.updatePin(req.params.id, req.user!.sub, req.body);
  res.json({ pin: withHost(req, pin) });
}

export async function remove(req: Request, res: Response) {
  await pinService.deletePin(req.params.id, req.user!.sub);
  res.json({ ok: true });
}

export async function download(req: Request, res: Response) {
  const result = await pinService.downloadPin(req.params.id, req.user!.sub);
  if (result.mediaPublicId.startsWith("local:")) {
    const filePath = localFilePath(result.mediaPublicId);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File missing" });
      return;
    }
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.sendFile(path.resolve(filePath));
    return;
  }
  res.json({ url: result.signed ?? result.mediaUrl });
}

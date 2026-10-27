import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { localFilePath, uploadRoot } from "./service.js";
import { requireAuth } from "../../middleware/auth.js";

export const mediaRouter = Router();

mediaRouter.get("/video-poster.svg", (_req, res) => {
  res.type("image/svg+xml").send(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800"><rect width="100%" height="100%" fill="#111"/><polygon points="240,300 240,500 420,400" fill="#fff"/></svg>`,
  );
});

mediaRouter.get("/file/:id", (req, res, next) => {
  try {
    const filePath = localFilePath(`local:${req.params.id}`);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

mediaRouter.get("/download/:id", requireAuth, (req, res, next) => {
  try {
    const filePath = path.resolve(uploadRoot, req.params.id);
    if (!filePath.startsWith(uploadRoot) || !fs.existsSync(filePath)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const name = String(req.query.name ?? req.params.id);
    res.download(filePath, name);
  } catch (error) {
    next(error);
  }
});

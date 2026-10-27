import { Router } from "express";
import multer from "multer";
import os from "node:os";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import * as controller from "./controller.js";

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

export const pinRouter = Router();

pinRouter.get("/", optionalAuth, (req, res, next) => {
  controller.feed(req, res).catch(next);
});
pinRouter.post("/", requireAuth, upload.single("file"), (req, res, next) => {
  controller.create(req, res).catch(next);
});
pinRouter.get("/:id", optionalAuth, (req, res, next) => {
  controller.get(req, res).catch(next);
});
pinRouter.patch("/:id", requireAuth, (req, res, next) => {
  controller.update(req, res).catch(next);
});
pinRouter.delete("/:id", requireAuth, (req, res, next) => {
  controller.remove(req, res).catch(next);
});
pinRouter.get("/:id/download", requireAuth, (req, res, next) => {
  controller.download(req, res).catch(next);
});

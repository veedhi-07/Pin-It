import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth.js";
import * as controller from "./controller.js";

export const boardRouter = Router();

boardRouter.get("/", optionalAuth, (req, res, next) => {
  controller.list(req, res).catch(next);
});
boardRouter.post("/", requireAuth, (req, res, next) => {
  controller.create(req, res).catch(next);
});
boardRouter.get("/:id", optionalAuth, (req, res, next) => {
  controller.get(req, res).catch(next);
});
boardRouter.patch("/:id", requireAuth, (req, res, next) => {
  controller.update(req, res).catch(next);
});
boardRouter.delete("/:id", requireAuth, (req, res, next) => {
  controller.remove(req, res).catch(next);
});
boardRouter.post("/:id/pins", requireAuth, (req, res, next) => {
  controller.save(req, res).catch(next);
});
boardRouter.delete("/:id/pins/:pinId", requireAuth, (req, res, next) => {
  controller.unsave(req, res).catch(next);
});

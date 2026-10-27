import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./controller.js";

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/", (req, res, next) => {
  controller.list(req, res).catch(next);
});
chatRouter.post("/dm", (req, res, next) => {
  controller.createDm(req, res).catch(next);
});
chatRouter.post("/groups", (req, res, next) => {
  controller.createGroup(req, res).catch(next);
});
chatRouter.get("/:id", (req, res, next) => {
  controller.get(req, res).catch(next);
});
chatRouter.patch("/:id/members", (req, res, next) => {
  controller.members(req, res).catch(next);
});
chatRouter.get("/:id/messages", (req, res, next) => {
  controller.messages(req, res).catch(next);
});
chatRouter.post("/:id/messages", (req, res, next) => {
  controller.send(req, res).catch(next);
});

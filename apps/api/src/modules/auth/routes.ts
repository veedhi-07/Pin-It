import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as controller from "./controller.js";

export const authRouter = Router();

authRouter.post("/register", (req, res, next) => {
  controller.register(req, res).catch(next);
});
authRouter.post("/login", (req, res, next) => {
  controller.login(req, res).catch(next);
});
authRouter.post("/logout", requireAuth, (req, res, next) => {
  controller.logout(req, res).catch(next);
});
authRouter.post("/refresh", (req, res, next) => {
  controller.refresh(req, res).catch(next);
});
authRouter.get("/me", requireAuth, (req, res, next) => {
  controller.me(req, res).catch(next);
});
authRouter.patch("/me", requireAuth, (req, res, next) => {
  controller.updateMe(req, res).catch(next);
});
authRouter.get("/users", requireAuth, (req, res, next) => {
  controller.users(req, res).catch(next);
});

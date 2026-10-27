import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { authRouter } from "./modules/auth/routes.js";
import { pinRouter } from "./modules/pins/routes.js";
import { boardRouter } from "./modules/boards/routes.js";
import { chatRouter } from "./modules/chat/routes.js";
import { mediaRouter } from "./modules/media/routes.js";

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.use("/auth", authRouter);
  app.use("/pins", pinRouter);
  app.use("/boards", boardRouter);
  app.use("/conversations", chatRouter);
  app.use("/media", mediaRouter);
  app.use(errorHandler);
  return app;
}

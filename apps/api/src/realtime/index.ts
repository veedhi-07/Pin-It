import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { redis } from "../lib/redis.js";
import * as chatService from "../modules/chat/service.js";

interface SocketUser {
  sub: string;
  email: string;
}

export function attachRealtime(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });

  io.use((socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie ?? "");
    const token = cookies.accessToken;
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      socket.data.user = jwt.verify(token, env.jwtAccessSecret) as SocketUser;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as SocketUser;
    socket.join(`user:${user.sub}`);
    try {
      await redis.set(`presence:${user.sub}`, "1", "EX", 60);
    } catch {
      /* presence optional */
    }
    io.emit("presence:update", { userId: user.sub, online: true });

    const memberships = await prisma.conversationMember.findMany({
      where: { userId: user.sub },
      select: { conversationId: true },
    });
    memberships.forEach((m) => socket.join(`conversation:${m.conversationId}`));

    socket.on("conversation:join", async (conversationId: string) => {
      const member = await prisma.conversationMember.findUnique({
        where: { conversationId_userId: { conversationId, userId: user.sub } },
      });
      if (member) socket.join(`conversation:${conversationId}`);
    });

    socket.on("message:send", async (payload, ack) => {
      try {
        const message = await chatService.createMessage(payload.conversationId, user.sub, payload);
        io.to(`conversation:${payload.conversationId}`).emit("message:new", message);
        if (typeof ack === "function") ack({ ok: true, message });
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, error: error instanceof Error ? error.message : "Failed" });
        }
      }
    });

    socket.on("typing", (payload: { conversationId: string; typing: boolean }) => {
      socket.to(`conversation:${payload.conversationId}`).emit("typing", {
        conversationId: payload.conversationId,
        userId: user.sub,
        typing: payload.typing,
      });
    });

    socket.on("disconnect", async () => {
      try {
        await redis.del(`presence:${user.sub}`);
      } catch {
        /* ignore */
      }
      io.emit("presence:update", { userId: user.sub, online: false });
    });
  });

  return io;
}

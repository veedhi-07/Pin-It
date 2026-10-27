import http from "node:http";
import { env } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";
import { attachRealtime } from "./realtime/index.js";
import { startMediaWorker } from "./jobs/queue.js";

const app = createApp();
const server = http.createServer(app);
attachRealtime(server);

try {
  startMediaWorker();
} catch (error) {
  console.warn("Media worker not started:", error);
}

async function start() {
  try {
    await redis.connect();
  } catch (error) {
    console.warn("Redis unavailable, continuing without cache/presence:", error);
  }
  server.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

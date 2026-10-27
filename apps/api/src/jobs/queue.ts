import { Queue, Worker } from "bullmq";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const connection = { url: env.redisUrl };

export const mediaQueue = new Queue("media", { connection });

export function startMediaWorker() {
  const worker = new Worker(
    "media",
    async (job) => {
      if (job.name === "video-poster") {
        const pinId = job.data.pinId as string;
        const pin = await prisma.pin.findUnique({ where: { id: pinId } });
        if (!pin || pin.mediaType !== "video") return;
        // Cloudinary already supplies a poster URL. Local uploads keep a static poster.
        return { pinId, status: "ready" };
      }
    },
    { connection, concurrency: 2 },
  );
  worker.on("failed", (job, err) => {
    console.warn("Media job failed", job?.id, err.message);
  });
  return worker;
}

export async function enqueueVideoPoster(pinId: string) {
  try {
    await mediaQueue.add("video-poster", { pinId });
  } catch {
    /* Redis optional in local-only media mode */
  }
}

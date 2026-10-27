import { createPinSchema, updatePinSchema } from "@pinboard/shared";
import { prisma } from "../../lib/prisma.js";
import { HttpError, publicUser } from "../../lib/http.js";
import { enqueueVideoPoster } from "../../jobs/queue.js";
import { signedDownloadUrl, storeUpload } from "../media/service.js";
import { canViewPin, isPinVisible } from "./visibility.js";

const pinInclude = {
  owner: true,
  boardPins: { select: { boardId: true, board: { select: { isPrivate: true, ownerId: true } } } },
};

export async function createPin(ownerId: string, file: Express.Multer.File | undefined, body: unknown) {
  if (!file) {
    throw new HttpError(400, "Media file is required");
  }
  const raw = (body ?? {}) as { title?: string; description?: string; tags?: string | string[] };
  let tags: string[] = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags;
  } else if (typeof raw.tags === "string" && raw.tags.trim()) {
    try {
      const parsed = JSON.parse(raw.tags);
      tags = Array.isArray(parsed) ? parsed : raw.tags.split(",");
    } catch {
      tags = raw.tags.split(",");
    }
  }
  const data = createPinSchema.parse({
    title: raw.title,
    description: raw.description ?? "",
    tags: tags.map((tag) => tag.trim()).filter(Boolean),
  });
  const stored = await storeUpload(file);
  const pin = await prisma.pin.create({
    data: {
      ownerId,
      mediaType: stored.mediaType,
      mediaPublicId: stored.mediaPublicId,
      mediaUrl: stored.mediaUrl,
      thumbnailUrl: stored.thumbnailUrl,
      title: data.title,
      description: data.description ?? "",
      tags: data.tags ?? [],
    },
    include: pinInclude,
  });
  if (stored.mediaType === "video") {
    await enqueueVideoPoster(pin.id);
  }
  return serializePin(pin);
}

export async function listFeed(viewerId?: string, search?: string) {
  const pins = await prisma.pin.findMany({
    where: search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : undefined,
    include: pinInclude,
    orderBy: { createdAt: "desc" },
    take: 80,
  });
  return pins.filter((pin) => isPinVisible(pin, viewerId)).map(serializePin);
}

export async function getPin(id: string, viewerId?: string) {
  const pin = await prisma.pin.findUnique({ where: { id }, include: pinInclude });
  if (!pin || !isPinVisible(pin, viewerId)) {
    throw new HttpError(404, "Pin not found");
  }
  return serializePin(pin);
}

export async function updatePin(id: string, ownerId: string, input: unknown) {
  const pin = await prisma.pin.findUnique({ where: { id } });
  if (!pin) throw new HttpError(404, "Pin not found");
  if (pin.ownerId !== ownerId) throw new HttpError(403, "Only the owner can edit this pin");
  const data = updatePinSchema.parse(input);
  const updated = await prisma.pin.update({
    where: { id },
    data,
    include: pinInclude,
  });
  return serializePin(updated);
}

export async function deletePin(id: string, ownerId: string) {
  const pin = await prisma.pin.findUnique({ where: { id } });
  if (!pin) throw new HttpError(404, "Pin not found");
  if (pin.ownerId !== ownerId) throw new HttpError(403, "Only the owner can delete this pin");
  await prisma.pin.delete({ where: { id } });
}

export async function downloadPin(id: string, viewerId: string) {
  const allowed = await canViewPin(id, viewerId);
  if (!allowed) throw new HttpError(404, "Pin not found");
  const pin = await prisma.pin.findUnique({ where: { id } });
  if (!pin) throw new HttpError(404, "Pin not found");
  const filename = `${pin.title.replace(/\s+/g, "-")}.${pin.mediaType === "video" ? "mp4" : "jpg"}`;
  const signed = signedDownloadUrl(pin.mediaPublicId, filename);
  return { pin, filename, signed, mediaPublicId: pin.mediaPublicId, mediaUrl: pin.mediaUrl };
}

function serializePin(pin: {
  id: string;
  ownerId: string;
  mediaType: "image" | "video";
  mediaPublicId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  owner: { id: string; email: string; name: string; avatarUrl: string | null };
  boardPins: { boardId: string }[];
}) {
  return {
    id: pin.id,
    ownerId: pin.ownerId,
    owner: publicUser(pin.owner),
    mediaType: pin.mediaType,
    mediaPublicId: pin.mediaPublicId,
    mediaUrl: pin.mediaUrl,
    thumbnailUrl: pin.thumbnailUrl,
    title: pin.title,
    description: pin.description,
    tags: pin.tags,
    createdAt: pin.createdAt.toISOString(),
    savedBoardIds: pin.boardPins.map((bp) => bp.boardId),
  };
}

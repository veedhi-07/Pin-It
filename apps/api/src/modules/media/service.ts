import { v2 as cloudinary } from "cloudinary";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { env, hasCloudinary } from "../../config/env.js";
import { HttpError } from "../../lib/http.js";

const uploadRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../uploads");

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export interface StoredMedia {
  mediaType: "image" | "video";
  mediaPublicId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  provider: "cloudinary" | "local";
}

function mediaTypeFromMime(mime: string): "image" | "video" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  throw new HttpError(400, "Only image and video uploads are allowed");
}

export async function storeUpload(file: Express.Multer.File): Promise<StoredMedia> {
  const mediaType = mediaTypeFromMime(file.mimetype);

  if (hasCloudinary) {
    const resourceType = mediaType === "video" ? "video" : "image";
    const uploaded = await cloudinary.uploader.upload(file.path, {
      folder: "pinboard",
      resource_type: resourceType,
    });
    await fs.unlink(file.path).catch(() => undefined);
    const thumbnailUrl =
      mediaType === "video"
        ? cloudinary.url(uploaded.public_id, {
            resource_type: "video",
            format: "jpg",
            transformation: [{ width: 600, crop: "fill" }],
          })
        : cloudinary.url(uploaded.public_id, {
            transformation: [{ width: 800, crop: "limit" }],
          });
    return {
      mediaType,
      mediaPublicId: uploaded.public_id,
      mediaUrl: uploaded.secure_url,
      thumbnailUrl,
      provider: "cloudinary",
    };
  }

  await fs.mkdir(uploadRoot, { recursive: true });
  const ext = path.extname(file.originalname) || (mediaType === "video" ? ".mp4" : ".jpg");
  const id = `${randomUUID()}${ext}`;
  const dest = path.join(uploadRoot, id);
  await fs.rename(file.path, dest);
  const publicPath = `/media/file/${id}`;
  return {
    mediaType,
    mediaPublicId: `local:${id}`,
    mediaUrl: publicPath,
    thumbnailUrl: mediaType === "image" ? publicPath : "/media/video-poster.svg",
    provider: "local",
  };
}

export function signedDownloadUrl(mediaPublicId: string, filename: string): string | null {
  if (!mediaPublicId.startsWith("local:") && hasCloudinary) {
    return cloudinary.url(mediaPublicId, {
      sign_url: true,
      type: "upload",
      flags: "attachment",
      expires_at: Math.floor(Date.now() / 1000) + 120,
    });
  }
  const id = mediaPublicId.replace(/^local:/, "");
  return `/media/download/${id}?name=${encodeURIComponent(filename)}`;
}

export function localFilePath(mediaPublicId: string): string {
  const id = mediaPublicId.replace(/^local:/, "");
  const resolved = path.resolve(uploadRoot, id);
  if (!resolved.startsWith(uploadRoot)) {
    throw new HttpError(400, "Invalid media path");
  }
  return resolved;
}

export { uploadRoot };

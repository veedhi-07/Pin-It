import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const createPinSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  tags: z
    .array(z.string().min(1).max(32))
    .max(12)
    .optional()
    .default([]),
});

export const updatePinSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(32)).max(12).optional(),
});

export const createBoardSchema = z.object({
  name: z.string().min(1).max(80),
  isPrivate: z.boolean().optional().default(false),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  isPrivate: z.boolean().optional(),
});

export const savePinSchema = z.object({
  pinId: z.string().uuid(),
});

export const createDmSchema = z.object({
  userId: z.string().uuid(),
});

export const createGroupSchema = z.object({
  name: z.string().min(1).max(80),
  memberIds: z.array(z.string().uuid()).max(50).default([]),
});

export const updateGroupMembersSchema = z.object({
  add: z.array(z.string().uuid()).optional().default([]),
  remove: z.array(z.string().uuid()).optional().default([]),
});

export const createMessageSchema = z.object({
  type: z.enum(["text", "pin", "media"]).default("text"),
  body: z.string().max(4000).optional().default(""),
  pinId: z.string().uuid().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePinInput = z.infer<typeof createPinSchema>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

import bcrypt from "bcryptjs";
import { loginSchema, registerSchema, updateProfileSchema } from "@pinboard/shared";
import { prisma } from "../../lib/prisma.js";
import { HttpError, publicUser } from "../../lib/http.js";

export async function register(input: unknown) {
  const data = registerSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (existing) {
    throw new HttpError(409, "Email already registered");
  }
  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      passwordHash,
    },
  });
  return publicUser(user);
}

export async function login(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }
  const ok = await bcrypt.compare(data.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid email or password");
  }
  return publicUser(user);
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return publicUser(user);
}

export async function updateProfile(userId: string, input: unknown) {
  const data = updateProfileSchema.parse(input);
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl,
    },
  });
  return publicUser(user);
}

export async function searchUsers(query: string, excludeId: string) {
  return prisma.user.findMany({
    where: {
      id: { not: excludeId },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 12,
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
}

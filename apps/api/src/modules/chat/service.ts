import {
  createDmSchema,
  createGroupSchema,
  createMessageSchema,
  updateGroupMembersSchema,
} from "@pinboard/shared";
import { prisma } from "../../lib/prisma.js";
import { HttpError, publicUser } from "../../lib/http.js";
import { canViewPin } from "../pins/visibility.js";

async function assertMember(conversationId: string, userId: string) {
  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!member) throw new HttpError(403, "Not a member of this conversation");
  return member;
}

export async function createDm(userId: string, input: unknown) {
  const { userId: otherId } = createDmSchema.parse(input);
  if (otherId === userId) throw new HttpError(400, "Cannot message yourself");
  const other = await prisma.user.findUnique({ where: { id: otherId } });
  if (!other) throw new HttpError(404, "User not found");

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "dm",
      AND: [{ members: { some: { userId } } }, { members: { some: { userId: otherId } } }],
    },
    include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (existing && existing.members.length === 2) {
    return serializeConversation(existing);
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: "dm",
      members: {
        create: [
          { userId, role: "owner" },
          { userId: otherId, role: "member" },
        ],
      },
    },
    include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return serializeConversation(conversation);
}

export async function createGroup(userId: string, input: unknown) {
  const data = createGroupSchema.parse(input);
  const uniqueIds = [...new Set(data.memberIds.filter((id) => id !== userId))];
  const conversation = await prisma.conversation.create({
    data: {
      type: "group",
      name: data.name,
      members: {
        create: [
          { userId, role: "owner" },
          ...uniqueIds.map((id) => ({ userId: id, role: "member" as const })),
        ],
      },
    },
    include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return serializeConversation(conversation);
}

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: true, pin: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return conversations.map(serializeConversation);
}

export async function getConversation(id: string, userId: string) {
  await assertMember(id, userId);
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { members: { include: { user: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!conversation) throw new HttpError(404, "Conversation not found");
  return serializeConversation(conversation);
}

export async function updateMembers(id: string, userId: string, input: unknown) {
  const member = await assertMember(id, userId);
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || conversation.type !== "group") {
    throw new HttpError(400, "Members can only be changed on groups");
  }
  if (member.role === "member") {
    throw new HttpError(403, "Only owners or admins can manage members");
  }
  const data = updateGroupMembersSchema.parse(input);
  if (data.add.length) {
    await prisma.conversationMember.createMany({
      data: data.add.filter((addId) => addId !== userId).map((addId) => ({ conversationId: id, userId: addId })),
      skipDuplicates: true,
    });
  }
  if (data.remove.length) {
    await prisma.conversationMember.deleteMany({
      where: {
        conversationId: id,
        userId: { in: data.remove.filter((removeId) => removeId !== conversation.id) },
        NOT: { role: "owner" },
      },
    });
  }
  return getConversation(id, userId);
}

export async function listMessages(conversationId: string, userId: string) {
  await assertMember(conversationId, userId);
  const messages = await prisma.message.findMany({
    where: { conversationId },
    include: { sender: true, pin: { include: { owner: true } } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return messages.map(serializeMessage);
}

export async function createMessage(conversationId: string, userId: string, input: unknown) {
  await assertMember(conversationId, userId);
  const data = createMessageSchema.parse(input);
  if (data.type === "pin") {
    if (!data.pinId) throw new HttpError(400, "pinId is required to share a pin");
    const allowed = await canViewPin(data.pinId, userId);
    if (!allowed) throw new HttpError(404, "Pin not found");
  }
  if (data.type === "text" && !data.body?.trim()) {
    throw new HttpError(400, "Message body is required");
  }
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      type: data.type,
      body: data.body ?? "",
      pinId: data.pinId ?? null,
    },
    include: { sender: true, pin: { include: { owner: true } } },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return serializeMessage(message);
}

function serializeConversation(conversation: {
  id: string;
  type: "dm" | "group";
  name: string | null;
  updatedAt: Date;
  members: { userId: string; role: "owner" | "admin" | "member"; user: { id: string; email: string; name: string; avatarUrl: string | null } }[];
  messages: unknown[];
}) {
  const last = conversation.messages[0] as
    | {
        id: string;
        conversationId: string;
        senderId: string;
        type: "text" | "pin" | "media";
        body: string;
        pinId: string | null;
        createdAt: Date;
        sender?: { id: string; email: string; name: string; avatarUrl: string | null };
      }
    | undefined;
  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    members: conversation.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: publicUser(m.user),
    })),
    lastMessage: last
      ? {
          id: last.id,
          conversationId: last.conversationId,
          senderId: last.senderId,
          sender: last.sender ? publicUser(last.sender) : undefined,
          type: last.type,
          body: last.body,
          pinId: last.pinId,
          createdAt: last.createdAt.toISOString(),
        }
      : null,
    updatedAt: conversation.updatedAt.toISOString(),
  };
}

function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "pin" | "media";
  body: string;
  pinId: string | null;
  createdAt: Date;
  sender: { id: string; email: string; name: string; avatarUrl: string | null };
  pin: {
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
    owner?: { id: string; email: string; name: string; avatarUrl: string | null };
  } | null;
}) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    sender: publicUser(message.sender),
    type: message.type,
    body: message.body,
    pinId: message.pinId,
    pin: message.pin
      ? {
          id: message.pin.id,
          ownerId: message.pin.ownerId,
          mediaType: message.pin.mediaType,
          mediaPublicId: message.pin.mediaPublicId,
          mediaUrl: message.pin.mediaUrl,
          thumbnailUrl: message.pin.thumbnailUrl,
          title: message.pin.title,
          description: message.pin.description,
          tags: message.pin.tags,
          createdAt: message.pin.createdAt.toISOString(),
          owner: message.pin.owner ? publicUser(message.pin.owner) : undefined,
        }
      : null,
    createdAt: message.createdAt.toISOString(),
  };
}

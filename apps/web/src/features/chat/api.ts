import type { Conversation, Message, PublicUser } from "@pinboard/shared";
import { api } from "../../api/client";

export async function fetchConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>("/conversations");
  return data.conversations;
}

export async function createDm(userId: string) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations/dm", { userId });
  return data.conversation;
}

export async function createGroup(payload: { name: string; memberIds: string[] }) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations/groups", payload);
  return data.conversation;
}

export async function updateMembers(id: string, payload: { add?: string[]; remove?: string[] }) {
  const { data } = await api.patch<{ conversation: Conversation }>(`/conversations/${id}/members`, payload);
  return data.conversation;
}

export async function fetchMessages(id: string) {
  const { data } = await api.get<{ messages: Message[] }>(`/conversations/${id}/messages`);
  return data.messages;
}

export async function sendMessage(id: string, payload: { type?: "text" | "pin" | "media"; body?: string; pinId?: string }) {
  const { data } = await api.post<{ message: Message }>(`/conversations/${id}/messages`, payload);
  return data.message;
}

export async function searchUsers(q: string) {
  const { data } = await api.get<{ users: PublicUser[] }>("/auth/users", { params: { q } });
  return data.users;
}

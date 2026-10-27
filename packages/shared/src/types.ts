export type MediaType = "image" | "video";
export type ConversationType = "dm" | "group";
export type MessageType = "text" | "pin" | "media";
export type MemberRole = "owner" | "admin" | "member";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface Pin {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  mediaType: MediaType;
  mediaPublicId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: string;
  savedBoardIds?: string[];
}

export interface Board {
  id: string;
  ownerId: string;
  owner?: PublicUser;
  name: string;
  isPrivate: boolean;
  pinCount?: number;
  pins?: Pin[];
  createdAt: string;
}

export interface ConversationMember {
  userId: string;
  role: MemberRole;
  user?: PublicUser;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  members: ConversationMember[];
  lastMessage?: Message | null;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: PublicUser;
  type: MessageType;
  body: string;
  pinId: string | null;
  pin?: Pin | null;
  createdAt: string;
}

import type { PublicUser } from "@pinboard/shared";
import { api } from "../../api/client";

export async function register(payload: { email: string; password: string; name: string }) {
  const { data } = await api.post<{ user: PublicUser }>("/auth/register", payload);
  return data.user;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<{ user: PublicUser }>("/auth/login", payload);
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchMe() {
  const { data } = await api.get<{ user: PublicUser }>("/auth/me");
  return data.user;
}

export async function updateProfile(payload: { name?: string; avatarUrl?: string | null }) {
  const { data } = await api.patch<{ user: PublicUser }>("/auth/me", payload);
  return data.user;
}

export async function searchUsers(q: string) {
  const { data } = await api.get<{ users: PublicUser[] }>("/auth/users", { params: { q } });
  return data.users;
}

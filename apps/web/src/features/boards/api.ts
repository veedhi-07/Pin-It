import type { Board } from "@pinboard/shared";
import { api } from "../../api/client";

export async function fetchBoards(ownerId?: string) {
  const { data } = await api.get<{ boards: Board[] }>("/boards", { params: ownerId ? { ownerId } : undefined });
  return data.boards;
}

export async function fetchBoard(id: string) {
  const { data } = await api.get<{ board: Board }>(`/boards/${id}`);
  return data.board;
}

export async function createBoard(payload: { name: string; isPrivate: boolean }) {
  const { data } = await api.post<{ board: Board }>("/boards", payload);
  return data.board;
}

export async function updateBoard(id: string, payload: { name?: string; isPrivate?: boolean }) {
  const { data } = await api.patch<{ board: Board }>(`/boards/${id}`, payload);
  return data.board;
}

export async function savePinToBoard(boardId: string, pinId: string) {
  const { data } = await api.post<{ board: Board }>(`/boards/${boardId}/pins`, { pinId });
  return data.board;
}

export async function removePinFromBoard(boardId: string, pinId: string) {
  const { data } = await api.delete<{ board: Board }>(`/boards/${boardId}/pins/${pinId}`);
  return data.board;
}

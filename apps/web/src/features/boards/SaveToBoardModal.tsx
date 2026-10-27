import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "../../store/ui";
import { createBoard, fetchBoards, savePinToBoard } from "./api";
import { useAuth } from "../auth/hooks/useAuth";
import { useState } from "react";

export function SaveToBoardModal() {
  const { user } = useAuth();
  const savePinId = useUiStore((s) => s.savePinId);
  const setSavePinId = useUiStore((s) => s.setSavePinId);
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const boards = useQuery({
    queryKey: ["boards", user?.id],
    queryFn: () => fetchBoards(user?.id),
    enabled: Boolean(user && savePinId),
  });
  const save = useMutation({
    mutationFn: (boardId: string) => savePinToBoard(boardId, savePinId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      setSavePinId(null);
    },
  });
  const create = useMutation({
    mutationFn: () => createBoard({ name, isPrivate: false }),
    onSuccess: (board) => {
      setName("");
      save.mutate(board.id);
    },
  });

  if (!savePinId) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Save to board</h2>
          <button onClick={() => setSavePinId(null)}>Close</button>
        </div>
        <div className="space-y-2">
          {boards.data?.map((board) => (
            <button
              key={board.id}
              className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-left"
              onClick={() => save.mutate(board.id)}
            >
              <span>{board.name}</span>
              <span className="text-xs text-stone-500">{board.isPrivate ? "Private" : "Public"}</span>
            </button>
          ))}
        </div>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim()) create.mutate();
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New board name"
            className="flex-1 rounded-xl border border-stone-200 px-3 py-2"
          />
          <button className="rounded-full bg-rose-600 px-3 py-2 text-white" type="submit">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

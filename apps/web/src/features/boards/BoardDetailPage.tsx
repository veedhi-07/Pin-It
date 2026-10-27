import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { fetchBoard, removePinFromBoard, updateBoard } from "./api";
import { PinCard } from "../pins/PinCard";
import { useAuth } from "../auth/hooks/useAuth";
import { SaveToBoardModal } from "./SaveToBoardModal";

export function BoardDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const board = useQuery({ queryKey: ["board", id], queryFn: () => fetchBoard(id) });
  const toggle = useMutation({
    mutationFn: () => updateBoard(id, { isPrivate: !board.data?.isPrivate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", id] }),
  });
  const unsave = useMutation({
    mutationFn: (pinId: string) => removePinFromBoard(id, pinId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", id] }),
  });

  if (board.isLoading) return <p>Loading board…</p>;
  if (!board.data) return <p>Board not found or private.</p>;
  const item = board.data;
  const isOwner = user?.id === item.ownerId;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <p className="text-sm text-stone-500">{item.isPrivate ? "Private board" : "Public board"}</p>
        </div>
        {isOwner && (
          <button className="rounded-full border border-stone-300 px-4 py-2" onClick={() => toggle.mutate()}>
            Make {item.isPrivate ? "public" : "private"}
          </button>
        )}
      </div>
      <div className="columns-2 gap-4 md:columns-3">
        {item.pins?.map((pin) => (
          <div key={pin.id} className="relative">
            <PinCard pin={pin} />
            {isOwner && (
              <button
                className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs"
                onClick={() => unsave.mutate(pin.id)}
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <SaveToBoardModal />
    </div>
  );
}

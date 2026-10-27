import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deletePin, downloadPin, fetchPin } from "./api";
import { useAuth } from "../auth/hooks/useAuth";
import { useUiStore } from "../../store/ui";
import { SaveToBoardModal } from "../boards/SaveToBoardModal";
import { SharePinModal } from "../chat/SharePinModal";

export function PinDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSavePinId = useUiStore((s) => s.setSavePinId);
  const setSharePinId = useUiStore((s) => s.setSharePinId);
  const pin = useQuery({ queryKey: ["pin", id], queryFn: () => fetchPin(id) });
  const remove = useMutation({
    mutationFn: () => deletePin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins"] });
      navigate("/");
    },
  });

  if (pin.isLoading) return <p>Loading pin…</p>;
  if (!pin.data) return <p>Pin not found.</p>;
  const item = pin.data;
  const isOwner = user?.id === item.ownerId;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="overflow-hidden rounded-3xl bg-black">
        {item.mediaType === "video" ? (
          <video src={item.mediaUrl} poster={item.thumbnailUrl} controls className="w-full" />
        ) : (
          <img src={item.mediaUrl} alt={item.title} className="w-full" />
        )}
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">{item.title}</h1>
        <p className="mt-2 text-stone-600">{item.description}</p>
        <p className="mt-3 text-sm text-stone-500">By {item.owner?.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-700">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {user && (
            <>
              <button className="rounded-full bg-rose-600 px-4 py-2 text-white" onClick={() => setSavePinId(item.id)}>
                Save
              </button>
              <button className="rounded-full bg-stone-900 px-4 py-2 text-white" onClick={() => setSharePinId(item.id)}>
                Share in chat
              </button>
              <button className="rounded-full border border-stone-300 px-4 py-2" onClick={() => downloadPin(item.id)}>
                Download original
              </button>
            </>
          )}
          {isOwner && (
            <button className="rounded-full px-4 py-2 text-red-600" onClick={() => remove.mutate()}>
              Delete
            </button>
          )}
        </div>
        <Link to="/" className="mt-6 inline-block text-sm text-rose-600">
          Back to feed
        </Link>
      </div>
      <SaveToBoardModal />
      <SharePinModal />
    </div>
  );
}

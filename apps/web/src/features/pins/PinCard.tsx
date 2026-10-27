import { Link } from "react-router-dom";
import type { Pin } from "@pinboard/shared";
import { useUiStore } from "../../store/ui";
import { useAuth } from "../auth/hooks/useAuth";

export function PinCard({ pin }: { pin: Pin }) {
  const { isAuthenticated } = useAuth();
  const setSavePinId = useUiStore((s) => s.setSavePinId);

  return (
    <article className="mb-4 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm">
      <Link to={`/pins/${pin.id}`} className="block">
        {pin.mediaType === "video" ? (
          <video src={pin.mediaUrl} poster={pin.thumbnailUrl} className="w-full" muted playsInline />
        ) : (
          <img src={pin.thumbnailUrl || pin.mediaUrl} alt={pin.title} className="w-full" />
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 p-3">
        <div>
          <Link to={`/pins/${pin.id}`} className="font-semibold">
            {pin.title}
          </Link>
          <p className="text-xs text-stone-500">{pin.owner?.name}</p>
        </div>
        {isAuthenticated && (
          <button
            type="button"
            className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
            onClick={() => setSavePinId(pin.id)}
          >
            Save
          </button>
        )}
      </div>
    </article>
  );
}

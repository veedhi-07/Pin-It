import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { fetchFeed } from "../pins/api";
import { PinCard } from "../pins/PinCard";
import { SaveToBoardModal } from "../boards/SaveToBoardModal";
import { SharePinModal } from "../chat/SharePinModal";

export function FeedPage() {
  const [q, setQ] = useState("");
  const feed = useQuery({ queryKey: ["pins", q], queryFn: () => fetchFeed(q) });

  return (
    <div>
      <form
        className="mb-6"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setQ(String(data.get("q") ?? ""));
        }}
      >
        <input
          name="q"
          placeholder="Search pins"
          className="w-full rounded-full border border-stone-200 bg-white px-5 py-3"
        />
      </form>
      {feed.isLoading && <p className="text-stone-500">Loading pins…</p>}
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
        {feed.data?.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>
      {!feed.isLoading && feed.data?.length === 0 && (
        <p className="mt-8 text-center text-stone-500">No pins yet. Create one to start the feed.</p>
      )}
      <SaveToBoardModal />
      <SharePinModal />
    </div>
  );
}

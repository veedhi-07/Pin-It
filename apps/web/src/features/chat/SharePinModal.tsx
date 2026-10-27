import { useMutation, useQuery } from "@tanstack/react-query";
import { useUiStore } from "../../store/ui";
import { fetchConversations, sendMessage } from "./api";
import { useAuth } from "../auth/hooks/useAuth";

export function SharePinModal() {
  const sharePinId = useUiStore((s) => s.sharePinId);
  const setSharePinId = useUiStore((s) => s.setSharePinId);
  const { user } = useAuth();
  const conversations = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: Boolean(sharePinId),
  });
  const share = useMutation({
    mutationFn: (conversationId: string) => sendMessage(conversationId, { type: "pin", pinId: sharePinId! }),
    onSuccess: () => setSharePinId(null),
  });

  if (!sharePinId) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share pin in chat</h2>
          <button onClick={() => setSharePinId(null)}>Close</button>
        </div>
        <div className="space-y-2">
          {conversations.data?.map((conversation) => {
            const title =
              conversation.type === "group"
                ? conversation.name
                : conversation.members.find((member) => member.userId !== user?.id)?.user?.name;
            return (
              <button
                key={conversation.id}
                className="w-full rounded-xl border border-stone-200 px-3 py-2 text-left"
                onClick={() => share.mutate(conversation.id)}
              >
                {title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

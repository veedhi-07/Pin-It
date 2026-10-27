import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@pinboard/shared";
import { getSocket } from "../../../socket";
import { useAuth } from "../../auth/hooks/useAuth";

export function useChatSocket(conversationId?: string) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const onMessage = (message: Message) => {
      queryClient.setQueryData<Message[]>(["messages", message.conversationId], (current) => {
        if (!current) return [message];
        if (current.some((item) => item.id === message.id)) return current;
        return [...current, message];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("message:new", onMessage);
    if (conversationId) {
      socket.emit("conversation:join", conversationId);
    }
    return () => {
      socket.off("message:new", onMessage);
    };
  }, [isAuthenticated, conversationId, queryClient]);
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { fetchConversations, fetchMessages, sendMessage, updateMembers, searchUsers } from "./api";
import { useAuth } from "../auth/hooks/useAuth";
import { useChatSocket } from "./hooks/useChatSocket";
import { getSocket } from "../../socket";

export function ConversationPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  useChatSocket(id);
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });
  const messages = useQuery({ queryKey: ["messages", id], queryFn: () => fetchMessages(id) });
  const people = useQuery({
    queryKey: ["users", memberQuery],
    queryFn: () => searchUsers(memberQuery),
    enabled: memberQuery.length > 0,
  });
  const conversation = conversations.data?.find((item) => item.id === id);
  const send = useMutation({
    mutationFn: () => sendMessage(id, { type: "text", body }),
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });
  const addMember = useMutation({
    mutationFn: (userId: string) => updateMembers(id, { add: [userId] }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });
  const title =
    conversation?.type === "group"
      ? conversation.name
      : conversation?.members.find((member) => member.userId !== user?.id)?.user?.name;

  return (
    <div className="grid min-h-[70vh] gap-4 md:grid-cols-[240px_1fr]">
      <aside className="rounded-3xl bg-white p-3 shadow-sm">
        {conversations.data?.map((item) => (
          <Link
            key={item.id}
            to={`/chat/${item.id}`}
            className={`block rounded-xl px-3 py-2 ${item.id === id ? "bg-rose-50" : ""}`}
          >
            {item.type === "group"
              ? item.name
              : item.members.find((member) => member.userId !== user?.id)?.user?.name}
          </Link>
        ))}
      </aside>
      <section className="flex flex-col rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{title}</h1>
          {conversation?.type === "group" && (
            <div className="text-sm text-stone-500">{conversation.members.length} members</div>
          )}
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.data?.map((message) => (
            <div key={message.id} className={`max-w-md rounded-2xl px-3 py-2 ${message.senderId === user?.id ? "ml-auto bg-rose-100" : "bg-stone-100"}`}>
              <p className="text-xs text-stone-500">{message.sender?.name}</p>
              {message.type === "pin" && message.pin ? (
                <Link to={`/pins/${message.pin.id}`} className="mt-1 block overflow-hidden rounded-xl bg-white">
                  <img src={message.pin.thumbnailUrl} alt={message.pin.title} className="h-32 w-full object-cover" />
                  <span className="block p-2 font-medium">{message.pin.title}</span>
                </Link>
              ) : (
                <p>{message.body}</p>
              )}
            </div>
          ))}
        </div>
        {conversation?.type === "group" && (
          <div className="mt-3 border-t border-stone-100 pt-3">
            <input
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
              placeholder="Add member"
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            {people.data?.map((person) => (
              <button key={person.id} className="mt-1 block text-sm text-rose-600" onClick={() => addMember.mutate(person.id)}>
                Add {person.name}
              </button>
            ))}
          </div>
        )}
        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!body.trim()) return;
            getSocket().emit("typing", { conversationId: id, typing: false });
            send.mutate();
          }}
        >
          <input
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              getSocket().emit("typing", { conversationId: id, typing: true });
            }}
            className="flex-1 rounded-full border border-stone-200 px-4 py-2"
            placeholder="Message"
          />
          <button className="rounded-full bg-rose-600 px-4 py-2 text-white" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createDm, createGroup, fetchConversations, searchUsers } from "./api";
import { useAuth } from "../auth/hooks/useAuth";
import { useChatSocket } from "./hooks/useChatSocket";

export function ChatPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  useChatSocket();
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });
  const users = useQuery({
    queryKey: ["users", query],
    queryFn: () => searchUsers(query),
    enabled: query.length > 0,
  });
  const dm = useMutation({
    mutationFn: createDm,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/chat/${conversation.id}`);
    },
  });
  const group = useMutation({
    mutationFn: createGroup,
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/chat/${conversation.id}`);
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Conversations</h2>
        <div className="space-y-2">
          {conversations.data?.map((conversation) => {
            const title =
              conversation.type === "group"
                ? conversation.name
                : conversation.members.find((member) => member.userId !== user?.id)?.user?.name;
            return (
              <Link key={conversation.id} to={`/chat/${conversation.id}`} className="block rounded-xl px-3 py-2 hover:bg-rose-50">
                <p className="font-medium">{title}</p>
                <p className="truncate text-xs text-stone-500">{conversation.lastMessage?.body || conversation.lastMessage?.type}</p>
              </Link>
            );
          })}
        </div>
      </aside>
      <section className="space-y-6 rounded-3xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="mb-2 font-semibold">Start a DM</h2>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people"
            className="w-full rounded-xl border border-stone-200 px-3 py-2"
          />
          <div className="mt-2 space-y-1">
            {users.data?.map((person) => (
              <button
                key={person.id}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-left hover:bg-stone-50"
                onClick={() => dm.mutate(person.id)}
              >
                <span>{person.name}</span>
                <span className="text-xs text-stone-500">{person.email}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-2 font-semibold">New group</h2>
          <input
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder="Group name"
            className="mb-2 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
          <div className="mb-3 space-y-1">
            {users.data?.map((person) => (
              <label key={person.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(person.id)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id],
                    )
                  }
                />
                {person.name}
              </label>
            ))}
          </div>
          <button
            className="rounded-full bg-rose-600 px-4 py-2 text-white"
            onClick={() => groupName && group.mutate({ name: groupName, memberIds: selected })}
          >
            Create group
          </button>
        </div>
      </section>
    </div>
  );
}

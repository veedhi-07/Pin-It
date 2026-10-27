import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { createBoard, fetchBoards } from "./api";
import { useAuth } from "../auth/hooks/useAuth";

export function BoardsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const boards = useQuery({
    queryKey: ["boards", user?.id],
    queryFn: () => fetchBoards(user?.id),
    enabled: Boolean(user),
  });
  const form = useForm({ defaultValues: { name: "", isPrivate: false } });
  const create = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      form.reset();
    },
  });

  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 shadow-sm"
        onSubmit={form.handleSubmit((values) => create.mutate(values))}
      >
        <label className="text-sm">
          New board
          <input className="mt-1 block rounded-xl border border-stone-200 px-3 py-2" {...form.register("name", { required: true })} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...form.register("isPrivate")} />
          Private
        </label>
        <button type="submit" className="rounded-full bg-rose-600 px-4 py-2 text-white">
          Create
        </button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {boards.data?.map((board) => (
          <Link key={board.id} to={`/boards/${board.id}`} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{board.name}</h2>
            <p className="text-sm text-stone-500">
              {board.pinCount ?? 0} pins · {board.isPrivate ? "Private" : "Public"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

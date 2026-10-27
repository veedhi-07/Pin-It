import { useForm } from "react-hook-form";
import { useAuth } from "../auth/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Board, Pin } from "@pinboard/shared";
import { PinCard } from "../pins/PinCard";
import { Link } from "react-router-dom";

export function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const form = useForm({ defaultValues: { name: user?.name ?? "", avatarUrl: user?.avatarUrl ?? "" } });
  const pins = useQuery({
    queryKey: ["pins", "mine", user?.id],
    queryFn: async () => {
      const { data } = await api.get<{ pins: Pin[] }>("/pins");
      return data.pins.filter((pin) => pin.ownerId === user?.id);
    },
    enabled: Boolean(user),
  });
  const boards = useQuery({
    queryKey: ["boards", user?.id],
    queryFn: async () => {
      const { data } = await api.get<{ boards: Board[] }>("/boards", { params: { ownerId: user?.id } });
      return data.boards;
    },
    enabled: Boolean(user),
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold">Your profile</h1>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) =>
            updateProfile.mutate({ name: values.name, avatarUrl: values.avatarUrl || null }),
          )}
        >
          <label className="text-sm">
            Name
            <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("name")} />
          </label>
          <label className="text-sm">
            Avatar URL
            <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("avatarUrl")} />
          </label>
          <button type="submit" className="rounded-full bg-rose-600 px-4 py-2 text-white md:col-span-2">
            Save profile
          </button>
        </form>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Boards</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {boards.data?.map((board) => (
            <Link key={board.id} to={`/boards/${board.id}`} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold">{board.name}</p>
              <p className="text-sm text-stone-500">
                {board.pinCount ?? 0} pins · {board.isPrivate ? "Private" : "Public"}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Your pins</h2>
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {pins.data?.map((pin) => (
            <PinCard key={pin.id} pin={pin} />
          ))}
        </div>
      </section>
    </div>
  );
}

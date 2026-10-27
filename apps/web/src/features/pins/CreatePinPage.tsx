import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPin } from "./api";

interface FormValues {
  title: string;
  description: string;
  tags: string;
  file: FileList;
}

export function CreatePinPage() {
  const form = useForm<FormValues>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createPin,
    onSuccess: (pin) => {
      queryClient.invalidateQueries({ queryKey: ["pins"] });
      navigate(`/pins/${pin.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Create a pin</h1>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const data = new FormData();
          data.append("title", values.title);
          data.append("description", values.description ?? "");
          data.append(
            "tags",
            JSON.stringify(
              values.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            ),
          );
          data.append("file", values.file[0]);
          mutation.mutate(data);
        })}
      >
        <label className="block text-sm">
          Image or video
          <input type="file" accept="image/*,video/*" className="mt-1 w-full" {...form.register("file", { required: true })} />
        </label>
        <label className="block text-sm">
          Title
          <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("title", { required: true })} />
        </label>
        <label className="block text-sm">
          Description
          <textarea className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("description")} />
        </label>
        <label className="block text-sm">
          Tags (comma separated)
          <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("tags")} />
        </label>
        {mutation.error && <p className="text-sm text-red-600">Upload failed. Check the file and try again.</p>}
        <button type="submit" className="w-full rounded-full bg-rose-600 py-2 font-semibold text-white" disabled={mutation.isPending}>
          {mutation.isPending ? "Uploading…" : "Publish pin"}
        </button>
      </form>
    </div>
  );
}

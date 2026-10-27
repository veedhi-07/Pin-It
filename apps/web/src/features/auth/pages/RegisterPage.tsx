import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@pinboard/shared";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const form = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Join Pinboard</h1>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await register.mutateAsync(values);
          navigate("/", { replace: true });
        })}
      >
        <label className="block text-sm">
          Name
          <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("name")} />
        </label>
        <label className="block text-sm">
          Email
          <input className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2" {...form.register("email")} />
        </label>
        <label className="block text-sm">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
            {...form.register("password")}
          />
        </label>
        {register.error && <p className="text-sm text-red-600">Could not create that account.</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-rose-600 py-2 font-semibold text-white"
          disabled={register.isPending}
        >
          {register.isPending ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Already have an account? <Link to="/login" className="text-rose-600">Log in</Link>
      </p>
    </div>
  );
}

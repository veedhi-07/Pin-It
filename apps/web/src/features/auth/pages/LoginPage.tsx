import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@pinboard/shared";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const form = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Welcome back</h1>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          await login.mutateAsync(values);
          navigate(from, { replace: true });
        })}
      >
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
        {login.error && <p className="text-sm text-red-600">Could not log in. Check your credentials.</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-rose-600 py-2 font-semibold text-white"
          disabled={login.isPending}
        >
          {login.isPending ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        New here? <Link to="/register" className="text-rose-600">Create an account</Link>
      </p>
    </div>
  );
}

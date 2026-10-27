import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm ${isActive ? "bg-rose-600 text-white" : "text-stone-700 hover:bg-rose-100"}`;

export function Layout() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-rose-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-black tracking-tight text-rose-600">
            Pinboard
          </Link>
          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={linkClass} end>
              Feed
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/pins/new" className={linkClass}>
                  Create
                </NavLink>
                <NavLink to="/boards" className={linkClass}>
                  Boards
                </NavLink>
                <NavLink to="/chat" className={linkClass}>
                  Chat
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  {user?.name}
                </NavLink>
                <button
                  type="button"
                  className="rounded-full px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
                  onClick={() => logout.mutate()}
                >
                  Log out
                </button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <NavLink to="/login" className={linkClass}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={linkClass}>
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

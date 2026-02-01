import { Link, NavLink, Outlet } from "react-router-dom";
import { useHouseholdId } from "./householdStore";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-lg px-3 py-2 text-sm",
          isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export function AppShell() {
  const { householdId } = useHouseholdId();

  return (
    <div className="min-h-full">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4">
          <Link to="/" className="font-semibold">
            MadMed
          </Link>

          <div className="flex items-center gap-2">
            {householdId ? (
              <span className="rounded-full border px-3 py-1 text-xs font-mono text-gray-700">
                {householdId}
              </span>
            ) : (
              <span className="rounded-full border px-3 py-1 text-xs text-gray-500">
                no household
              </span>
            )}

            <nav className="flex items-center gap-2">
              <NavItem to="/household" label="Household" />
              <NavItem to="/dashboard" label="Dashboard" />
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  );
}

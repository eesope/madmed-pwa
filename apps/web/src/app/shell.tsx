// 공통 레이아웃; 헤더, 탭...

import { Link, Outlet } from "react-router-dom";

export function AppShell() {
  return (
    <div className="min-h-full">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <Link to="/" className="font-semibold">
            MadMed
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link to="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4">
        <Outlet />
      </main>
    </div>
  );
}

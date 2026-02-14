import { Link, NavLink, Outlet } from "react-router-dom";
import { useHouseholdId } from "./householdStore";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-lg px-3 py-2 text-sm transition-colors",
          // 활성화 시: dark-teal 배경에 흰색 글자
          // 비활성화 시: 글자색을 text-primary로 변경 + 호버 시 연한 티일 배경
          isActive 
            ? "bg-dark-teal text-white" 
            : "text-primary hover:bg-light-teal",
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
    /* 1. 전체 화면 배경을 beige로, 최소 높이를 화면 전체(min-h-screen)로 설정 */
    /* 2. flex flex-col items-center를 통해 내용을 가로 가운데 정렬 */
    <div className="min-h-screen bg-beige flex flex-col items-center">
      
      {/* header에서 border-b(하단 선)를 제거했습니다 */}
    <header className="w-full bg-beige pt-[env(safe-area-inset-top)]">        
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 p-4">
          
          {/* Mad와 Med의 색상을 다르게 지정 */}
          <Link to="/" className="text-xl font-bold tracking-tight">
            <span className="text-dark-teal">Mad</span>
            <span className="text-primary">Med</span>
          </Link>

          <div className="flex items-center gap-2">
            {householdId ? (
              <span className="rounded-full border border-dark-teal/20 px-3 py-1 text-[10px] font-mono text-dark-teal">
                {householdId}
              </span>
            ) : (
              <span className="rounded-full border border-dark-teal/20 px-3 py-1 text-[10px] text-gray-400">
                ?
              </span>
            )}

            <nav className="flex items-center gap-1">
              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/notifications" label="Notification" />
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역도 max-w-md로 제한하여 모바일 앱 레이아웃 유지 */}
      <main className="w-full max-w-md flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
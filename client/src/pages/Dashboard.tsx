import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { fetchCurrentUser, logout } from "../lib/auth";
import type { SessionUser } from "../lib/auth";
import DashboardHeader from "./dashboard/DashboardHeader";
import DashboardSidebar from "./dashboard/DashboardSidebar";
import { dashboardSectionLabels, dashboardSectionPaths, getDashboardSectionFromPath } from "./dashboard/dashboardData";

function LoadingState() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(139,124,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(94,207,176,0.12),_transparent_24%),linear-gradient(180deg,_#0c0c11_0%,_#09090d_100%)] text-foreground"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-foreground">Checking your session</p>
        <p className="mt-1 text-xs text-muted-foreground">Hang tight while we load your workspace.</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState<"checking" | "ready">("checking");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const activeNav = getDashboardSectionFromPath(location.pathname);

  useEffect(() => {
    let isActive = true;

    fetchCurrentUser()
      .then((user) => {
        if (!isActive) {
          return;
        }

        setCurrentUser(user);
        setAuthStatus("ready");
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        navigate("/login", { replace: true });
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  const displayName = currentUser?.name ?? "Maya Chen";
  const firstName = currentUser?.name?.split(/\s+/)[0] ?? "Maya";
  const sectionLabel = dashboardSectionLabels[activeNav];

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (authStatus === "checking") {
    return <LoadingState />;
  }

  return (
    <div
      className="size-full flex bg-background text-foreground overflow-hidden"
      style={{ fontFamily: "'Figtree', sans-serif" }}
    >
      <DashboardSidebar
        activeNav={activeNav}
        displayName={displayName}
        onHome={() => navigate("/dashboard")}
        onNavigate={(section) => navigate(dashboardSectionPaths[section])}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader
          crumbLabel={sectionLabel}
          searchFocused={searchFocused}
          onBlur={() => setSearchFocused(false)}
          onFocus={() => setSearchFocused(true)}
        />

        <div className="flex-1 overflow-y-auto scrollbar-none p-6">
          <Outlet context={{ firstName }} />
        </div>
      </main>

      <style>{`.scrollbar-none { scrollbar-width: none; } .scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

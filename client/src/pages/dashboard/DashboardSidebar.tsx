import { Settings, X, Zap } from "lucide-react";
import type { DashboardSection } from "./dashboardData";
import { navItems } from "./dashboardData";

type DashboardSidebarProps = {
  activeNav: DashboardSection;
  displayName: string;
  onHome: () => void;
  onNavigate: (section: DashboardSection) => void;
  onSignOut: () => void | Promise<void>;
};

export default function DashboardSidebar({
  activeNav,
  displayName,
  onHome,
  onNavigate,
  onSignOut,
}: DashboardSidebarProps) {
  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-[#0a0a0f] py-5">
      <div className="px-5 mb-8">
        <button onClick={onHome} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Zap size={14} className="text-primary" />
          </div>
          <span className="text-[15px] font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Workspace
          </span>
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
              activeNav === id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 mt-4 pt-4 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150">
          <Settings size={15} />
          Settings
        </button>
        <div className="mt-3 px-3 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground truncate">Senior Designer</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150"
        >
          <X size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

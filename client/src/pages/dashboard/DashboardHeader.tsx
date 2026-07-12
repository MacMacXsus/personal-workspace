import { Bell, ChevronRight, Plus, Search } from "lucide-react";

type DashboardHeaderProps = {
  searchFocused: boolean;
  crumbLabel: string;
  onFocus: () => void;
  onBlur: () => void;
};

export default function DashboardHeader({ searchFocused, crumbLabel, onFocus, onBlur }: DashboardHeaderProps) {
  return (
    <header className="shrink-0 h-[56px] flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="text-foreground font-medium">Dashboard</span>
        <ChevronRight size={13} className="opacity-40" />
        <span>{crumbLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 h-8 px-3 rounded-md border text-sm transition-all duration-200 ${searchFocused ? "border-primary/40 bg-secondary w-52" : "border-border bg-muted w-36"}`}
        >
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full"
            placeholder="Search..."
            onBlur={onBlur}
            onFocus={onFocus}
          />
          <kbd className="text-[9px] text-muted-foreground font-mono shrink-0 opacity-60">⌘K</kbd>
        </div>
        <button className="relative w-8 h-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
        </button>
        <button className="flex items-center gap-2 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-150">
          <Plus size={13} />
          New
        </button>
      </div>
    </header>
  );
}

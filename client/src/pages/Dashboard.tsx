import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Calendar,
  BarChart2,
  Settings,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Clock,
  Flame,
  Target,
  ArrowUpRight,
  MoreHorizontal,
  Circle,
  CheckCircle2,
  Inbox,
  Zap,
  Bookmark,
  ExternalLink,
  Folder,
  Tag,
  Globe,
  Trash2,
  X,
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import Vault from "./Vault";
import { fetchCurrentUser, logout } from "../lib/auth";
import type { SessionUser } from "../lib/auth";

const focusData = [
  { day: "Mon", hours: 3.2 },
  { day: "Tue", hours: 5.1 },
  { day: "Wed", hours: 4.4 },
  { day: "Thu", hours: 6.8 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 2.1 },
  { day: "Sun", hours: 4.0 },
];

const tasks = [
  { id: 1, title: "Finalize Q3 design system audit", tag: "Design", done: false, priority: "high" },
  { id: 2, title: "Review pull request #248 — auth refactor", tag: "Engineering", done: false, priority: "high" },
  { id: 3, title: "Send weekly update to stakeholders", tag: "Comms", done: true, priority: "medium" },
  { id: 4, title: "Set up Figma variables for dark mode tokens", tag: "Design", done: false, priority: "medium" },
  { id: 5, title: "Draft retrospective notes from sprint 14", tag: "Product", done: true, priority: "low" },
  { id: 6, title: "Research motion design libraries for onboarding", tag: "Design", done: false, priority: "low" },
];

const notes = [
  { id: 1, title: "System design principles", preview: "Cohesion over decoration. Every element should earn its place...", date: "Today", tag: "Design" },
  { id: 2, title: "Q4 roadmap thoughts", preview: "Focus on retention loop, not acquisition. The funnel is fine but...", date: "Yesterday", tag: "Product" },
  { id: 3, title: "Reading: Shape Up by Basecamp", preview: "Appetite vs estimate — the distinction matters enormously for scoping...", date: "Jul 2", tag: "Reading" },
];

const calendarDays = [
  { day: "Mon", date: 30, events: 2 },
  { day: "Tue", date: 1, events: 4, today: true },
  { day: "Wed", date: 2, events: 1 },
  { day: "Thu", date: 3, events: 3 },
  { day: "Fri", date: 4, events: 0 },
  { day: "Sat", date: 5, events: 1 },
  { day: "Sun", date: 6, events: 0 },
];

const upcomingEvents = [
  { time: "10:00", title: "Design sync — mobile patterns", duration: "45m", type: "meeting" },
  { time: "13:30", title: "Focus block — auth flow prototype", duration: "2h", type: "focus" },
  { time: "16:00", title: "1:1 with Priya", duration: "30m", type: "meeting" },
];

const navItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: CheckSquare, label: "Tasks", id: "tasks" },
  { icon: FileText, label: "Vault", id: "notes" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: BarChart2, label: "Focus", id: "focus" },
  { icon: Bookmark, label: "Bookmarks", id: "bookmarks" },
  { icon: Inbox, label: "Inbox", id: "inbox" },
];

// ── Bookmark data ──────────────────────────────────────────────
const bookmarkFolders = ["All", "Design", "Engineering", "Reading", "Tools", "Research"];

const initialBookmarks = [
  { id: 1, title: "Refactoring UI", url: "refactoringui.com", folder: "Design", tags: ["ui", "design"], favicon: "R", color: "#8b7cf8", pinned: true },
  { id: 2, title: "Linear — Issue tracker", url: "linear.app", folder: "Tools", tags: ["pm", "productivity"], favicon: "L", color: "#5ecfb0", pinned: true },
  { id: 3, title: "Shape Up by Basecamp", url: "basecamp.com/shapeup", folder: "Reading", tags: ["product", "process"], favicon: "S", color: "#f5a623", pinned: false },
  { id: 4, title: "Tailwind CSS docs", url: "tailwindcss.com/docs", folder: "Engineering", tags: ["css", "frontend"], favicon: "T", color: "#7ec8e3", pinned: false },
  { id: 5, title: "Framer Motion API", url: "motion.dev", folder: "Engineering", tags: ["animation", "react"], favicon: "F", color: "#e05252", pinned: false },
  { id: 6, title: "Mobbin — UI patterns", url: "mobbin.com", folder: "Design", tags: ["ui", "patterns"], favicon: "M", color: "#8b7cf8", pinned: false },
  { id: 7, title: "Everything about typography", url: "practicaltypography.com", folder: "Design", tags: ["typography", "design"], favicon: "P", color: "#f5a623", pinned: true },
  { id: 8, title: "Excalidraw", url: "excalidraw.com", folder: "Tools", tags: ["whiteboard", "diagrams"], favicon: "E", color: "#5ecfb0", pinned: false },
  { id: 9, title: "Hacker News", url: "news.ycombinator.com", folder: "Research", tags: ["news", "tech"], favicon: "H", color: "#f5a623", pinned: false },
  { id: 10, title: "React docs — hooks reference", url: "react.dev/reference/hooks", folder: "Engineering", tags: ["react", "frontend"], favicon: "R", color: "#7ec8e3", pinned: false },
  { id: 11, title: "Stripe API reference", url: "stripe.com/docs/api", folder: "Engineering", tags: ["api", "payments"], favicon: "S", color: "#5ecfb0", pinned: false },
  { id: 12, title: "The Art of Unix Programming", url: "catb.org/esr/writings/taoup", folder: "Reading", tags: ["systems", "philosophy"], favicon: "U", color: "#6b6b80", pinned: false },
];

const tagColors: Record<string, string> = {
  Design: "text-[#8b7cf8] bg-[#8b7cf8]/10",
  Engineering: "text-[#5ecfb0] bg-[#5ecfb0]/10",
  Comms: "text-[#f5a623] bg-[#f5a623]/10",
  Product: "text-[#7ec8e3] bg-[#7ec8e3]/10",
  Reading: "text-[#e05252] bg-[#e05252]/10",
};

const priorityDot: Record<string, string> = {
  high: "bg-[#e05252]",
  medium: "bg-[#f5a623]",
  low: "bg-[#6b6b80]",
};

function BookmarkCard({
  bm,
  onDelete,
  onTogglePin,
}: {
  bm: typeof initialBookmarks[0];
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
}) {
  return (
    <div className="group bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/20 transition-all duration-200 relative">
      {/* Actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onTogglePin(bm.id)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors duration-150 ${bm.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          title={bm.pinned ? "Unpin" : "Pin"}
        >
          <Bookmark size={11} fill={bm.pinned ? "currentColor" : "none"} />
        </button>
        <button
          onClick={() => onDelete(bm.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-[#e05252] transition-colors duration-150"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Favicon + title */}
      <div className="flex items-start gap-3 pr-12">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: bm.color + "30", color: bm.color }}
        >
          {bm.favicon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{bm.title}</p>
        </div>
      </div>

      {/* URL */}
      <a
        href={`https://${bm.url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors duration-150 truncate"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={9} className="shrink-0" />
        {bm.url}
      </a>

      {/* Tags + folder */}
      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
        <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          <Folder size={8} />
          {bm.folder}
        </span>
        {bm.tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            <Tag size={8} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState<"checking" | "ready">(
    "checking",
  );
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [activeNav, setActiveNav] = useState("overview");
  const [taskList, setTaskList] = useState(tasks);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [bmFolder, setBmFolder] = useState("All");
  const [bmSearch, setBmSearch] = useState("");
  const [bmAddOpen, setBmAddOpen] = useState(false);
  const [bmNew, setBmNew] = useState({ title: "", url: "", folder: "Design", tags: "" });

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

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchFolder = bmFolder === "All" || b.folder === bmFolder;
    const q = bmSearch.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q));
    return matchFolder && matchSearch;
  });

  const pinnedBookmarks = filteredBookmarks.filter((b) => b.pinned);
  const unpinnedBookmarks = filteredBookmarks.filter((b) => !b.pinned);

  const deleteBookmark = (id: number) => setBookmarks((prev) => prev.filter((b) => b.id !== id));
  const togglePin = (id: number) => setBookmarks((prev) => prev.map((b) => b.id === id ? { ...b, pinned: !b.pinned } : b));

  const addBookmark = () => {
    if (!bmNew.title || !bmNew.url) return;
    const colors = ["#8b7cf8", "#5ecfb0", "#f5a623", "#7ec8e3", "#e05252"];
    setBookmarks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: bmNew.title,
        url: bmNew.url,
        folder: bmNew.folder,
        tags: bmNew.tags.split(",").map((t) => t.trim()).filter(Boolean),
        favicon: bmNew.title[0].toUpperCase(),
        color: colors[Math.floor(Math.random() * colors.length)],
        pinned: false,
      },
    ]);
    setBmNew({ title: "", url: "", folder: "Design", tags: "" });
    setBmAddOpen(false);
  };

  const completedCount = taskList.filter((t) => t.done).length;
  const totalTasks = taskList.length;
  const displayName = currentUser?.name ?? "Maya Chen";
  const firstName = currentUser?.name?.split(/\s+/)[0] ?? "Maya";

  const toggleTask = (id: number) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  if (authStatus === "checking") {
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

  return (
    <div className="size-full flex bg-background text-foreground overflow-hidden" style={{ fontFamily: "'Figtree', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 flex flex-col border-r border-border bg-[#0a0a0f] py-5">
        <div className="px-5 mb-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
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
              onClick={() => setActiveNav(id)}
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
            onClick={async () => {
              try {
                await logout();
              } finally {
                navigate("/login", { replace: true });
              }
            }}
            className="mt-3 w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150"
          >
            <X size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 h-[56px] flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Overview</span>
            <ChevronRight size={13} className="opacity-40" />
            <span className="text-foreground font-medium">Dashboard</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 h-8 px-3 rounded-md border text-sm transition-all duration-200 ${searchFocused ? "border-primary/40 bg-secondary w-52" : "border-border bg-muted w-36"}`}>
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full"
                placeholder="Search…"
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
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

        <div className="flex-1 overflow-y-auto scrollbar-none p-6">

          {/* ── Vault panel ── */}
          {activeNav === "notes" && <Vault />}

          {/* ── Bookmarks panel ── */}
          {activeNav === "bookmarks" && (
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h1 className="text-[26px] font-semibold text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                    Bookmarks
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">{bookmarks.length} saved · {pinnedBookmarks.length + (bmFolder === "All" ? bookmarks.filter(b=>b.pinned).length : 0)} pinned</p>
                </div>
                <button
                  onClick={() => setBmAddOpen(true)}
                  className="flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-150"
                >
                  <Plus size={13} />
                  Add bookmark
                </button>
              </div>

              {/* Search + folders */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted flex-1 max-w-xs">
                  <Search size={13} className="text-muted-foreground shrink-0" />
                  <input
                    className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full"
                    placeholder="Search bookmarks…"
                    value={bmSearch}
                    onChange={(e) => setBmSearch(e.target.value)}
                  />
                  {bmSearch && (
                    <button onClick={() => setBmSearch("")}><X size={11} className="text-muted-foreground" /></button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {bookmarkFolders.map((f) => (
                    <button
                      key={f}
                      onClick={() => setBmFolder(f)}
                      className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all duration-150 ${
                        bmFolder === f
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {f === "All" ? <Globe size={11} /> : <Folder size={11} />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pinned */}
              {pinnedBookmarks.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Bookmark size={10} className="text-primary" /> Pinned
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {pinnedBookmarks.map((bm) => (
                      <BookmarkCard key={bm.id} bm={bm} onDelete={deleteBookmark} onTogglePin={togglePin} />
                    ))}
                  </div>
                </div>
              )}

              {/* All / rest */}
              {unpinnedBookmarks.length > 0 && (
                <div>
                  {pinnedBookmarks.length > 0 && (
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Globe size={10} /> All
                    </p>
                  )}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {unpinnedBookmarks.map((bm) => (
                      <BookmarkCard key={bm.id} bm={bm} onDelete={deleteBookmark} onTogglePin={togglePin} />
                    ))}
                  </div>
                </div>
              )}

              {filteredBookmarks.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <Bookmark size={28} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No bookmarks found</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Try a different folder or search term</p>
                </div>
              )}
            </div>
          )}

          {/* Add bookmark modal */}
          {bmAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>New bookmark</h2>
                  <button onClick={() => setBmAddOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Title", key: "title", placeholder: "e.g. Tailwind CSS docs" },
                    { label: "URL", key: "url", placeholder: "e.g. tailwindcss.com/docs" },
                    { label: "Tags", key: "tags", placeholder: "css, frontend, reference" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">{label}</p>
                      <input
                        className="w-full h-8 px-3 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 transition-colors"
                        placeholder={placeholder}
                        value={bmNew[key as keyof typeof bmNew]}
                        onChange={(e) => setBmNew((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Folder</p>
                    <select
                      className="w-full h-8 px-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
                      value={bmNew.folder}
                      onChange={(e) => setBmNew((p) => ({ ...p, folder: e.target.value }))}
                    >
                      {bookmarkFolders.filter((f) => f !== "All").map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setBmAddOpen(false)} className="flex-1 h-8 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                  <button onClick={addBookmark} className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                    Save bookmark
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Overview (original dashboard) ── */}
          {activeNav !== "bookmarks" && activeNav !== "notes" && <>
          <div className="mb-6">
            <h1 className="text-[28px] font-semibold text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Good afternoon, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Tuesday, July 1 · You have 4 tasks due today</p>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: Target, label: "Tasks done", value: `${completedCount}/${totalTasks}`, color: "text-primary" },
              { icon: Flame, label: "Focus streak", value: "7 days", color: "text-[#f5a623]" },
              { icon: Clock, label: "Hours today", value: "4.2h", color: "text-[#5ecfb0]" },
              { icon: ArrowUpRight, label: "Productivity", value: "+18%", color: "text-[#7ec8e3]" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all duration-200">
                <div className={`${color} opacity-80`}><Icon size={16} /></div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">{label}</p>
                  <p className={`text-lg font-semibold leading-tight ${color}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_320px] gap-4 mb-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className="text-primary" />
                  <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Today's tasks</span>
                  <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{totalTasks - completedCount} left</span>
                </div>
                <button className="text-muted-foreground hover:text-foreground transition-colors duration-150"><MoreHorizontal size={15} /></button>
              </div>

              <div className="divide-y divide-border">
                {taskList.map((task) => (
                  <div key={task.id} className="flex items-center gap-3.5 px-5 py-3 group hover:bg-secondary/40 transition-all duration-150 cursor-pointer" onClick={() => toggleTask(task.id)}>
                    <div className={`shrink-0 transition-all duration-200 ${task.done ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}>
                      {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm transition-all duration-200 ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColors[task.tag] ?? "text-muted-foreground bg-muted"}`}>{task.tag}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-border">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <Plus size={12} /> Add task
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#5ecfb0]" />
                  <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>July 2025</span>
                </div>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
              <div className="px-4 py-3 border-b border-border">
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(({ day, date, events, today }) => (
                    <div key={day} className="flex flex-col items-center gap-1">
                      <span className="text-[9px] font-mono text-muted-foreground uppercase">{day}</span>
                      <button className={`w-7 h-7 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center ${today ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>{date}</button>
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(events, 3) }).map((_, i) => (
                          <span key={i} className={`w-1 h-1 rounded-full ${today ? "bg-primary/60" : "bg-muted-foreground/40"}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto scrollbar-none">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Today's schedule</p>
                {upcomingEvents.map((ev) => (
                  <div key={ev.time} className={`flex items-start gap-3 p-2.5 rounded-md border transition-all duration-150 hover:border-primary/20 ${ev.type === "focus" ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"}`}>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{ev.time}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-snug">{ev.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ev.duration}</p>
                    </div>
                    {ev.type === "focus" && <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">focus</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-4">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-[#f5a623]" />
                  <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Recent notes</span>
                </div>
                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1">All <ChevronRight size={12} /></button>
              </div>
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <button key={note.id} onClick={() => setActiveNote(activeNote === note.id ? null : note.id)} className={`w-full text-left px-5 py-3.5 transition-all duration-150 hover:bg-secondary/40 ${activeNote === note.id ? "bg-secondary/40" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{note.preview}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] font-mono text-muted-foreground">{note.date}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${tagColors[note.tag] ?? "text-muted-foreground bg-muted"}`}>{note.tag}</span>
                      </div>
                    </div>
                    {activeNote === note.id && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{note.preview}</p>}
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                  <Plus size={12} /> New note
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <BarChart2 size={14} className="text-[#7ec8e3]" />
                  <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>Focus hours</span>
                  <span className="text-[10px] font-mono text-muted-foreground">this week</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#5ecfb0]">
                  <ArrowUpRight size={12} />
                  <span className="font-mono">+22%</span>
                </div>
              </div>
              <div className="flex-1 px-2 py-4">
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={focusData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b7cf8" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b7cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b6b80", fontFamily: "DM Mono" }} />
                    <Tooltip
                      contentStyle={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", fontSize: "11px", color: "#e4e4ee", fontFamily: "DM Mono" }}
                      itemStyle={{ color: "#8b7cf8" }}
                      cursor={{ stroke: "rgba(139,124,248,0.2)", strokeWidth: 1 }}
                      formatter={(value) => [`${value}h`, "Focus"]}
                    />
                    <Area type="monotone" dataKey="hours" stroke="#8b7cf8" strokeWidth={2} fill="url(#focusGrad)" dot={{ r: 3, fill: "#8b7cf8", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#8b7cf8", stroke: "#0c0c11", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="px-5 py-3 border-t border-border grid grid-cols-3 gap-2">
                {[{ label: "Avg / day", value: "4.4h" }, { label: "Best day", value: "Thu 6.8h" }, { label: "Total", value: "31.1h" }].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </>}
        </div>
      </main>

      <style>{`.scrollbar-none { scrollbar-width: none; } .scrollbar-none::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}

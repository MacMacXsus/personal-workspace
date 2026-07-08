import { useState, useRef, useEffect } from "react";
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  ShieldCheck,
  Key,
  FileText,
  Globe,
  Database,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";

type Category = "API Key" | "Token" | "Password" | "Secret" | "Note" | "Config";

interface VaultEntry {
  id: number;
  label: string;
  value: string;
  category: Category;
  hint?: string;
  createdAt: string;
}

const categoryMeta: Record<Category, { icon: typeof Key; color: string; bg: string }> = {
  "API Key": { icon: Key, color: "#8b7cf8", bg: "bg-[#8b7cf8]/10" },
  Token:     { icon: ShieldCheck, color: "#5ecfb0", bg: "bg-[#5ecfb0]/10" },
  Password:  { icon: Lock, color: "#e05252", bg: "bg-[#e05252]/10" },
  Secret:    { icon: AlertTriangle, color: "#f5a623", bg: "bg-[#f5a623]/10" },
  Note:      { icon: FileText, color: "#7ec8e3", bg: "bg-[#7ec8e3]/10" },
  Config:    { icon: Database, color: "#6b6b80", bg: "bg-[#a0a0b0]/10" },
};

const categories: Category[] = ["API Key", "Token", "Password", "Secret", "Note", "Config"];

const seedEntries: VaultEntry[] = [
  { id: 1, label: "OpenAI API Key", value: "example-key1", category: "API Key", hint: "Personal GPT-4o access", createdAt: "Jul 1, 2025" },
  { id: 2, label: "GitHub Personal Access Token", value: "example-token2", category: "Token", hint: "Expires Dec 2025", createdAt: "Jun 28, 2025" },
  { id: 3, label: "Supabase Service Role Key", value: "example-key3", category: "Secret", hint: "Production project", createdAt: "Jun 20, 2025" },
  { id: 4, label: "Vercel Deploy Token", value: "example-token4", category: "Token", hint: "CI/CD pipeline", createdAt: "Jun 15, 2025" },
  { id: 5, label: "Stripe Secret Key", value: "example-key5", category: "API Key", hint: "Live mode — handle with care", createdAt: "Jun 10, 2025" },
  { id: 6, label: "PostgreSQL Password", value: "example-password6", category: "Password", hint: "Prod DB on Supabase", createdAt: "Jun 5, 2025" },
  { id: 7, label: "SMTP Password", value: "example-password7", category: "Password", hint: "Postmark transactional", createdAt: "May 30, 2025" },
  { id: 8, label: "JWT Secret", value: "example-secret8", category: "Secret", hint: "Auth service signing key", createdAt: "May 22, 2025" },
  { id: 9, label: "Cloudflare API Token", value: "example-token9", category: "API Key", hint: "DNS + Pages deployment", createdAt: "May 10, 2025" },
  { id: 10, label: "Redis Connection URL", value: "example-url10", category: "Config", hint: "Upstash production", createdAt: "May 5, 2025" },
];

const MASTER_PASSWORD = "workspace";

function mask(value: string): string {
  if (value.length <= 8) return "•".repeat(value.length);
  return value.slice(0, 4) + "•".repeat(Math.min(value.length - 8, 24)) + value.slice(-4);
}

export default function Vault() {
  const [locked, setLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [entries, setEntries] = useState<VaultEntry[]>(seedEntries);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "All">("All");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({ label: "", value: "", category: "API Key" as Category, hint: "" });
  const pinRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (locked) pinRef.current?.focus();
  }, [locked]);

  const unlock = () => {
    if (pin === MASTER_PASSWORD) {
      setLocked(false);
      setPin("");
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => setPinError(false), 1500);
    }
  };

  const toggleReveal = (id: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyValue = (id: number, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteId(null);
  };

  const addEntry = () => {
    if (!newEntry.label || !newEntry.value) return;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    setEntries((prev) => [
      { id: Date.now(), ...newEntry, createdAt: today },
      ...prev,
    ]);
    setNewEntry({ label: "", value: "", category: "API Key", hint: "" });
    setAddOpen(false);
  };

  const filtered = entries.filter((e) => {
    const matchCat = filterCat === "All" || e.category === filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q || e.label.toLowerCase().includes(q) || (e.hint ?? "").toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // ── Lock screen ─────────────────────────────────────────────
  if (locked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] select-none">
        <div className="flex flex-col items-center gap-6 w-full max-w-xs">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${pinError ? "bg-[#e05252]/20 border border-[#e05252]/40" : "bg-primary/10 border border-primary/20"}`}>
            <Lock size={24} className={pinError ? "text-[#e05252]" : "text-primary"} />
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Vault is locked
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Enter your master password to continue</p>
          </div>

          {/* Input */}
          <div className="w-full space-y-3">
            <div className={`flex items-center gap-2 h-10 px-4 rounded-lg border transition-all duration-200 ${pinError ? "border-[#e05252]/60 bg-[#e05252]/5 animate-shake" : "border-border bg-secondary focus-within:border-primary/40"}`}>
              <Lock size={13} className={pinError ? "text-[#e05252]" : "text-muted-foreground"} />
              <input
                ref={pinRef}
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlock()}
                placeholder="Master password"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            {pinError && (
              <p className="text-xs text-[#e05252] text-center">Incorrect password. Try again.</p>
            )}

            <button
              onClick={unlock}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all duration-150 flex items-center justify-center gap-2"
            >
              <Unlock size={14} />
              Unlock vault
            </button>
          </div>

          <p className="text-[10px] font-mono text-muted-foreground/40">
            Hint: try <span className="text-muted-foreground/60">workspace</span>
          </p>
        </div>

        <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} } .animate-shake{animation:shake 0.4s ease}`}</style>
      </div>
    );
  }

  // ── Unlocked vault ───────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck size={15} className="text-primary" />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold text-foreground leading-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              Vault
            </h1>
            <p className="text-xs text-muted-foreground">{entries.length} secrets stored</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocked(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
          >
            <Lock size={12} />
            Lock vault
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-150"
          >
            <Plus size={13} />
            New secret
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted w-64">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full"
            placeholder="Search secrets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")}><X size={11} className="text-muted-foreground" /></button>}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {(["All", ...categories] as const).map((cat) => {
            const meta = cat !== "All" ? categoryMeta[cat] : null;
            const Icon = meta?.icon;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all duration-150 ${
                  filterCat === cat
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {Icon && <Icon size={11} style={{ color: filterCat === cat ? undefined : meta?.color }} />}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning banner */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/5 mb-5">
        <AlertTriangle size={13} className="text-[#f5a623] shrink-0" />
        <p className="text-xs text-[#f5a623]/80">
          Secrets are stored in memory only and will be cleared on page reload. This is a local-only vault.
        </p>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <Key size={28} className="text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No secrets found</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((entry) => {
            const { icon: CatIcon, color, bg } = categoryMeta[entry.category];
            const isRevealed = revealed.has(entry.id);
            const isCopied = copied === entry.id;

            return (
              <div
                key={entry.id}
                className="group bg-card border border-border rounded-lg p-4 hover:border-primary/20 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-md ${bg} flex items-center justify-center shrink-0`}>
                      <CatIcon size={14} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.label}</p>
                      {entry.hint && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{entry.hint}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: color + "18", color }}
                    >
                      {entry.category}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-center gap-2 bg-muted/60 rounded-md px-3 py-2 border border-border/50">
                  <code className={`flex-1 text-[11px] font-mono truncate transition-all duration-150 ${isRevealed ? "text-foreground" : "text-muted-foreground tracking-widest"}`}>
                    {isRevealed ? entry.value : mask(entry.value)}
                  </code>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleReveal(entry.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors duration-150"
                      title={isRevealed ? "Hide" : "Reveal"}
                    >
                      {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    <button
                      onClick={() => copyValue(entry.id, entry.value)}
                      className={`w-6 h-6 flex items-center justify-center rounded transition-colors duration-150 ${isCopied ? "text-[#5ecfb0]" : "text-muted-foreground hover:text-foreground"}`}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-[#e05252] transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <p className="text-[9px] font-mono text-muted-foreground/40 mt-2">Added {entry.createdAt}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Plus size={13} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  New secret
                </h2>
              </div>
              <button onClick={() => setAddOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Label</p>
                <input
                  className="w-full h-9 px-3 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors"
                  placeholder="e.g. OpenAI API Key"
                  value={newEntry.label}
                  onChange={(e) => setNewEntry((p) => ({ ...p, label: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Secret value</p>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-secondary border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors resize-none"
                  placeholder="Paste your secret here…"
                  value={newEntry.value}
                  onChange={(e) => setNewEntry((p) => ({ ...p, value: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Category</p>
                  <select
                    className="w-full h-9 px-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
                    value={newEntry.category}
                    onChange={(e) => setNewEntry((p) => ({ ...p, category: e.target.value as Category }))}
                  >
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Hint <span className="normal-case tracking-normal opacity-50">(optional)</span></p>
                  <input
                    className="w-full h-9 px-3 rounded-md bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors"
                    placeholder="e.g. Production only"
                    value={newEntry.hint}
                    onChange={(e) => setNewEntry((p) => ({ ...p, hint: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5 flex-1">
                <Globe size={11} className="text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/40 font-mono">Stored in memory only</span>
              </div>
              <button onClick={() => setAddOpen(false)} className="h-8 px-4 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button
                onClick={addEntry}
                disabled={!newEntry.label || !newEntry.value}
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-[#e05252]/30 rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#e05252]/10 flex items-center justify-center">
                <Trash2 size={14} className="text-[#e05252]" />
              </div>
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Delete secret?
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              <span className="text-foreground font-medium">"{entries.find(e => e.id === deleteId)?.label}"</span> will be permanently removed from the vault.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 h-9 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteEntry(deleteId)} className="flex-1 h-9 rounded-md bg-[#e05252] text-white text-xs font-medium hover:bg-[#e05252]/90 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
  Database,
} from "lucide-react";
import type { SessionUser } from "../lib/auth";
import {
  fetchVaultCurrentUser,
  loginWithVaultPassword,
  logoutVault,
  startVaultGoogleAuth,
} from "../lib/auth";

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
  Token: { icon: ShieldCheck, color: "#5ecfb0", bg: "bg-[#5ecfb0]/10" },
  Password: { icon: Lock, color: "#e05252", bg: "bg-[#e05252]/10" },
  Secret: { icon: AlertTriangle, color: "#f5a623", bg: "bg-[#f5a623]/10" },
  Note: { icon: FileText, color: "#7ec8e3", bg: "bg-[#7ec8e3]/10" },
  Config: { icon: Database, color: "#6b6b80", bg: "bg-[#a0a0b0]/10" },
};

const categories: Category[] = [
  "API Key",
  "Token",
  "Password",
  "Secret",
  "Note",
  "Config",
];

const seedEntries: VaultEntry[] = [
  {
    id: 1,
    label: "OpenAI API Key",
    value: "example-key1",
    category: "API Key",
    hint: "Personal GPT-4o access",
    createdAt: "Jul 1, 2025",
  },
  {
    id: 2,
    label: "GitHub Personal Access Token",
    value: "example-token2",
    category: "Token",
    hint: "Expires Dec 2025",
    createdAt: "Jun 28, 2025",
  },
  {
    id: 3,
    label: "Supabase Service Role Key",
    value: "example-key3",
    category: "Secret",
    hint: "Production project",
    createdAt: "Jun 20, 2025",
  },
  {
    id: 4,
    label: "Vercel Deploy Token",
    value: "example-token4",
    category: "Token",
    hint: "CI/CD pipeline",
    createdAt: "Jun 15, 2025",
  },
  {
    id: 5,
    label: "Stripe Secret Key",
    value: "example-key5",
    category: "API Key",
    hint: "Live mode - handle with care",
    createdAt: "Jun 10, 2025",
  },
  {
    id: 6,
    label: "PostgreSQL Password",
    value: "example-password6",
    category: "Password",
    hint: "Prod DB on Supabase",
    createdAt: "Jun 5, 2025",
  },
  {
    id: 7,
    label: "SMTP Password",
    value: "example-password7",
    category: "Password",
    hint: "Postmark transactional",
    createdAt: "May 30, 2025",
  },
  {
    id: 8,
    label: "JWT Secret",
    value: "example-secret8",
    category: "Secret",
    hint: "Auth service signing key",
    createdAt: "May 22, 2025",
  },
  {
    id: 9,
    label: "Cloudflare API Token",
    value: "example-token9",
    category: "API Key",
    hint: "DNS + Pages deployment",
    createdAt: "May 10, 2025",
  },
  {
    id: 10,
    label: "Redis Connection URL",
    value: "example-url10",
    category: "Config",
    hint: "Upstash production",
    createdAt: "May 5, 2025",
  },
];

type DashboardOutletContext = {
  firstName: string;
  currentUser: SessionUser | null;
};

function mask(value: string): string {
  if (value.length <= 8) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 4)}${"*".repeat(Math.min(value.length - 8, 24))}${value.slice(-4)}`;
}

function VaultLoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-card/80 px-6 py-5 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        <p className="text-sm font-medium text-foreground">Checking vault session</p>
        <p className="mt-1 text-xs text-muted-foreground">
          We are verifying whether this vault session is still active.
        </p>
      </div>
    </div>
  );
}

export default function Vault() {
  const { currentUser } = useOutletContext<DashboardOutletContext>();
  const [locked, setLocked] = useState(true);
  const [vaultEmail, setVaultEmail] = useState("");
  const [vaultPassword, setVaultPassword] = useState("");
  const [showVaultPassword, setShowVaultPassword] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isCheckingVaultSession, setIsCheckingVaultSession] = useState(true);
  const [entries, setEntries] = useState<VaultEntry[]>(seedEntries);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<Category | "All">("All");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newEntry, setNewEntry] = useState({
    label: "",
    value: "",
    category: "API Key" as Category,
    hint: "",
  });
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.email) {
      setVaultEmail(currentUser.email);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    let isActive = true;

    fetchVaultCurrentUser()
      .then((user) => {
        if (!isActive) {
          return;
        }

        setVaultEmail((current) => current || user.email);
        setLocked(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setLocked(true);
      })
      .finally(() => {
        if (isActive) {
          setIsCheckingVaultSession(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (locked && !isCheckingVaultSession) {
      passwordRef.current?.focus();
    }
  }, [locked, isCheckingVaultSession]);

  useEffect(() => {
    if (locked) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchVaultCurrentUser().catch(() => {
        setLocked(true);
        setVaultPassword("");
        setShowVaultPassword(false);
        setVaultError("Your vault session expired. Please reauthenticate.");
      });
    }, 60_000);

    return () => window.clearInterval(interval);
  }, [locked]);

  const filteredEntries = entries.filter((entry) => {
    const matchesCategory = filterCat === "All" || entry.category === filterCat;
    const query = search.trim().toLowerCase();
    const matchesQuery =
      !query ||
      entry.label.toLowerCase().includes(query) ||
      (entry.hint ?? "").toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  const toggleReveal = (id: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyValue = async (id: number, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 2000);
  };

  const addEntry = () => {
    if (!newEntry.label.trim() || !newEntry.value.trim()) {
      return;
    }

    const createdAt = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    setEntries((prev) => [
      {
        id: Date.now(),
        label: newEntry.label.trim(),
        value: newEntry.value.trim(),
        category: newEntry.category,
        hint: newEntry.hint.trim() || undefined,
        createdAt,
      },
      ...prev,
    ]);
    setNewEntry({ label: "", value: "", category: "API Key", hint: "" });
    setAddOpen(false);
  };

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    setDeleteId(null);
  };

  const unlockVault = async () => {
    const email = currentUser?.email?.trim() ?? vaultEmail.trim();

    if (!email || !vaultPassword) {
      setVaultError("Please enter your email and password.");
      return;
    }

    setIsUnlocking(true);
    setVaultError(null);

    try {
      await loginWithVaultPassword(email, vaultPassword);
      setLocked(false);
      setVaultPassword("");
      setShowVaultPassword(false);
    } catch (error) {
      setVaultError(
        error instanceof Error ? error.message : "Unable to unlock your vault.",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const lockVault = async () => {
    try {
      await logoutVault();
    } finally {
      setLocked(true);
      setVaultPassword("");
      setShowVaultPassword(false);
      setVaultError(null);
    }
  };

  const handleGoogleUnlock = () => {
    startVaultGoogleAuth();
  };

  if (isCheckingVaultSession) {
    return <VaultLoadingState />;
  }

  if (locked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.28em] text-primary">
                Vault session
              </p>
              <h2
                className="mt-1 text-2xl font-semibold text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Reauthenticate to open your vault.
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="vault-email">
                Email
              </label>
              <input
                id="vault-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Signed-in account"
                value={vaultEmail}
                readOnly
                className="h-11 w-full rounded-xl border border-border bg-background/80 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="vault-password"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="vault-password"
                  ref={passwordRef}
                  name="password"
                  type={showVaultPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={vaultPassword}
                  onChange={(event) => setVaultPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void unlockVault();
                    }
                  }}
                  className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  aria-label={showVaultPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setShowVaultPassword((value) => !value)}
                >
                  {showVaultPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {vaultError && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {vaultError}
              </p>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => void unlockVault()}
                disabled={isUnlocking}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUnlocking ? "Unlocking..." : "Unlock vault"}
                <Unlock className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleGoogleUnlock}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/60 px-4 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-secondary/50"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#4285F4_0deg,#4285F4_90deg,#34A853_90deg,#34A853_180deg,#FBBC05_180deg,#FBBC05_270deg,#EA4335_270deg,#EA4335_360deg)] p-[2px] text-[10px] font-semibold text-foreground">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-background">
                    G
                  </span>
                </span>
                Continue with Google
              </button>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <p className="text-sm font-medium text-foreground">
                Separate vault session
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                This panel uses the same credentials as your main login, but it
                keeps its own shorter-lived session.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1
              className="text-[22px] font-semibold leading-tight text-foreground"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Vault
            </h1>
            <p className="text-xs text-muted-foreground">
              {entries.length} secrets stored
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void lockVault()}
            className="flex items-center gap-2 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all duration-150"
          >
            <Lock className="h-3 w-3" />
            Lock vault
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-150"
          >
            <Plus className="h-3.5 w-3.5" />
            New secret
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-8 w-64 items-center gap-2 rounded-md border border-border bg-muted px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search secrets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} type="button">
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(["All", ...categories] as const).map((category) => {
            const meta = category !== "All" ? categoryMeta[category] : null;
            const Icon = meta?.icon;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setFilterCat(category)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all duration-150 ${
                  filterCat === category
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {Icon && (
                  <Icon
                    className="h-3 w-3"
                    style={{ color: filterCat === category ? undefined : meta.color }}
                  />
                )}
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#f5a623]/20 bg-[#f5a623]/5 px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#f5a623]" />
        <p className="text-xs text-[#f5a623]/80">
          Secrets are stored in memory only and will be cleared on page reload.
          Vault access uses a separate short-lived session.
        </p>
      </div>

      {vaultError && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {vaultError}
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <Key className="mb-3 h-7 w-7 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">No secrets found</p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            Try a different search or category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredEntries.map((entry) => {
            const meta = categoryMeta[entry.category];
            const isRevealed = revealed.has(entry.id);
            const isCopied = copied === entry.id;

            return (
              <div
                key={entry.id}
                className="group rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${meta.bg}`}>
                      <meta.icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.label}
                      </p>
                      {entry.hint && (
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                          {entry.hint}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-mono"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    {entry.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/60 px-3 py-2">
                  <code
                    className={`min-w-0 flex-1 truncate text-[11px] font-mono transition-all duration-150 ${
                      isRevealed
                        ? "text-foreground"
                        : "tracking-widest text-muted-foreground"
                    }`}
                  >
                    {isRevealed ? entry.value : mask(entry.value)}
                  </code>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleReveal(entry.id)}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      title={isRevealed ? "Hide" : "Reveal"}
                    >
                      {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => void copyValue(entry.id, entry.value)}
                      type="button"
                      className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 ${
                        isCopied
                          ? "text-[#5ecfb0]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title="Copy to clipboard"
                    >
                      {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => setDeleteId(entry.id)}
                      type="button"
                      className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-colors duration-150 hover:text-[#e05252] group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <p className="mt-2 text-[9px] font-mono text-muted-foreground/40">
                  Added {entry.createdAt}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  New secret
                </h2>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                type="button"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Label
                </p>
                <input
                  className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40"
                  placeholder="e.g. OpenAI API Key"
                  value={newEntry.label}
                  onChange={(event) =>
                    setNewEntry((current) => ({ ...current, label: event.target.value }))
                  }
                  autoFocus
                />
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Secret value
                </p>
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-md border border-border bg-secondary px-3 py-2 text-sm font-mono text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40"
                  placeholder="Paste your secret here..."
                  value={newEntry.value}
                  onChange={(event) =>
                    setNewEntry((current) => ({ ...current, value: event.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Category
                  </p>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40"
                    value={newEntry.category}
                    onChange={(event) =>
                      setNewEntry((current) => ({
                        ...current,
                        category: event.target.value as Category,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Hint <span className="normal-case tracking-normal opacity-50">(optional)</span>
                  </p>
                  <input
                    className="h-9 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40"
                    placeholder="e.g. Production only"
                    value={newEntry.hint}
                    onChange={(event) =>
                      setNewEntry((current) => ({ ...current, hint: event.target.value }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
              <div className="flex flex-1 items-center gap-1.5">
                <Globe className="h-3 w-3 text-muted-foreground/40" />
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  Stored in memory only
                </span>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                type="button"
                className="h-8 rounded-md border border-border px-4 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                type="button"
                disabled={!newEntry.label || !newEntry.value}
                className="h-8 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save secret
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-[#e05252]/30 bg-card p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e05252]/10">
                <Trash2 className="h-3.5 w-3.5 text-[#e05252]" />
              </div>
              <h2
                className="text-sm font-semibold text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Delete secret?
              </h2>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                "{entries.find((entry) => entry.id === deleteId)?.label}"
              </span>{" "}
              will be permanently removed from the vault.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                type="button"
                className="h-9 flex-1 rounded-md border border-border text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEntry(deleteId)}
                type="button"
                className="h-9 flex-1 rounded-md bg-[#e05252] text-xs font-medium text-white transition-colors hover:bg-[#e05252]/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  Folder,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  createBookmark,
  deleteBookmark as deleteBookmarkRequest,
  fetchBookmarks,
  updateBookmark as updateBookmarkRequest,
  type BookmarkRecord,
} from "../../lib/bookmarks";

type BookmarkCardProps = {
  bm: BookmarkRecord;
  onEdit: (bookmark: BookmarkRecord) => void;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
};

function formatBookmarkUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "");

    return `${parsed.hostname}${path}`;
  } catch {
    return url;
  }
}

function BookmarkCard({ bm, onEdit, onDelete, onTogglePin }: BookmarkCardProps) {
  const displayUrl = formatBookmarkUrl(bm.url);

  return (
    <div className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20">
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          onClick={() => onEdit(bm)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:text-foreground"
          title="Edit"
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={() => onTogglePin(bm.id)}
          className={`flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 ${bm.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          title={bm.pinned ? "Unpin" : "Pin"}
        >
          <BookmarkIcon fill={bm.pinned ? "currentColor" : "none"} size={11} />
        </button>
        <button
          onClick={() => onDelete(bm.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 hover:text-[#e05252]"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex items-start gap-3 pr-12">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
          style={{ background: `${bm.accentColor}30`, color: bm.accentColor }}
        >
          {bm.faviconLabel}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {bm.title}
          </p>
        </div>
      </div>

      <a
        href={bm.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 truncate text-[10px] font-mono text-muted-foreground transition-colors duration-150 hover:text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={9} className="shrink-0" />
        {displayUrl}
      </a>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
          <Folder size={8} />
          {bm.folderName}
        </span>
        {bm.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground"
          >
            <Tag size={8} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

type BookmarkFormState = {
  title: string;
  url: string;
  folderName: string;
  tags: string;
  notes: string;
  pinned: boolean;
};

type BookmarkFormMode = "create" | "edit";

type EditingBookmarkState = {
  id: number;
};

const emptyFormState: BookmarkFormState = {
  title: "",
  url: "",
  folderName: "General",
  tags: "",
  notes: "",
  pinned: false,
};

const bookmarkTextFields = [
  { label: "Title", key: "title", placeholder: "e.g. Tailwind CSS docs" },
  { label: "URL", key: "url", placeholder: "e.g. tailwindcss.com/docs" },
  { label: "Tags", key: "tags", placeholder: "css, frontend, reference" },
] as const;

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [bmSearch, setBmSearch] = useState("");
  const [bmFolder, setBmFolder] = useState("All");
  const [bmAddOpen, setBmAddOpen] = useState(false);
  const [formMode, setFormMode] = useState<BookmarkFormMode>("create");
  const [editingBookmark, setEditingBookmark] = useState<EditingBookmarkState | null>(null);
  const [bmNew, setBmNew] = useState<BookmarkFormState>(emptyFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchBookmarks();

      setBookmarks(data.bookmarks);
      setFolders(data.folders);
      setTagSuggestions(data.tags);
      setBmFolder((currentFolder) =>
        currentFolder !== "All" && !data.folders.includes(currentFolder)
          ? "All"
          : currentFolder,
      );
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unable to load bookmarks.";

      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadInitialBookmarks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchBookmarks();

        if (!isActive) {
          return;
        }

        setBookmarks(data.bookmarks);
        setFolders(data.folders);
        setTagSuggestions(data.tags);
        setBmFolder((currentFolder) =>
          currentFolder !== "All" && !data.folders.includes(currentFolder)
            ? "All"
            : currentFolder,
        );
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        const message =
          fetchError instanceof Error ? fetchError.message : "Unable to load bookmarks.";

        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialBookmarks();

    return () => {
      isActive = false;
    };
  }, []);

  const filteredBookmarks = useMemo(() => {
    const query = bmSearch.trim().toLowerCase();

    return bookmarks.filter((bookmark) => {
      const matchFolder = bmFolder === "All" || bookmark.folderName === bmFolder;
      const matchSearch =
        !query ||
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query) ||
        bookmark.folderName.toLowerCase().includes(query) ||
        bookmark.tags.some((tag) => tag.toLowerCase().includes(query));

      return matchFolder && matchSearch;
    });
  }, [bookmarks, bmFolder, bmSearch]);

  const pinnedBookmarks = filteredBookmarks.filter((bookmark) => bookmark.pinned);
  const unpinnedBookmarks = filteredBookmarks.filter((bookmark) => !bookmark.pinned);
  const folderOptions = useMemo(
    () => ["All", ...Array.from(new Set(folders)).sort((a, b) => a.localeCompare(b))],
    [folders],
  );

  const refreshAfterMutation = async (
    mutate: () => Promise<unknown>,
  ) => {
    setIsSaving(true);
    setError(null);

    try {
      await mutate();
      await loadBookmarks();
      return true;
    } catch (mutationError) {
      const message =
        mutationError instanceof Error ? mutationError.message : "Unable to save bookmark.";

      setError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await refreshAfterMutation(async () => {
      await deleteBookmarkRequest(id);
    });
  };

  const openCreateBookmarkModal = () => {
    setFormMode("create");
    setEditingBookmark(null);
    setBmNew(emptyFormState);
    setError(null);
    setBmAddOpen(true);
  };

  const openEditBookmarkModal = (bookmark: BookmarkRecord) => {
    setFormMode("edit");
    setEditingBookmark({
      id: bookmark.id,
    });
    setBmNew({
      title: bookmark.title,
      url: bookmark.url,
      folderName: bookmark.folderName,
      tags: bookmark.tags.join(", "),
      notes: bookmark.notes ?? "",
      pinned: bookmark.pinned,
    });
    setError(null);
    setBmAddOpen(true);
  };

  const handleTogglePin = async (id: number) => {
    const bookmark = bookmarks.find((item) => item.id === id);

    if (!bookmark) {
      return;
    }

    await refreshAfterMutation(async () => {
      await updateBookmarkRequest(id, {
        pinned: !bookmark.pinned,
      });
    });
  };

  const handleAddBookmark = async () => {
    const title = bmNew.title.trim();
    const url = bmNew.url.trim();
    const folderName = bmNew.folderName.trim() || "General";
    const tags = bmNew.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const notes = bmNew.notes.trim();

    if (!title || !url) {
      setError("Please enter both a title and a URL.");
      return;
    }

    const success = await refreshAfterMutation(async () => {
      if (formMode === "edit" && editingBookmark) {
        await updateBookmarkRequest(editingBookmark.id, {
          title,
          url,
          folderName,
          tags,
          notes: notes || null,
          pinned: bmNew.pinned,
        });
        return;
      }

      await createBookmark({
        title,
        url,
        folderName,
        tags,
        notes: notes || null,
        pinned: bmNew.pinned,
      });
    });

    if (success) {
      setBmNew(emptyFormState);
      setEditingBookmark(null);
      setFormMode("create");
      setBmAddOpen(false);
    }
  };

  const handleAddBookmarkSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleAddBookmark();
  };

  const savedCount = bookmarks.length;
  const pinnedCount = bookmarks.filter((bookmark) => bookmark.pinned).length;
  const visiblePinnedCount = pinnedBookmarks.length;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1
            className="text-[26px] font-semibold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Bookmarks
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {savedCount} saved - {bmFolder === "All" ? pinnedCount : visiblePinnedCount} pinned
          </p>
        </div>
        <button
          onClick={openCreateBookmarkModal}
          className="flex h-8 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90"
        >
          <Plus size={13} />
          Add bookmark
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 flex-1 max-w-xs items-center gap-2 rounded-md border border-border bg-muted px-3">
          <Search size={13} className="shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search bookmarks..."
            value={bmSearch}
            onChange={(e) => setBmSearch(e.target.value)}
          />
          {bmSearch && (
            <button onClick={() => setBmSearch("")}>
              <X size={11} className="text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {folderOptions.map((folder) => (
            <button
              key={folder}
              onClick={() => setBmFolder(folder)}
              className={`flex h-7 items-center gap-1.5 rounded-md px-3 text-xs transition-all duration-150 ${
                bmFolder === folder
                  ? "border border-primary/25 bg-primary/15 text-primary"
                  : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {folder === "All" ? <Globe size={11} /> : <Folder size={11} />}
              {folder}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[#e05252]/20 bg-[#e05252]/10 px-4 py-3 text-sm text-[#e05252]">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-center">
          <div>
            <Loader2 className="mx-auto mb-3 animate-spin text-muted-foreground" size={24} />
            <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
          </div>
        </div>
      ) : (
        <>
          {pinnedBookmarks.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <BookmarkIcon size={10} className="text-primary" /> Pinned
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {pinnedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bm={bookmark}
                    onEdit={openEditBookmarkModal}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinnedBookmarks.length > 0 && (
            <div>
              {pinnedBookmarks.length > 0 && (
                <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <Globe size={10} /> All
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                {unpinnedBookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bm={bookmark}
                    onEdit={openEditBookmarkModal}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredBookmarks.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
              <BookmarkIcon size={28} className="mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No bookmarks found</p>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Try a different folder or search term
              </p>
            </div>
          )}
        </>
      )}

      {bmAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <form
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
            autoComplete="off"
            onSubmit={handleAddBookmarkSubmit}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className="text-sm font-semibold text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                {formMode === "edit" ? "Edit bookmark" : "New bookmark"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setBmAddOpen(false);
                  setEditingBookmark(null);
                  setFormMode("create");
                }}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-3">
              {bookmarkTextFields.map(({ label, key, placeholder }) => (
                <div key={key}>
                  <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                    {label}
                  </p>
                  <input
                    name={`bookmark-${key}`}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    inputMode="text"
                    className="w-full rounded-md border border-border bg-secondary px-3 h-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                    placeholder={placeholder}
                    value={bmNew[key]}
                    onChange={(e) =>
                      setBmNew((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    list={key === "tags" ? "bookmark-tags" : undefined}
                  />
                </div>
              ))}
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                  Notes
                </p>
                <textarea
                  name="bookmark-notes"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="min-h-20 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                  placeholder="Optional notes about this bookmark"
                  value={bmNew.notes}
                  onChange={(e) =>
                    setBmNew((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                  Folder
                </p>
                <input
                  name="bookmark-folder"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-md border border-border bg-secondary px-3 h-8 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40"
                  placeholder="General"
                  value={bmNew.folderName}
                  onChange={(e) =>
                    setBmNew((prev) => ({ ...prev, folderName: e.target.value }))
                  }
                  list="bookmark-folders"
                />
                <datalist id="bookmark-folders">
                  {folders.map((folder) => (
                    <option key={folder} value={folder} />
                  ))}
                </datalist>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Pin bookmark</p>
                  <p className="text-[10px] text-muted-foreground">
                    Keep important links at the top.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setBmNew((prev) => ({ ...prev, pinned: !prev.pinned }))
                  }
                  className={`relative h-6 w-11 rounded-full border transition-colors ${bmNew.pinned ? "border-primary/40 bg-primary" : "border-border bg-muted"}`}
                  aria-pressed={bmNew.pinned}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${bmNew.pinned ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
              <datalist id="bookmark-tags">
                {tagSuggestions.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setBmAddOpen(false);
                  setEditingBookmark(null);
                  setFormMode("create");
                }}
                className="flex-1 rounded-md border border-border h-8 text-xs text-muted-foreground transition-colors hover:text-foreground"
                disabled={isSaving}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-md bg-primary h-8 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving
                  ? "Saving..."
                  : formMode === "edit"
                    ? "Update bookmark"
                    : "Save bookmark"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

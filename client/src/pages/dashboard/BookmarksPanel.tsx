import { useState } from "react";
import {
  Bookmark as BookmarkIcon,
  ExternalLink,
  Folder,
  Globe,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  bookmarkFolders,
  initialBookmarks,
} from "./dashboardData";
import type { BookmarkItem } from "./dashboardData";

type BookmarkCardProps = {
  bm: BookmarkItem;
  onDelete: (id: number) => void;
  onTogglePin: (id: number) => void;
};

function BookmarkCard({ bm, onDelete, onTogglePin }: BookmarkCardProps) {
  return (
    <div className="group bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary/20 transition-all duration-200 relative">
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onTogglePin(bm.id)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors duration-150 ${bm.pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          title={bm.pinned ? "Unpin" : "Pin"}
        >
          <BookmarkIcon fill={bm.pinned ? "currentColor" : "none"} size={11} />
        </button>
        <button
          onClick={() => onDelete(bm.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-[#e05252] transition-colors duration-150"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex items-start gap-3 pr-12">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: `${bm.color}30`, color: bm.color }}
        >
          {bm.favicon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{bm.title}</p>
        </div>
      </div>

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

      <div className="flex items-center gap-1.5 flex-wrap mt-auto">
        <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          <Folder size={8} />
          {bm.folder}
        </span>
        {bm.tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            <Tag size={8} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function BookmarksPanel() {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [bmFolder, setBmFolder] = useState("All");
  const [bmSearch, setBmSearch] = useState("");
  const [bmAddOpen, setBmAddOpen] = useState(false);
  const [bmNew, setBmNew] = useState({ title: "", url: "", folder: "Design", tags: "" });

  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchFolder = bmFolder === "All" || bookmark.folder === bmFolder;
    const q = bmSearch.toLowerCase();
    const matchSearch =
      !q ||
      bookmark.title.toLowerCase().includes(q) ||
      bookmark.url.toLowerCase().includes(q) ||
      bookmark.tags.some((tag) => tag.toLowerCase().includes(q));
    return matchFolder && matchSearch;
  });

  const pinnedBookmarks = filteredBookmarks.filter((bookmark) => bookmark.pinned);
  const unpinnedBookmarks = filteredBookmarks.filter((bookmark) => !bookmark.pinned);

  const deleteBookmark = (id: number) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
  };

  const togglePin = (id: number) => {
    setBookmarks((prev) => prev.map((bookmark) => (bookmark.id === id ? { ...bookmark, pinned: !bookmark.pinned } : bookmark)));
  };

  const addBookmark = () => {
    if (!bmNew.title || !bmNew.url) {
      return;
    }

    const colors = ["#8b7cf8", "#5ecfb0", "#f5a623", "#7ec8e3", "#e05252"];
    setBookmarks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: bmNew.title,
        url: bmNew.url,
        folder: bmNew.folder,
        tags: bmNew.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        favicon: bmNew.title[0].toUpperCase(),
        color: colors[Math.floor(Math.random() * colors.length)],
        pinned: false,
      },
    ]);
    setBmNew({ title: "", url: "", folder: "Design", tags: "" });
    setBmAddOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[26px] font-semibold text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Bookmarks
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bookmarks.length} saved - {pinnedBookmarks.length + (bmFolder === "All" ? bookmarks.filter((bookmark) => bookmark.pinned).length : 0)} pinned
          </p>
        </div>
        <button
          onClick={() => setBmAddOpen(true)}
          className="flex items-center gap-2 h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all duration-150"
        >
          <Plus size={13} />
          Add bookmark
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center gap-2 h-8 px-3 rounded-md border border-border bg-muted flex-1 max-w-xs">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            className="bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-xs w-full"
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
        <div className="flex items-center gap-1.5 flex-wrap">
          {bookmarkFolders.map((folder) => (
            <button
              key={folder}
              onClick={() => setBmFolder(folder)}
              className={`flex items-center gap-1.5 h-7 px-3 rounded-md text-xs transition-all duration-150 ${
                bmFolder === folder
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {folder === "All" ? <Globe size={11} /> : <Folder size={11} />}
              {folder}
            </button>
          ))}
        </div>
      </div>

      {pinnedBookmarks.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookmarkIcon size={10} className="text-primary" /> Pinned
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {pinnedBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bm={bookmark}
                onDelete={deleteBookmark}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </div>
      )}

      {unpinnedBookmarks.length > 0 && (
        <div>
          {pinnedBookmarks.length > 0 && (
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <Globe size={10} /> All
            </p>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unpinnedBookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bm={bookmark}
                onDelete={deleteBookmark}
                onTogglePin={togglePin}
              />
            ))}
          </div>
        </div>
      )}

      {filteredBookmarks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
          <BookmarkIcon size={28} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No bookmarks found</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Try a different folder or search term</p>
        </div>
      )}

      {bmAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                New bookmark
              </h2>
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
                    onChange={(e) => setBmNew((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Folder</p>
                <select
                  className="w-full h-8 px-3 rounded-md bg-secondary border border-border text-sm text-foreground outline-none focus:border-primary/40 transition-colors"
                  value={bmNew.folder}
                  onChange={(e) => setBmNew((prev) => ({ ...prev, folder: e.target.value }))}
                >
                  {bookmarkFolders
                    .filter((folder) => folder !== "All")
                    .map((folder) => (
                      <option key={folder} value={folder}>
                        {folder}
                      </option>
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
    </div>
  );
}

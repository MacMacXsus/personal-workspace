import { buildApiUrl } from "./auth";

export type BookmarkRecord = {
  id: number;
  title: string;
  url: string;
  folderName: string;
  tags: string[];
  pinned: boolean;
  notes: string | null;
  hostname: string;
  accentColor: string;
  faviconLabel: string;
  createdAt: string;
  updatedAt: string;
};

export type BookmarkListResponse = {
  bookmarks: BookmarkRecord[];
  folders: string[];
  tags: string[];
};

type BookmarkErrorResponse = {
  error?: string;
};

type BookmarkMutationResponse = {
  bookmark: BookmarkRecord;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const text = await response.text();
  let data: T | BookmarkErrorResponse | null = null;

  if (text) {
    try {
      data = JSON.parse(text) as T | BookmarkErrorResponse;
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.error === "string" && data.error
        ? data.error
        : "Bookmark request failed";

    throw new Error(message);
  }

  if (data === null) {
    throw new Error("Bookmark API returned an empty or invalid response.");
  }

  return data as T;
}

export async function fetchBookmarks(query?: {
  q?: string;
  folderName?: string;
  pinned?: boolean;
}) {
  const searchParams = new URLSearchParams();

  if (query?.q) {
    searchParams.set("q", query.q);
  }

  if (query?.folderName) {
    searchParams.set("folderName", query.folderName);
  }

  if (typeof query?.pinned === "boolean") {
    searchParams.set("pinned", query.pinned ? "true" : "false");
  }

  const path = searchParams.toString()
    ? `/bookmarks?${searchParams.toString()}`
    : "/bookmarks";

  return requestJson<BookmarkListResponse>(path, {
    method: "GET",
  });
}

export async function createBookmark(input: {
  title: string;
  url: string;
  folderName: string;
  tags: string[];
  pinned: boolean;
  notes?: string | null;
}) {
  return requestJson<BookmarkMutationResponse>("/bookmarks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBookmark(
  bookmarkId: number,
  input: Partial<{
    title: string;
    url: string;
    folderName: string;
    tags: string[];
    pinned: boolean;
    notes: string | null;
  }>,
) {
  return requestJson<BookmarkMutationResponse>(`/bookmarks/${bookmarkId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteBookmark(bookmarkId: number) {
  return requestJson<{ ok: true }>(`/bookmarks/${bookmarkId}`, {
    method: "DELETE",
  });
}

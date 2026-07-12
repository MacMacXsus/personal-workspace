import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { pool } from "../db/mysql";
import {
  deriveBookmarkAccentColor,
  deriveBookmarkFaviconLabel,
  normalizeBookmarkFolderName,
  normalizeBookmarkTitle,
  normalizeBookmarkUrl,
} from "../utils/bookmark";
import { listBookmarkTagNames, listBookmarkTagsForBookmarks, replaceBookmarkTags } from "./bookmarkTagModel";

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

export type BookmarkListFilters = {
  folderName?: string;
  pinned?: boolean;
  query?: string;
};

export type CreateBookmarkInput = {
  title: string;
  url: string;
  folderName?: string;
  tags?: string[];
  pinned?: boolean;
  notes?: string | null;
};

export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

type BookmarkRow = {
  id: number;
  user_id: number;
  title: string;
  url: string;
  folder_name: string;
  is_pinned: number | boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function toBoolean(value: number | boolean): boolean {
  return Boolean(value);
}

function withBookmarkPresentation(
  row: BookmarkRow,
  tags: string[],
): BookmarkRecord {
  const hostname = new URL(row.url).hostname.toLowerCase();

  return {
    id: row.id,
    title: row.title,
    url: row.url,
    folderName: row.folder_name,
    tags,
    pinned: toBoolean(row.is_pinned),
    notes: row.notes,
    hostname,
    accentColor: deriveBookmarkAccentColor(row.title || hostname),
    faviconLabel: deriveBookmarkFaviconLabel(row.title, hostname),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function runInBookmarkTransaction<T>(
  task: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const result = await task(connection);

    await connection.commit();

    return result;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

async function hydrateBookmarkRecord(
  bookmarkId: number,
): Promise<BookmarkRecord | null> {
  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, title, url, folder_name, is_pinned, notes,
             created_at, updated_at
      FROM bookmarks
      WHERE id = ?
      LIMIT 1
    `,
    [bookmarkId],
  )) as [BookmarkRow[], unknown];

  const row = rows[0];

  if (!row) {
    return null;
  }

  const tagMap = await listBookmarkTagsForBookmarks([row.id]);
  const tags = tagMap.get(row.id) ?? [];

  return withBookmarkPresentation(row, tags);
}

async function hydrateBookmarkRecordInConnection(
  connection: PoolConnection,
  bookmarkId: number,
): Promise<BookmarkRecord | null> {
  const [rows] = (await connection.execute(
    `
      SELECT id, user_id, title, url, folder_name, is_pinned, notes,
             created_at, updated_at
      FROM bookmarks
      WHERE id = ?
      LIMIT 1
    `,
    [bookmarkId],
  )) as [BookmarkRow[], unknown];

  const row = rows[0];

  if (!row) {
    return null;
  }

  const [tagRows] = (await connection.execute(
    `
      SELECT t.name
      FROM bookmark_tag_links bt
      INNER JOIN bookmark_tags t ON t.id = bt.tag_id
      WHERE bt.bookmark_id = ?
      ORDER BY t.name ASC
    `,
    [bookmarkId],
  )) as [Array<{ name: string }>, unknown];

  return withBookmarkPresentation(
    row,
    tagRows.map((tagRow) => tagRow.name),
  );
}

export async function listBookmarks(
  userId: number,
  filters: BookmarkListFilters = {},
): Promise<{
  bookmarks: BookmarkRecord[];
  folders: string[];
  tags: string[];
}> {
  const whereClauses = ["user_id = ?"];
  const params: Array<string | number | boolean> = [userId];

  if (filters.folderName) {
    whereClauses.push("folder_name = ?");
    params.push(filters.folderName);
  }

  if (typeof filters.pinned === "boolean") {
    whereClauses.push("is_pinned = ?");
    params.push(filters.pinned ? 1 : 0);
  }

  if (filters.query) {
    const searchTerm = `%${filters.query}%`;

    whereClauses.push(
      `(
        title LIKE ? OR
        url LIKE ? OR
        folder_name LIKE ? OR
        EXISTS (
          SELECT 1
          FROM bookmark_tag_links bt
          INNER JOIN bookmark_tags t ON t.id = bt.tag_id
          WHERE bt.bookmark_id = bookmarks.id
            AND t.user_id = bookmarks.user_id
            AND t.name LIKE ?
        )
      )`,
    );
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, title, url, folder_name, is_pinned, notes,
             created_at, updated_at
      FROM bookmarks
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY is_pinned DESC, updated_at DESC, id DESC
    `,
    params,
  )) as [BookmarkRow[], unknown];

  const bookmarkIds = rows.map((row) => row.id);
  const tagMap = await listBookmarkTagsForBookmarks(bookmarkIds);

  const bookmarks = rows.map((row) =>
    withBookmarkPresentation(row, tagMap.get(row.id) ?? []),
  );

  const [folderRows] = (await pool.execute(
    `
      SELECT DISTINCT folder_name
      FROM bookmarks
      WHERE user_id = ?
      ORDER BY folder_name ASC
    `,
    [userId],
  )) as [Array<{ folder_name: string }>, unknown];

  const folders = folderRows.map((row) => row.folder_name);
  const tags = await listBookmarkTagNames(userId);

  return {
    bookmarks,
    folders,
    tags,
  };
}

async function createBookmarkInConnection(
  connection: PoolConnection,
  userId: number,
  input: CreateBookmarkInput,
): Promise<BookmarkRecord> {
  const title = normalizeBookmarkTitle(input.title);
  const normalizedUrl = normalizeBookmarkUrl(input.url);
  const folderName = normalizeBookmarkFolderName(input.folderName);
  const notes = input.notes?.trim() || null;
  const isPinned = input.pinned ? 1 : 0;

  const [result] = (await connection.execute(
    `
      INSERT INTO bookmarks (
        user_id,
        title,
        url,
        folder_name,
        is_pinned,
        notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [userId, title, normalizedUrl.url, folderName, isPinned, notes],
  )) as [ResultSetHeader, unknown];

  const bookmarkId = Number(result.insertId);

  if (input.tags && input.tags.length > 0) {
    await replaceBookmarkTags(connection, userId, bookmarkId, input.tags);
  }

  const bookmark = await hydrateBookmarkRecordInConnection(connection, bookmarkId);

  if (!bookmark) {
    throw new Error("Unable to create bookmark.");
  }

  return bookmark;
}

export async function createBookmark(
  userId: number,
  input: CreateBookmarkInput,
): Promise<BookmarkRecord> {
  return runInBookmarkTransaction((connection) =>
    createBookmarkInConnection(connection, userId, input),
  );
}

async function updateBookmarkInConnection(
  connection: PoolConnection,
  userId: number,
  bookmarkId: number,
  input: UpdateBookmarkInput,
): Promise<BookmarkRecord> {
  const [rows] = (await connection.execute(
    `
      SELECT id, user_id, title, url, folder_name, is_pinned, notes,
             created_at, updated_at
      FROM bookmarks
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [bookmarkId, userId],
  )) as [BookmarkRow[], unknown];

  const existingBookmark = rows[0];

  if (!existingBookmark) {
    throw new Error("Bookmark not found.");
  }

  const title =
    input.title !== undefined
      ? normalizeBookmarkTitle(input.title)
      : existingBookmark.title;
  const normalizedUrl =
    input.url !== undefined
      ? normalizeBookmarkUrl(input.url).url
      : existingBookmark.url;
  const folderName =
    input.folderName !== undefined
      ? normalizeBookmarkFolderName(input.folderName)
      : existingBookmark.folder_name;
  const notes =
    input.notes !== undefined ? input.notes?.trim() || null : existingBookmark.notes;
  const isPinned =
    input.pinned !== undefined ? (input.pinned ? 1 : 0) : Number(existingBookmark.is_pinned);

  await connection.execute(
    `
      UPDATE bookmarks
      SET title = ?,
          url = ?,
          folder_name = ?,
          is_pinned = ?,
          notes = ?
      WHERE id = ? AND user_id = ?
    `,
    [title, normalizedUrl, folderName, isPinned, notes, bookmarkId, userId],
  );

  if (input.tags) {
    await replaceBookmarkTags(connection, userId, bookmarkId, input.tags);
  }

  const bookmark = await hydrateBookmarkRecordInConnection(connection, bookmarkId);

  if (!bookmark) {
    throw new Error("Unable to update bookmark.");
  }

  return bookmark;
}

export async function updateBookmark(
  userId: number,
  bookmarkId: number,
  input: UpdateBookmarkInput,
): Promise<BookmarkRecord> {
  return runInBookmarkTransaction((connection) =>
    updateBookmarkInConnection(connection, userId, bookmarkId, input),
  );
}

export async function deleteBookmark(
  userId: number,
  bookmarkId: number,
): Promise<boolean> {
  const [result] = (await pool.execute(
    `
      DELETE FROM bookmarks
      WHERE id = ? AND user_id = ?
    `,
    [bookmarkId, userId],
  )) as [ResultSetHeader, unknown];

  return result.affectedRows > 0;
}

export async function getBookmarkForUser(
  userId: number,
  bookmarkId: number,
): Promise<BookmarkRecord | null> {
  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, title, url, folder_name, is_pinned, notes,
             created_at, updated_at
      FROM bookmarks
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [bookmarkId, userId],
  )) as [BookmarkRow[], unknown];

  const row = rows[0];

  if (!row) {
    return null;
  }

  const tags = (await listBookmarkTagsForBookmarks([bookmarkId])).get(bookmarkId) ?? [];

  return withBookmarkPresentation(row, tags);
}

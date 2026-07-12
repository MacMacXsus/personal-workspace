import type { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { pool } from "../db/mysql";
import { slugifyBookmarkValue } from "../utils/bookmark";

export type BookmarkTagRecord = {
  id: number;
  name: string;
  slug: string;
};

export async function listBookmarkTagNames(
  userId: number,
): Promise<string[]> {
  const [rows] = (await pool.execute(
    `
      SELECT name
      FROM bookmark_tags
      WHERE user_id = ?
      ORDER BY name ASC
    `,
    [userId],
  )) as [Array<{ name: string }>, unknown];

  return rows.map((row) => row.name);
}

async function upsertBookmarkTag(
  connection: PoolConnection,
  userId: number,
  tagName: string,
): Promise<BookmarkTagRecord> {
  const normalizedName = tagName.trim().replace(/\s+/g, " ");
  const slug = slugifyBookmarkValue(normalizedName);

  if (!normalizedName || !slug) {
    throw new Error("Bookmark tags must contain letters or numbers.");
  }

  const [result] = (await connection.execute(
    `
      INSERT INTO bookmark_tags (user_id, name, slug)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id),
        name = VALUES(name)
    `,
    [userId, normalizedName, slug],
  )) as [ResultSetHeader, unknown];

  const tagId = Number(result.insertId);

  const [rows] = (await connection.execute(
    `
      SELECT id, name, slug
      FROM bookmark_tags
      WHERE id = ?
      LIMIT 1
    `,
    [tagId],
  )) as [BookmarkTagRecord[], unknown];

  const row = rows[0];

  if (!row) {
    throw new Error("Unable to save bookmark tag.");
  }

  return row;
}

export async function replaceBookmarkTags(
  connection: PoolConnection,
  userId: number,
  bookmarkId: number,
  tagNames: string[],
): Promise<string[]> {
  const normalizedTagNames = Array.from(
    new Set(
      tagNames
        .map((tag) => tag.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  );

  await connection.execute(
    "DELETE FROM bookmark_tag_links WHERE bookmark_id = ?",
    [bookmarkId],
  );

  const savedTags: string[] = [];

  for (const tagName of normalizedTagNames) {
    const tag = await upsertBookmarkTag(connection, userId, tagName);

    await connection.execute(
      `
        INSERT IGNORE INTO bookmark_tag_links (bookmark_id, tag_id)
        VALUES (?, ?)
      `,
      [bookmarkId, tag.id],
    );

    savedTags.push(tag.name);
  }

  return savedTags;
}

export async function listBookmarkTagsForBookmarks(
  bookmarkIds: number[],
): Promise<Map<number, string[]>> {
  if (bookmarkIds.length === 0) {
    return new Map();
  }

  const placeholders = bookmarkIds.map(() => "?").join(", ");

  const [rows] = (await pool.execute(
    `
      SELECT bt.bookmark_id, t.name
      FROM bookmark_tag_links bt
      INNER JOIN bookmark_tags t ON t.id = bt.tag_id
      WHERE bt.bookmark_id IN (${placeholders})
      ORDER BY t.name ASC
    `,
    bookmarkIds,
  )) as [Array<{ bookmark_id: number; name: string }>, unknown];

  const tagsByBookmarkId = new Map<number, string[]>();

  for (const row of rows) {
    const existing = tagsByBookmarkId.get(row.bookmark_id) ?? [];
    existing.push(row.name);
    tagsByBookmarkId.set(row.bookmark_id, existing);
  }

  return tagsByBookmarkId;
}

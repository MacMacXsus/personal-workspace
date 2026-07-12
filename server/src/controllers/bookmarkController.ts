import type { Request, Response } from "express";
import type { AppEnv } from "../config/env";
import { findUserFromSession } from "../models/sessionModel";
import {
  createBookmark,
  deleteBookmark,
  getBookmarkForUser,
  listBookmarks,
  updateBookmark,
} from "../models/bookmarkModel";
import { normalizeBookmarkTagNames } from "../utils/bookmark";

type BookmarkPayload = {
  title?: unknown;
  url?: unknown;
  folderName?: unknown;
  tags?: unknown;
  pinned?: unknown;
  notes?: unknown;
};

function sendBookmarkError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function parseTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return normalizeBookmarkTagNames(
      value.map((tag) => String(tag)),
    );
  }

  if (typeof value === "string") {
    return normalizeBookmarkTagNames(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
  }

  return undefined;
}

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    if (["true", "1", "yes", "on"].includes(value.toLowerCase())) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(value.toLowerCase())) {
      return false;
    }
  }

  return undefined;
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function parseOptionalNullableString(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

async function requireBookmarkUser(appEnv: AppEnv, req: Request, res: Response) {
  const user = await findUserFromSession(appEnv, req);

  if (!user) {
    sendBookmarkError(res, 401, "Please sign in to manage bookmarks.");
    return null;
  }

  return user;
}

function parseBookmarkId(value: string | string[] | undefined): number | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseBookmarkPayload(body: BookmarkPayload) {
  const title = parseOptionalString(body.title);
  const url = parseOptionalString(body.url);
  const folderName = parseOptionalString(body.folderName);
  const tags = parseTags(body.tags);
  const pinned = parseOptionalBoolean(body.pinned);
  const notes = parseOptionalNullableString(body.notes);

  return {
    title,
    url,
    folderName,
    tags,
    pinned,
    notes,
  };
}

export function createBookmarkController(appEnv: AppEnv) {
  return {
    async listBookmarks(req: Request, res: Response) {
      const user = await requireBookmarkUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const folderName = parseOptionalString(req.query.folderName);
      const query = parseOptionalString(req.query.q);
      const pinned = parseOptionalBoolean(req.query.pinned);

      const result = await listBookmarks(user.id, {
        folderName,
        query,
        pinned,
      });

      return res.json(result);
    },

    async getBookmark(req: Request, res: Response) {
      const user = await requireBookmarkUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const bookmarkId = parseBookmarkId(req.params.bookmarkId);

      if (!bookmarkId) {
        return sendBookmarkError(res, 400, "Please provide a valid bookmark id.");
      }

      const bookmark = await getBookmarkForUser(user.id, bookmarkId);

      if (!bookmark) {
        return sendBookmarkError(res, 404, "Bookmark not found.");
      }

      return res.json({ bookmark });
    },

    async createBookmark(req: Request, res: Response) {
      const user = await requireBookmarkUser(appEnv, req, res);

      if (!user) {
        return;
      }

      try {
        const payload = parseBookmarkPayload((req.body ?? {}) as BookmarkPayload);

        if (!payload.title) {
          return sendBookmarkError(res, 400, "Please enter a bookmark title.");
        }

        if (!payload.url) {
          return sendBookmarkError(res, 400, "Please enter a bookmark URL.");
        }

        const bookmark = await createBookmark(user.id, {
          title: payload.title,
          url: payload.url,
          folderName: payload.folderName,
          tags: payload.tags,
          pinned: payload.pinned,
          notes: payload.notes,
        });

        return res.status(201).json({ bookmark });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create bookmark.";

        return sendBookmarkError(res, 400, message);
      }
    },

    async updateBookmark(req: Request, res: Response) {
      const user = await requireBookmarkUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const bookmarkId = parseBookmarkId(req.params.bookmarkId);

      if (!bookmarkId) {
        return sendBookmarkError(res, 400, "Please provide a valid bookmark id.");
      }

      try {
        const payload = parseBookmarkPayload((req.body ?? {}) as BookmarkPayload);

        const bookmark = await updateBookmark(user.id, bookmarkId, {
          title: payload.title,
          url: payload.url,
          folderName: payload.folderName,
          tags: payload.tags,
          pinned: payload.pinned,
          notes: payload.notes,
        });

        return res.json({ bookmark });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update bookmark.";

        if (message === "Bookmark not found.") {
          return sendBookmarkError(res, 404, message);
        }

        return sendBookmarkError(res, 400, message);
      }
    },

    async deleteBookmark(req: Request, res: Response) {
      const user = await requireBookmarkUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const bookmarkId = parseBookmarkId(req.params.bookmarkId);

      if (!bookmarkId) {
        return sendBookmarkError(res, 400, "Please provide a valid bookmark id.");
      }

      const deleted = await deleteBookmark(user.id, bookmarkId);

      if (!deleted) {
        return sendBookmarkError(res, 404, "Bookmark not found.");
      }

      return res.json({ ok: true });
    },
  };
}

import { Router } from "express";
import type { AppEnv } from "../config/env";
import { createBookmarkController } from "../controllers/bookmarkController";

export function createBookmarkRouter(appEnv: AppEnv) {
  const router = Router();
  const controller = createBookmarkController(appEnv);

  router.get("/", controller.listBookmarks);
  router.get("/:bookmarkId", controller.getBookmark);
  router.post("/", controller.createBookmark);
  router.patch("/:bookmarkId", controller.updateBookmark);
  router.delete("/:bookmarkId", controller.deleteBookmark);

  return router;
}

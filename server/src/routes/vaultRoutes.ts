import { Router } from "express";
import type { AppEnv } from "../config/env";
import { createVaultController } from "../controllers/vaultController";

export function createVaultRouter(appEnv: AppEnv) {
  const router = Router();
  const controller = createVaultController(appEnv);

  router.get("/secrets", controller.listVaultSecrets);
  router.get("/secrets/:vaultSecretId", controller.getVaultSecret);
  router.post("/secrets", controller.createVaultSecret);
  router.patch("/secrets/:vaultSecretId", controller.updateVaultSecret);
  router.delete("/secrets/:vaultSecretId", controller.deleteVaultSecret);

  // Backward-compatible aliases for the earlier API-key-only path.
  router.get("/api-keys", controller.listVaultSecrets);
  router.get("/api-keys/:vaultSecretId", controller.getVaultSecret);
  router.post("/api-keys", controller.createVaultSecret);
  router.patch("/api-keys/:vaultSecretId", controller.updateVaultSecret);
  router.delete("/api-keys/:vaultSecretId", controller.deleteVaultSecret);

  return router;
}

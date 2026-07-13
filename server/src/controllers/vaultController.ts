import type { Request, Response } from "express";
import type { AppEnv } from "../config/env";
import { findVaultUserFromSession } from "../models/vaultSessionModel";
import {
  createVaultSecret,
  deleteVaultSecret,
  getVaultSecretForUser,
  listVaultSecrets,
  updateVaultSecret,
} from "../models/vaultModel";
import {
  normalizeVaultSecretCategory,
  type VaultSecretCategory,
} from "../utils/vault";

type VaultSecretPayload = {
  label?: unknown;
  category?: unknown;
  value?: unknown;
  notes?: unknown;
};

function sendVaultError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
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

function parseVaultSecretId(value: string | string[] | undefined): number | null {
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

function parseCategory(value: unknown): VaultSecretCategory | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return normalizeVaultSecretCategory(value);
}

function parseVaultSecretPayload(body: VaultSecretPayload) {
  return {
    label: parseOptionalString(body.label),
    category: parseCategory(body.category),
    value: parseOptionalString(body.value),
    notes: parseOptionalNullableString(body.notes),
  };
}

async function requireVaultUser(appEnv: AppEnv, req: Request, res: Response) {
  const user = await findVaultUserFromSession(appEnv, req);

  if (!user) {
    sendVaultError(res, 401, "Please unlock the vault first.");
    return null;
  }

  return user;
}

export function createVaultController(appEnv: AppEnv) {
  return {
    async listVaultSecrets(req: Request, res: Response) {
      const user = await requireVaultUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const category = parseCategory(req.query.category);
      const query = parseOptionalString(req.query.q);

      const result = await listVaultSecrets(appEnv, user.id, {
        category,
        query,
      });

      return res.json(result);
    },

    async getVaultSecret(req: Request, res: Response) {
      const user = await requireVaultUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const secretId = parseVaultSecretId(req.params.vaultSecretId);

      if (!secretId) {
        return sendVaultError(res, 400, "Please provide a valid secret id.");
      }

      const secret = await getVaultSecretForUser(appEnv, user.id, secretId);

      if (!secret) {
        return sendVaultError(res, 404, "Secret not found.");
      }

      return res.json({ secret });
    },

    async createVaultSecret(req: Request, res: Response) {
      const user = await requireVaultUser(appEnv, req, res);

      if (!user) {
        return;
      }

      try {
        const payload = parseVaultSecretPayload((req.body ?? {}) as VaultSecretPayload);

        if (!payload.label) {
          return sendVaultError(res, 400, "Please enter a label for this secret.");
        }

        if (!payload.category) {
          return sendVaultError(res, 400, "Please choose a secret category.");
        }

        if (!payload.value) {
          return sendVaultError(res, 400, "Please enter the secret text.");
        }

        const secret = await createVaultSecret(appEnv, user.id, {
          label: payload.label,
          category: payload.category,
          value: payload.value,
          notes: payload.notes,
        });

        return res.status(201).json({ secret });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to create secret.";

        return sendVaultError(res, 400, message);
      }
    },

    async updateVaultSecret(req: Request, res: Response) {
      const user = await requireVaultUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const secretId = parseVaultSecretId(req.params.vaultSecretId);

      if (!secretId) {
        return sendVaultError(res, 400, "Please provide a valid secret id.");
      }

      try {
        const payload = parseVaultSecretPayload((req.body ?? {}) as VaultSecretPayload);

        const secret = await updateVaultSecret(appEnv, user.id, secretId, {
          label: payload.label,
          category: payload.category,
          value: payload.value,
          notes: payload.notes,
        });

        return res.json({ secret });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to update secret.";

        if (message === "Secret not found.") {
          return sendVaultError(res, 404, message);
        }

        return sendVaultError(res, 400, message);
      }
    },

    async deleteVaultSecret(req: Request, res: Response) {
      const user = await requireVaultUser(appEnv, req, res);

      if (!user) {
        return;
      }

      const secretId = parseVaultSecretId(req.params.vaultSecretId);

      if (!secretId) {
        return sendVaultError(res, 400, "Please provide a valid secret id.");
      }

      const deleted = await deleteVaultSecret(user.id, secretId);

      if (!deleted) {
        return sendVaultError(res, 404, "Secret not found.");
      }

      return res.json({ ok: true });
    },
  };
}

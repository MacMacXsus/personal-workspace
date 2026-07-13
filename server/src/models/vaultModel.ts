import type { AppEnv } from "../config/env";
import { pool } from "../db/mysql";
import {
  decryptVaultSecretText,
  encryptVaultSecretText,
} from "../utils/vaultCrypto";
import {
  normalizeVaultSecretCategory,
  normalizeVaultSecretLabel,
  normalizeVaultSecretNotes,
  normalizeVaultSecretValue,
  VAULT_SECRET_CATEGORIES,
  type VaultSecretCategory,
} from "../utils/vault";

export type VaultSecretRecord = {
  id: number;
  label: string;
  category: VaultSecretCategory;
  value: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VaultSecretListFilters = {
  category?: VaultSecretCategory;
  query?: string;
};

export type CreateVaultSecretInput = {
  label: string;
  category: VaultSecretCategory;
  value: string;
  notes?: string | null;
};

export type UpdateVaultSecretInput = Partial<CreateVaultSecretInput>;

type VaultSecretRow = {
  id: number;
  user_id: number;
  label: string;
  category: string;
  notes: string | null;
  secret_ciphertext: string;
  secret_iv: string;
  secret_auth_tag: string;
  secret_key_version: number;
  created_at: string;
  updated_at: string;
};

let vaultSchemaReadyPromise: Promise<void> | null = null;

function normalizeVaultCategoryOrFallback(value: string): VaultSecretCategory {
  return VAULT_SECRET_CATEGORIES.includes(value as VaultSecretCategory)
    ? (value as VaultSecretCategory)
    : "Secret";
}

async function resolveVaultSecretValue(row: VaultSecretRow): Promise<string> {
  try {
    return await decryptVaultSecretText({
      ciphertext: row.secret_ciphertext,
      iv: row.secret_iv,
      authTag: row.secret_auth_tag,
    });
  } catch {
    return row.secret_ciphertext;
  }
}

async function ensureVaultSchemaReady() {
  if (!vaultSchemaReadyPromise) {
    vaultSchemaReadyPromise = (async () => {
      await migrateLegacyVaultApiKeys();
    })();
  }

  return vaultSchemaReadyPromise;
}

async function migrateLegacyVaultApiKeys() {
  const [legacyTableRows] = (await pool.execute(
    `
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'vault_api_keys'
      LIMIT 1
    `,
  )) as [Array<{ TABLE_NAME: string }>, unknown];

  const [secretCountRows] = (await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM vault_secrets
    `,
  )) as [Array<{ total: number }>, unknown];

  const hasSecrets = (secretCountRows[0]?.total ?? 0) > 0;

  if (legacyTableRows.length === 0 || hasSecrets) {
    return;
  }

  const [legacyRows] = (await pool.execute(
    `
      SELECT id, user_id, label, notes, api_key_value, created_at, updated_at
      FROM vault_api_keys
      ORDER BY id ASC
    `,
  )) as [
    Array<{
      id: number;
      user_id: number;
      label: string;
      notes: string | null;
      api_key_value: string;
      created_at: string;
      updated_at: string;
    }>,
    unknown,
  ];

  for (const row of legacyRows) {
    const encrypted = await encryptVaultSecretText(row.api_key_value);

    await pool.execute(
      `
        INSERT INTO vault_secrets (
          user_id,
          label,
          category,
          notes,
          secret_ciphertext,
          secret_iv,
          secret_auth_tag,
          secret_key_version,
          created_at,
          updated_at
        )
        VALUES (?, ?, 'API Key', ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        row.user_id,
        row.label,
        row.notes,
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
        encrypted.keyVersion,
        row.created_at,
        row.updated_at,
      ],
    );
  }
}

function withVaultSecretPresentation(
  row: VaultSecretRow,
  value: string,
): VaultSecretRecord {
  return {
    id: row.id,
    label: row.label,
    category: normalizeVaultCategoryOrFallback(row.category),
    value,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function hydrateVaultSecret(
  secretId: number,
): Promise<VaultSecretRecord | null> {
  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, label, category, notes, secret_ciphertext,
             secret_iv, secret_auth_tag, secret_key_version,
             created_at, updated_at
      FROM vault_secrets
      WHERE id = ?
      LIMIT 1
    `,
    [secretId],
  )) as [VaultSecretRow[], unknown];

  const row = rows[0];

  if (!row) {
    return null;
  }

  return withVaultSecretPresentation(
    row,
    await resolveVaultSecretValue(row),
  );
}

async function hydrateVaultSecretInRow(row: VaultSecretRow): Promise<VaultSecretRecord> {
  return withVaultSecretPresentation(
    row,
    await resolveVaultSecretValue(row),
  );
}

export async function listVaultSecrets(
  _appEnv: AppEnv,
  userId: number,
  filters: VaultSecretListFilters = {},
): Promise<{
  secrets: VaultSecretRecord[];
  categories: VaultSecretCategory[];
  total: number;
}> {
  await ensureVaultSchemaReady();

  const whereClauses = ["user_id = ?"];
  const params: Array<string | number> = [userId];

  if (filters.category) {
    whereClauses.push("category = ?");
    params.push(filters.category);
  }

  if (filters.query) {
    const searchTerm = `%${filters.query}%`;

    whereClauses.push("(label LIKE ? OR category LIKE ? OR notes LIKE ?)");
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, label, category, notes, secret_ciphertext,
             secret_iv, secret_auth_tag, secret_key_version,
             created_at, updated_at
      FROM vault_secrets
      WHERE ${whereClauses.join(" AND ")}
      ORDER BY updated_at DESC, id DESC
    `,
    params,
  )) as [VaultSecretRow[], unknown];

  const secrets = await Promise.all(rows.map((row) => hydrateVaultSecretInRow(row)));

  const [countRows] = (await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM vault_secrets
      WHERE ${whereClauses.join(" AND ")}
    `,
    params,
  )) as [Array<{ total: number }>, unknown];

  return {
    secrets,
    categories: [...VAULT_SECRET_CATEGORIES],
    total: countRows[0]?.total ?? 0,
  };
}

export async function getVaultSecretForUser(
  _appEnv: AppEnv,
  userId: number,
  secretId: number,
): Promise<VaultSecretRecord | null> {
  await ensureVaultSchemaReady();

  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, label, category, notes, secret_ciphertext,
             secret_iv, secret_auth_tag, secret_key_version,
             created_at, updated_at
      FROM vault_secrets
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [secretId, userId],
  )) as [VaultSecretRow[], unknown];

  const row = rows[0];

  if (!row) {
    return null;
  }

  return hydrateVaultSecretInRow(row);
}

export async function createVaultSecret(
  _appEnv: AppEnv,
  userId: number,
  input: CreateVaultSecretInput,
): Promise<VaultSecretRecord> {
  await ensureVaultSchemaReady();

  const label = normalizeVaultSecretLabel(input.label);
  const category = normalizeVaultSecretCategory(input.category);
  const value = normalizeVaultSecretValue(input.value);
  const notes = normalizeVaultSecretNotes(input.notes ?? undefined);
  const encrypted = await encryptVaultSecretText(value);

  const [result] = (await pool.execute(
    `
      INSERT INTO vault_secrets (
        user_id,
        label,
        category,
        notes,
        secret_ciphertext,
        secret_iv,
        secret_auth_tag,
        secret_key_version
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      userId,
      label,
      category,
      notes,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
      encrypted.keyVersion,
    ],
  )) as [
    {
      insertId: number;
    },
    unknown,
  ];

  const secretId = Number(result.insertId);
  const saved = await hydrateVaultSecret(secretId);

  if (!saved) {
    throw new Error("Unable to create secret.");
  }

  return saved;
}

export async function updateVaultSecret(
  _appEnv: AppEnv,
  userId: number,
  secretId: number,
  input: UpdateVaultSecretInput,
): Promise<VaultSecretRecord> {
  await ensureVaultSchemaReady();

  const [rows] = (await pool.execute(
    `
      SELECT id, user_id, label, category, notes, secret_ciphertext,
             secret_iv, secret_auth_tag, secret_key_version,
             created_at, updated_at
      FROM vault_secrets
      WHERE id = ? AND user_id = ?
      LIMIT 1
    `,
    [secretId, userId],
  )) as [VaultSecretRow[], unknown];

  const existing = rows[0];

  if (!existing) {
    throw new Error("Secret not found.");
  }

  const label =
    input.label !== undefined
      ? normalizeVaultSecretLabel(input.label)
      : existing.label;
  const category =
    input.category !== undefined
      ? normalizeVaultSecretCategory(input.category)
      : normalizeVaultSecretCategory(existing.category);
  const notes =
    input.notes !== undefined
      ? normalizeVaultSecretNotes(input.notes ?? undefined)
      : existing.notes;

  let secretCiphertext = existing.secret_ciphertext;
  let secretIv = existing.secret_iv;
  let secretAuthTag = existing.secret_auth_tag;
  let secretKeyVersion = existing.secret_key_version;

  if (input.value !== undefined) {
    const encrypted = await encryptVaultSecretText(
      normalizeVaultSecretValue(input.value),
    );

    secretCiphertext = encrypted.ciphertext;
    secretIv = encrypted.iv;
    secretAuthTag = encrypted.authTag;
    secretKeyVersion = encrypted.keyVersion;
  }

  await pool.execute(
    `
      UPDATE vault_secrets
      SET label = ?,
          category = ?,
          notes = ?,
          secret_ciphertext = ?,
          secret_iv = ?,
          secret_auth_tag = ?,
          secret_key_version = ?
      WHERE id = ? AND user_id = ?
    `,
    [
      label,
      category,
      notes,
      secretCiphertext,
      secretIv,
      secretAuthTag,
      secretKeyVersion,
      secretId,
      userId,
    ],
  );

  const saved = await hydrateVaultSecret(secretId);

  if (!saved) {
    throw new Error("Unable to update secret.");
  }

  return saved;
}

export async function deleteVaultSecret(
  userId: number,
  secretId: number,
): Promise<boolean> {
  await ensureVaultSchemaReady();

  const [result] = (await pool.execute(
    `
      DELETE FROM vault_secrets
      WHERE id = ? AND user_id = ?
    `,
    [secretId, userId],
  )) as [
    {
      affectedRows: number;
    },
    unknown,
  ];

  return result.affectedRows > 0;
}

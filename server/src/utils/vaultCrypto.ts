import crypto from "node:crypto";
import { pool } from "../db/mysql";

const VAULT_KEY_NAME = "master_encryption_key_v1";
const VAULT_KEY_LENGTH = 32;
const VAULT_IV_LENGTH = 12;

function decodeVaultKey(rawValue: string): Buffer {
  const trimmed = rawValue.trim();
  const isHex = /^[0-9a-fA-F]{64}$/.test(trimmed);
  const decoded = isHex
    ? Buffer.from(trimmed, "hex")
    : Buffer.from(trimmed, "base64");

  if (decoded.length !== VAULT_KEY_LENGTH) {
    throw new Error(
      "Vault master key must decode to exactly 32 bytes.",
    );
  }

  return decoded;
}

let cachedVaultKey: Buffer | null = null;
let vaultKeyLoadPromise: Promise<Buffer> | null = null;

async function readOrCreateVaultKey(): Promise<Buffer> {
  const [rows] = (await pool.execute(
    `
      SELECT setting_value
      FROM vault_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [VAULT_KEY_NAME],
  )) as [Array<{ setting_value: string }>, unknown];

  const existing = rows[0];

  if (existing?.setting_value) {
    return decodeVaultKey(existing.setting_value);
  }

  const generatedKey = crypto.randomBytes(VAULT_KEY_LENGTH).toString("base64");

  await pool.execute(
    `
      INSERT IGNORE INTO vault_settings (setting_key, setting_value)
      VALUES (?, ?)
    `,
    [VAULT_KEY_NAME, generatedKey],
  );

  const [freshRows] = (await pool.execute(
    `
      SELECT setting_value
      FROM vault_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [VAULT_KEY_NAME],
  )) as [Array<{ setting_value: string }>, unknown];

  const fresh = freshRows[0];

  if (!fresh?.setting_value) {
    throw new Error("Unable to initialize the vault master key.");
  }

  return decodeVaultKey(fresh.setting_value);
}

export async function getVaultMasterKey(): Promise<Buffer> {
  if (cachedVaultKey) {
    return cachedVaultKey;
  }

  if (!vaultKeyLoadPromise) {
    vaultKeyLoadPromise = readOrCreateVaultKey().then((key) => {
      cachedVaultKey = key;
      vaultKeyLoadPromise = null;

      return key;
    });
  }

  return vaultKeyLoadPromise;
}

export async function encryptVaultSecretText(value: string): Promise<{
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: number;
}> {
  const key = await getVaultMasterKey();
  const iv = crypto.randomBytes(VAULT_IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    keyVersion: 1,
  };
}

export async function decryptVaultSecretText(payload: {
  ciphertext: string;
  iv: string;
  authTag: string;
}): Promise<string> {
  const key = await getVaultMasterKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(payload.iv, "base64"),
  );

  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

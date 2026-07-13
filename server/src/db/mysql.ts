import mysql from "mysql2/promise";
import { getAppEnv } from "../config/env";

const appEnv = getAppEnv();

export const pool = mysql.createPool({
  host: appEnv.mysql.host,
  port: appEnv.mysql.port,
  user: appEnv.mysql.user,
  password: appEnv.mysql.password,
  database: appEnv.mysql.database,
  dateStrings: true,
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: appEnv.mysql.ssl,
});

export async function initializeAuthSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      google_sub VARCHAR(255) NULL,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NULL,
      avatar_url VARCHAR(512) NULL,
      email_verified_at TIMESTAMP NULL DEFAULT NULL,
      email_verification_token_hash CHAR(64) NULL,
      email_verification_code_hash CHAR(64) NULL,
      email_verification_expires_at DATETIME NULL DEFAULT NULL,
      email_verification_sent_at TIMESTAMP NULL DEFAULT NULL,
      password_reset_token_hash CHAR(64) NULL,
      password_reset_code_hash CHAR(64) NULL,
      password_reset_expires_at DATETIME NULL DEFAULT NULL,
      password_reset_sent_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_users_google_sub (google_sub),
      UNIQUE KEY uniq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [columnRows] = (await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
    `,
  )) as [Array<{ COLUMN_NAME: string }>, unknown];

  const columns = new Set(columnRows.map((row) => row.COLUMN_NAME));
  const emailVerifiedAtWasMissing = !columns.has("email_verified_at");

  if (!columns.has("password_hash")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN password_hash VARCHAR(255) NULL AFTER name
    `);
  }

  if (!columns.has("email_verified_at")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN email_verified_at TIMESTAMP NULL DEFAULT NULL AFTER avatar_url
    `);
  }

  if (!columns.has("email_verification_token_hash")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN email_verification_token_hash CHAR(64) NULL AFTER email_verified_at
    `);
  }

  if (!columns.has("email_verification_code_hash")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN email_verification_code_hash CHAR(64) NULL AFTER email_verification_token_hash
    `);
  }

  if (!columns.has("email_verification_expires_at")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN email_verification_expires_at DATETIME NULL DEFAULT NULL AFTER email_verification_code_hash
    `);
  }

  if (!columns.has("email_verification_sent_at")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN email_verification_sent_at TIMESTAMP NULL DEFAULT NULL AFTER email_verification_expires_at
    `);
  }

  if (!columns.has("password_reset_token_hash")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN password_reset_token_hash CHAR(64) NULL AFTER email_verification_sent_at
    `);
  }

  if (!columns.has("password_reset_code_hash")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN password_reset_code_hash CHAR(64) NULL AFTER password_reset_token_hash
    `);
  }

  if (!columns.has("password_reset_expires_at")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN password_reset_expires_at DATETIME NULL DEFAULT NULL AFTER password_reset_code_hash
    `);
  }

  if (!columns.has("password_reset_sent_at")) {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN password_reset_sent_at TIMESTAMP NULL DEFAULT NULL AFTER password_reset_expires_at
    `);
  }

  if (emailVerifiedAtWasMissing) {
    await pool.execute(`
      UPDATE users
      SET email_verified_at = created_at
      WHERE email_verified_at IS NULL
    `);
  }

  await pool.execute(`
    ALTER TABLE users
    MODIFY google_sub VARCHAR(255) NULL
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      session_token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_sessions_token_hash (session_token_hash),
      KEY idx_sessions_user_id (user_id),
      KEY idx_sessions_expires_at (expires_at),
      CONSTRAINT fk_sessions_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vault_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      session_token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_vault_sessions_token_hash (session_token_hash),
      KEY idx_vault_sessions_user_id (user_id),
      KEY idx_vault_sessions_expires_at (expires_at),
      CONSTRAINT fk_vault_sessions_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function initializeBookmarkSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(120) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_bookmark_tags_user_slug (user_id, slug),
      KEY idx_bookmark_tags_user_id (user_id),
      CONSTRAINT fk_bookmark_tags_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      title VARCHAR(255) NOT NULL,
      url VARCHAR(2048) NOT NULL,
      folder_name VARCHAR(100) NOT NULL DEFAULT 'General',
      is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_bookmarks_user_id (user_id),
      KEY idx_bookmarks_user_folder (user_id, folder_name),
      KEY idx_bookmarks_user_pinned (user_id, is_pinned),
      CONSTRAINT fk_bookmarks_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_tag_links (
      bookmark_id BIGINT UNSIGNED NOT NULL,
      tag_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (bookmark_id, tag_id),
      KEY idx_bookmark_tag_links_tag_id (tag_id),
      CONSTRAINT fk_bookmark_tag_links_bookmark_id
        FOREIGN KEY (bookmark_id) REFERENCES bookmarks (id)
        ON DELETE CASCADE,
      CONSTRAINT fk_bookmark_tag_links_tag_id
        FOREIGN KEY (tag_id) REFERENCES bookmark_tags (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function initializeVaultSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vault_settings (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL,
      setting_value LONGTEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_vault_settings_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vault_secrets (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      label VARCHAR(255) NOT NULL,
      category VARCHAR(64) NOT NULL,
      notes VARCHAR(255) NULL,
      secret_ciphertext LONGTEXT NOT NULL,
      secret_iv CHAR(24) NOT NULL,
      secret_auth_tag CHAR(24) NOT NULL,
      secret_key_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_vault_secrets_user_id (user_id),
      KEY idx_vault_secrets_user_category (user_id, category),
      KEY idx_vault_secrets_user_updated_at (user_id, updated_at),
      CONSTRAINT fk_vault_secrets_user_id
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();

    return {
      database: appEnv.mysql.database,
      host: appEnv.mysql.host,
      ssl: Boolean(appEnv.mysql.ssl),
    };
  } finally {
    connection.release();
  }
}

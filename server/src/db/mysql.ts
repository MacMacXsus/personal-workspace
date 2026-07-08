import mysql from "mysql2/promise";
import { getAppEnv } from "../config/env";

const appEnv = getAppEnv();

export const pool = mysql.createPool({
  host: appEnv.mysql.host,
  port: appEnv.mysql.port,
  user: appEnv.mysql.user,
  password: appEnv.mysql.password,
  database: appEnv.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: appEnv.mysql.ssl,
});

export async function initializeAuthSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      google_sub VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      avatar_url VARCHAR(512) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_users_google_sub (google_sub),
      UNIQUE KEY uniq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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

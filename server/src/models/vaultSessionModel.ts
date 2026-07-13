import crypto from "node:crypto";
import type { Request } from "express";
import type { AppEnv } from "../config/env";
import { pool } from "../db/mysql";
import { readCookie } from "../utils/http";
import type { SessionUser } from "./sessionModel";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function findVaultUserFromSession(
  appEnv: AppEnv,
  req: Request,
): Promise<SessionUser | null> {
  const sessionToken = readCookie(req.headers.cookie, appEnv.auth.vaultSessionCookieName);

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = sha256(sessionToken);

  const [rows] = (await pool.execute(
    `
      SELECT id, name, email, avatar_url
      FROM users
      WHERE id = (
        SELECT user_id
        FROM vault_sessions
        WHERE session_token_hash = ?
          AND expires_at > UTC_TIMESTAMP()
        LIMIT 1
      )
      AND email_verified_at IS NOT NULL
      LIMIT 1
    `,
    [sessionTokenHash],
  )) as [
    Array<{
      id: number;
      name: string;
      email: string;
      avatar_url: string | null;
    }>,
    unknown,
  ];

  const user = rows[0];

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
  };
}

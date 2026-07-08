import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
import type { AppEnv } from "../config/env";
import { pool } from "../db/mysql";

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
};

type AuthUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
};

type UserRow = {
  id: number;
  google_sub: string | null;
  email: string;
  name: string;
  password_hash: string | null;
  avatar_url: string | null;
};

type PasswordFields = {
  name: string;
  email: string;
  password: string;
};

const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEY_LENGTH = 32;
const PBKDF2_DIGEST = "sha256";
const PASSWORD_HASH_PREFIX = "pbkdf2";

function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, pair) => {
    const separatorIndex = pair.indexOf("=");

    if (separatorIndex === -1) {
      return cookies;
    }

    const name = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();

    if (name) {
      cookies[name] = decodeURIComponent(value);
    }

    return cookies;
  }, {});
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAgeSeconds?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
  } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  parts.push(`Path=${options.path ?? "/"}`);

  if (typeof options.maxAgeSeconds === "number") {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }

  if (options.httpOnly ?? true) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`);
  }

  return parts.join("; ");
}

function readCookie(req: Request, name: string): string | undefined {
  return parseCookies(req.headers.cookie)[name];
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  options: Parameters<typeof serializeCookie>[2],
) {
  res.append("Set-Cookie", serializeCookie(name, value, options));
}

function clearCookie(
  res: Response,
  name: string,
  options: {
    path?: string;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
  } = {},
) {
  res.append(
    "Set-Cookie",
    serializeCookie(name, "", {
      path: options.path ?? "/",
      maxAgeSeconds: 0,
      httpOnly: true,
      secure: options.secure,
      sameSite: options.sameSite ?? "lax",
    }),
  );
}

function sendAuthError(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

function buildGoogleAuthUrl(appEnv: AppEnv, state: string): string {
  if (!appEnv.auth.googleClientId || !appEnv.auth.googleRedirectUri) {
    throw new Error("Google OAuth is not configured.");
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  authUrl.searchParams.set("client_id", appEnv.auth.googleClientId);
  authUrl.searchParams.set("redirect_uri", appEnv.auth.googleRedirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return authUrl.toString();
}

function toAuthUser(row: {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
  };
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      PBKDF2_KEY_LENGTH,
      PBKDF2_DIGEST,
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      },
    );
  });

  return [
    PASSWORD_HASH_PREFIX,
    PBKDF2_DIGEST,
    PBKDF2_ITERATIONS.toString(),
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [prefix, digest, iterationsValue, salt, expectedHex] = storedHash.split("$");

  if (
    prefix !== PASSWORD_HASH_PREFIX ||
    digest !== PBKDF2_DIGEST ||
    !iterationsValue ||
    !salt ||
    !expectedHex
  ) {
    return false;
  }

  const iterations = Number(iterationsValue);

  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, expected.length, digest, (error, key) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(key);
    });
  });

  return (
    derivedKey.length === expected.length &&
    crypto.timingSafeEqual(derivedKey, expected)
  );
}

async function exchangeCodeForTokens(appEnv: AppEnv, code: string) {
  if (
    !appEnv.auth.googleClientId ||
    !appEnv.auth.googleClientSecret ||
    !appEnv.auth.googleRedirectUri
  ) {
    throw new Error("Google OAuth is not configured.");
  }

  const body = new URLSearchParams({
    code,
    client_id: appEnv.auth.googleClientId,
    client_secret: appEnv.auth.googleClientSecret,
    redirect_uri: appEnv.auth.googleRedirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google token exchange failed: ${details}`);
  }

  return (await response.json()) as {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    id_token?: string;
  };
}

async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google userinfo request failed: ${details}`);
  }

  return (await response.json()) as GoogleUserInfo;
}

async function createSession(appEnv: AppEnv, userId: number): Promise<string> {
  const sessionToken = randomToken(32);
  const sessionTokenHash = sha256(sessionToken);
  const expiresAt = new Date(
    Date.now() + appEnv.auth.sessionDurationDays * 24 * 60 * 60 * 1000,
  );

  await pool.execute(
    "DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP()",
  );

  await pool.execute(
    `
      INSERT INTO sessions (user_id, session_token_hash, expires_at)
      VALUES (?, ?, ?)
    `,
    [userId, sessionTokenHash, expiresAt],
  );

  return sessionToken;
}

async function findUserFromSession(
  appEnv: AppEnv,
  req: Request,
): Promise<AuthUser | null> {
  const sessionToken = readCookie(req, appEnv.auth.sessionCookieName);

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
        FROM sessions
        WHERE session_token_hash = ?
          AND expires_at > UTC_TIMESTAMP()
        LIMIT 1
      )
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

  return toAuthUser(user);
}

async function upsertGoogleUser(profile: GoogleUserInfo): Promise<AuthUser> {
  const [rows] = (await pool.execute(
    `
      SELECT id, google_sub, email, name, password_hash, avatar_url
      FROM users
      WHERE google_sub = ? OR email = ?
      LIMIT 1
    `,
    [profile.sub, profile.email],
  )) as [UserRow[], unknown];

  const existingUser = rows[0];
  const avatarUrl = profile.picture ?? null;

  if (existingUser) {
    await pool.execute(
      `
        UPDATE users
        SET google_sub = ?, email = ?, name = ?, avatar_url = ?
        WHERE id = ?
      `,
      [profile.sub, profile.email, profile.name, avatarUrl, existingUser.id],
    );

    return {
      id: existingUser.id,
      name: profile.name,
      email: profile.email,
      avatarUrl,
    };
  }

  const [result] = (await pool.execute(
    `
      INSERT INTO users (google_sub, email, name, password_hash, avatar_url)
      VALUES (?, ?, ?, NULL, ?)
    `,
    [profile.sub, profile.email, profile.name, avatarUrl],
  )) as [{ insertId: number }, unknown];

  return {
    id: Number(result.insertId),
    name: profile.name,
    email: profile.email,
    avatarUrl,
  };
}

async function signupPasswordUser(fields: PasswordFields): Promise<AuthUser> {
  const email = normalizeEmail(fields.email);
  const passwordHash = await hashPassword(fields.password);

  const [rows] = (await pool.execute(
    `
      SELECT id, google_sub, email, name, password_hash, avatar_url
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [email],
  )) as [UserRow[], unknown];

  const existingUser = rows[0];

  if (existingUser) {
    if (existingUser.password_hash) {
      throw new Error("An account with this email already exists.");
    }

    const name = fields.name.trim();

    await pool.execute(
      `
        UPDATE users
        SET name = ?, password_hash = ?
        WHERE id = ?
      `,
      [name, passwordHash, existingUser.id],
    );

    return {
      id: existingUser.id,
      name,
      email: existingUser.email,
      avatarUrl: existingUser.avatar_url,
    };
  }

  const [result] = (await pool.execute(
    `
      INSERT INTO users (google_sub, email, name, password_hash, avatar_url)
      VALUES (NULL, ?, ?, ?, NULL)
    `,
    [email, fields.name.trim(), passwordHash],
  )) as [{ insertId: number }, unknown];

  return {
    id: Number(result.insertId),
    name: fields.name.trim(),
    email,
    avatarUrl: null,
  };
}

async function loginPasswordUser(email: string, password: string): Promise<AuthUser> {
  const [rows] = (await pool.execute(
    `
      SELECT id, google_sub, email, name, password_hash, avatar_url
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
    [normalizeEmail(email)],
  )) as [UserRow[], unknown];

  const user = rows[0];

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (!user.password_hash) {
    throw new Error("This account uses Google sign-in. Try Google login instead.");
  }

  const isValid = await verifyPassword(password, user.password_hash);

  if (!isValid) {
    throw new Error("Invalid email or password.");
  }

  return toAuthUser({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
  });
}

function authUnavailableMessage(appEnv: AppEnv): string {
  const missing = [
    !appEnv.auth.googleClientId ? "GOOGLE_CLIENT_ID" : null,
    !appEnv.auth.googleClientSecret ? "GOOGLE_CLIENT_SECRET" : null,
    !appEnv.auth.googleRedirectUri ? "GOOGLE_REDIRECT_URI" : null,
  ].filter(Boolean);

  return `Google OAuth is not configured yet. Set ${missing.join(", ")} and FRONTEND_URL in server/.env.`;
}

function validatePasswordFields(
  payload: Partial<PasswordFields>,
  requireName: boolean,
): PasswordFields {
  const name = (payload.name ?? "").trim();
  const email = (payload.email ?? "").trim();
  const password = payload.password ?? "";

  if (requireName && name.length < 2) {
    throw new Error("Please enter your name.");
  }

  if (!email) {
    throw new Error("Please enter your email.");
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  return {
    name,
    email,
    password,
  };
}

async function attachSession(res: Response, appEnv: AppEnv, userId: number) {
  const sessionToken = await createSession(appEnv, userId);

  setCookie(res, appEnv.auth.sessionCookieName, sessionToken, {
    path: "/",
    maxAgeSeconds: appEnv.auth.sessionDurationDays * 24 * 60 * 60,
    httpOnly: true,
    secure: appEnv.auth.cookieSecure,
    sameSite: "lax",
  });
}

export function createAuthRouter(appEnv: AppEnv): Router {
  const router = Router();

  router.get("/google", (_req, res) => {
    if (!appEnv.auth.enabled) {
      return res.status(503).send(authUnavailableMessage(appEnv));
    }

    const state = randomToken(24);

    setCookie(res, appEnv.auth.stateCookieName, state, {
      path: "/auth/google",
      maxAgeSeconds: 10 * 60,
      httpOnly: true,
      secure: appEnv.auth.cookieSecure,
      sameSite: "lax",
    });

    return res.redirect(buildGoogleAuthUrl(appEnv, state));
  });

  router.get("/google/callback", async (req, res) => {
    if (!appEnv.auth.enabled) {
      return res.status(503).send(authUnavailableMessage(appEnv));
    }

    const { code, state, error } = req.query;

    if (typeof error === "string") {
      return res.status(400).send(`Google sign-in was cancelled: ${error}`);
    }

    if (typeof code !== "string" || typeof state !== "string") {
      return res.status(400).send("Missing OAuth code or state.");
    }

    const storedState = readCookie(req, appEnv.auth.stateCookieName);

    if (!storedState || storedState !== state) {
      return res.status(400).send("Invalid OAuth state. Please try again.");
    }

    clearCookie(res, appEnv.auth.stateCookieName, {
      path: "/auth/google",
      secure: appEnv.auth.cookieSecure,
      sameSite: "lax",
    });

    const tokenSet = await exchangeCodeForTokens(appEnv, code);
    const profile = await fetchGoogleUserInfo(tokenSet.access_token);

    if (!profile.email_verified) {
      return res.status(403).send("Google account email is not verified.");
    }

    const user = await upsertGoogleUser(profile);
    await attachSession(res, appEnv, user.id);

    return res.redirect(new URL("/dashboard", appEnv.auth.frontendUrl).toString());
  });

  router.post("/signup", async (req, res) => {
    try {
      const fields = validatePasswordFields(req.body ?? {}, true);
      const user = await signupPasswordUser(fields);

      await attachSession(res, appEnv, user.id);

      return res.status(201).json({ user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";

      return sendAuthError(res, 400, message);
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const fields = validatePasswordFields(req.body ?? {}, false);
      const user = await loginPasswordUser(fields.email, fields.password);

      await attachSession(res, appEnv, user.id);

      return res.json({ user });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";

      return sendAuthError(res, 401, message);
    }
  });

  router.get("/me", async (req, res) => {
    const user = await findUserFromSession(appEnv, req);

    if (!user) {
      return res.status(401).json({ user: null });
    }

    return res.json({ user });
  });

  router.post("/logout", async (req, res) => {
    const sessionToken = readCookie(req, appEnv.auth.sessionCookieName);

    if (sessionToken) {
      await pool.execute(
        "DELETE FROM sessions WHERE session_token_hash = ?",
        [sha256(sessionToken)],
      );
    }

    clearCookie(res, appEnv.auth.sessionCookieName, {
      path: "/",
      secure: appEnv.auth.cookieSecure,
      sameSite: "lax",
    });

    return res.json({ ok: true });
  });

  return router;
}

export const createGoogleAuthRouter = createAuthRouter;

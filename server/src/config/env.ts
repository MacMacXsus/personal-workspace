import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type SslConfig = {
  ca?: string;
  rejectUnauthorized?: boolean;
};

export type AuthConfig = {
  frontendUrl: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  sessionCookieName: string;
  stateCookieName: string;
  sessionDurationDays: number;
  cookieSecure: boolean;
  enabled: boolean;
};

export type AppEnv = {
  port: number;
  frontendUrl: string;
  auth: AuthConfig;
  mysql: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl?: SslConfig;
  };
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value ? value : undefined;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid port value: ${value}`);
  }

  return parsed;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid integer value: ${value}`);
  }

  return parsed;
}

function buildSslConfig(): SslConfig | undefined {
  const sslMode = (process.env.MYSQL_SSL_MODE ?? "disabled").toLowerCase();

  if (sslMode === "disabled" || sslMode === "false" || sslMode === "off") {
    return undefined;
  }

  const rejectUnauthorized = parseBoolean(
    process.env.MYSQL_SSL_REJECT_UNAUTHORIZED,
    true,
  );
  const caFromEnv = process.env.MYSQL_SSL_CA?.trim();
  const caPath = process.env.MYSQL_SSL_CA_PATH?.trim();

  if (caFromEnv) {
    return {
      ca: caFromEnv,
      rejectUnauthorized,
    };
  }

  if (caPath) {
    const resolvedPath = path.isAbsolute(caPath)
      ? caPath
      : path.resolve(process.cwd(), caPath);

    if (!existsSync(resolvedPath)) {
      throw new Error(`MYSQL_SSL_CA_PATH does not exist: ${resolvedPath}`);
    }

    return {
      ca: readFileSync(resolvedPath, "utf8"),
      rejectUnauthorized,
    };
  }

  return {
    rejectUnauthorized,
  };
}

export function getAppEnv(): AppEnv {
  const frontendUrl =
    (getOptionalEnv("FRONTEND_URL") ?? "http://localhost:5173").replace(
      /\/$/,
      "",
    );
  const googleClientId = getOptionalEnv("GOOGLE_CLIENT_ID");
  const googleClientSecret = getOptionalEnv("GOOGLE_CLIENT_SECRET");
  const googleRedirectUri = getOptionalEnv("GOOGLE_REDIRECT_URI");

  return {
    port: parsePort(process.env.PORT, 3000),
    frontendUrl,
    auth: {
      frontendUrl,
      googleClientId,
      googleClientSecret,
      googleRedirectUri,
      sessionCookieName:
        getOptionalEnv("AUTH_SESSION_COOKIE_NAME") ?? "workspace_session",
      stateCookieName:
        getOptionalEnv("AUTH_STATE_COOKIE_NAME") ?? "workspace_oauth_state",
      sessionDurationDays: parseInteger(
        process.env.AUTH_SESSION_DURATION_DAYS,
        30,
      ),
      cookieSecure: parseBoolean(
        process.env.AUTH_COOKIE_SECURE,
        process.env.NODE_ENV === "production",
      ),
      enabled: Boolean(
        googleClientId && googleClientSecret && googleRedirectUri,
      ),
    },
    mysql: {
      host: getRequiredEnv("MYSQL_HOST"),
      port: parsePort(process.env.MYSQL_PORT, 3306),
      user: getRequiredEnv("MYSQL_USER"),
      password: getRequiredEnv("MYSQL_PASSWORD"),
      database: getRequiredEnv("MYSQL_DATABASE"),
      ssl: buildSslConfig(),
    },
  };
}

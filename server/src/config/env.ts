import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type SslConfig = {
  ca?: string;
  rejectUnauthorized?: boolean;
};

type AppEnv = {
  port: number;
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
  return {
    port: parsePort(process.env.PORT, 3000),
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

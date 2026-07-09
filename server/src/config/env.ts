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
  pendingVerificationCookieName: string;
  pendingPasswordResetCookieName: string;
  pendingPasswordResetConfirmedCookieName: string;
  sessionDurationDays: number;
  cookieSecure: boolean;
  verificationCodeLength: number;
  verificationCodeExpiryMinutes: number;
  verificationResendCooldownSeconds: number;
  enabled: boolean;
};

export type MailConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

export type AppEnv = {
  port: number;
  frontendUrl: string;
  auth: AuthConfig;
  mail: MailConfig;
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

function validateBrevoApiKey(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("Missing mail API key. Set BREVO_API_KEY to your Brevo API key.");
  }

  if (trimmed.startsWith("xsmtpsib-")) {
    throw new Error(
      "BREVO_API_KEY looks like a Brevo SMTP relay key (xsmtpsib-...). This project sends through the Brevo API, so you need the Brevo API key instead.",
    );
  }

  return trimmed;
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
  const mailApiKey = getOptionalEnv("BREVO_API_KEY");
  const mailFromEmail = getOptionalEnv("BREVO_FROM_EMAIL");

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
      pendingVerificationCookieName:
        getOptionalEnv("AUTH_PENDING_VERIFICATION_COOKIE_NAME") ??
        "workspace_pending_verification",
      pendingPasswordResetCookieName:
        getOptionalEnv("AUTH_PENDING_PASSWORD_RESET_COOKIE_NAME") ??
        "workspace_pending_password_reset",
      pendingPasswordResetConfirmedCookieName:
        getOptionalEnv("AUTH_PENDING_PASSWORD_RESET_CONFIRMED_COOKIE_NAME") ??
        "workspace_pending_password_reset_confirmed",
      sessionDurationDays: parseInteger(
        process.env.AUTH_SESSION_DURATION_DAYS,
        30,
      ),
      cookieSecure: parseBoolean(
        process.env.AUTH_COOKIE_SECURE,
        process.env.NODE_ENV === "production",
      ),
      verificationCodeLength: parseInteger(
        process.env.AUTH_OTP_CODE_LENGTH,
        6,
      ),
      verificationCodeExpiryMinutes: parseInteger(
        process.env.AUTH_OTP_EXPIRES_MINUTES,
        10,
      ),
      verificationResendCooldownSeconds: parseInteger(
        process.env.AUTH_OTP_RESEND_COOLDOWN_SECONDS,
        60,
      ),
      enabled: Boolean(
        googleClientId && googleClientSecret && googleRedirectUri,
      ),
    },
    mail: {
      apiKey: validateBrevoApiKey(
        mailApiKey ??
          (() => {
            throw new Error(
              "Missing mail API key. Set BREVO_API_KEY to your Brevo API key.",
            );
          })(),
      ),
      fromEmail:
        mailFromEmail ??
        (() => {
          throw new Error(
            "Missing mail sender email. Set BREVO_FROM_EMAIL to a Brevo-verified sender.",
          );
        })(),
      fromName: getOptionalEnv("MAIL_FROM_NAME") ?? "Workspace",
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

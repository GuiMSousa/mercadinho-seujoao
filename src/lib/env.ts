import "server-only";
import {
  databaseUrlSchema,
  logLevelSchema,
  mailFromSchema,
  parseEnv,
  resendApiKeySchema,
  sessionSecretSchema,
} from "./env-schema";

export function getDatabaseUrl() {
  return parseEnv("DATABASE_URL", process.env.DATABASE_URL, databaseUrlSchema);
}

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}

export function getSessionSecret() {
  return parseEnv(
    "SESSION_SECRET",
    process.env.SESSION_SECRET,
    sessionSecretSchema,
  );
}

const isProduction = () => process.env.NODE_ENV === "production";

// Empty values (e.g. a blank line copied from .env.example) count as unset.
// Optional outside production, where the mailer falls back to logging.
export function getResendApiKey() {
  const value = process.env.RESEND_API_KEY || undefined;
  if (value === undefined && !isProduction()) return undefined;
  return parseEnv("RESEND_API_KEY", value, resendApiKeySchema);
}

export function getMailFrom() {
  const value =
    process.env.MAIL_FROM ||
    (isProduction() ? undefined : "Mkt Control <no-reply@localhost>");
  return parseEnv("MAIL_FROM", value, mailFromSchema);
}

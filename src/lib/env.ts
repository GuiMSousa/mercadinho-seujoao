import "server-only";
import {
  databaseUrlSchema,
  logLevelSchema,
  parseEnv,
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

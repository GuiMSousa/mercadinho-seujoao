import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getDatabaseUrl,
  getLogLevel,
  getMailFrom,
  getResendApiKey,
  getSessionSecret,
} from "./env";

vi.mock("server-only", () => ({}));
afterEach(() => vi.unstubAllEnvs());

describe("server environment", () => {
  it("does not require a database URL to read independent configuration", () => {
    vi.stubEnv("DATABASE_URL", undefined);
    vi.stubEnv("LOG_LEVEL", undefined);
    expect(getLogLevel()).toBe("info");
    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL");
  });

  it("accepts PostgreSQL connection protocols", () => {
    for (const protocol of ["postgres", "postgresql"]) {
      const value = `${protocol}://app:development@localhost:5432/app`;
      vi.stubEnv("DATABASE_URL", value);
      expect(getDatabaseUrl()).toBe(value);
    }
  });

  it("rejects a wrong protocol without exposing its credentials", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "https://app:sensitive-test-value@example.invalid/db",
    );
    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL");
    expect(() => getDatabaseUrl()).not.toThrow("sensitive-test-value");
  });

  it("rejects malformed URLs and invalid log levels", () => {
    vi.stubEnv("DATABASE_URL", "not a URL");
    vi.stubEnv("LOG_LEVEL", "not-a-level");
    expect(() => getDatabaseUrl()).toThrow("DATABASE_URL");
    expect(() => getLogLevel()).toThrow("LOG_LEVEL");
  });

  it("requires a session secret of at least 32 characters without echoing it", () => {
    vi.stubEnv("SESSION_SECRET", "short-secret-value");
    expect(() => getSessionSecret()).toThrow("SESSION_SECRET");
    expect(() => getSessionSecret()).not.toThrow("short-secret-value");
    vi.stubEnv("SESSION_SECRET", "x".repeat(32));
    expect(getSessionSecret()).toHaveLength(32);
  });

  it("treats the Resend key as optional outside production and required in it", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    expect(getResendApiKey()).toBeUndefined();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    expect(getResendApiKey()).toBe("re_test_key");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", undefined);
    expect(() => getResendApiKey()).toThrow("RESEND_API_KEY");
  });

  it("defaults the sender outside production and requires it in production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MAIL_FROM", undefined);
    expect(getMailFrom()).toBe("Mkt Control <no-reply@localhost>");
    vi.stubEnv("MAIL_FROM", "Loja <oi@example.com>");
    expect(getMailFrom()).toBe("Loja <oi@example.com>");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MAIL_FROM", undefined);
    expect(() => getMailFrom()).toThrow("MAIL_FROM");
  });
});

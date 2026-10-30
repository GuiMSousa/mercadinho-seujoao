import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/domains/auth/login-rate-limit";
import { adminBodyRoute } from "./admin";
import { publicPost } from "./public";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

const HASH = "scrypt$secret-password-hash";

// What drizzle-orm throws: a wrapper whose message lists the parameters, with the pg error as cause.
function drizzleError() {
  const cause = Object.assign(new Error("connection terminated"), {
    code: "57P01",
  });
  return Object.assign(
    new Error(
      `Failed query: insert into users ... params: ana@loja.com,${HASH}`,
    ),
    { cause, params: ["ana@loja.com", HASH] },
  );
}

it("logs the cause of an unexpected error, never the Drizzle wrapper with its parameters, and answers 500", async () => {
  const request = new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  });
  const response = await publicPost(
    request,
    {
      limiter: createRateLimiter({ limit: 5, windowMs: 1000 }),
      schema: z.object({}),
    },
    async () => {
      throw drizzleError();
    },
  );
  expect(response.status).toBe(500);
  expect(await response.text()).not.toContain(HASH);
  const [logged] = vi.mocked(logger.error).mock.calls.at(-1)!;
  expect((logged as { err: Error }).err.message).toBe("connection terminated");
  expect(JSON.stringify(logged)).not.toContain(HASH);
});

it("does the same on the admin routes", async () => {
  vi.mocked(logger.error).mockClear();
  const { readSession } = await import("@/domains/auth/sessions");
  const { hashToken } = await import("@/domains/auth/sessions");
  vi.mocked(readSession).mockResolvedValue({
    id: "s",
    user: { id: "u", name: "Ana", email: "ana@loja.com", role: "ADMIN" },
    csrfHash: hashToken("csrf"),
    remember: false,
  });
  const request = new NextRequest("http://localhost:3000/api/x", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: "mkt_session=token",
      "x-csrf-token": "csrf",
    },
    body: JSON.stringify({}),
  });
  const response = await adminBodyRoute(request, z.object({}), async () => {
    throw drizzleError();
  });
  expect(response.status).toBe(500);
  expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain(
    HASH,
  );
});

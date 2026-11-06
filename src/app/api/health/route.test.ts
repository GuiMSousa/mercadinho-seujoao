import { expect, it, vi } from "vitest";
import { pingDatabase } from "@/infrastructure/db";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/db", () => ({ pingDatabase: vi.fn() }));

it("answers ok while the database answers, never from a cache", async () => {
  vi.mocked(pingDatabase).mockResolvedValue();
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  await expect(response.json()).resolves.toEqual({
    status: "ok",
    timestamp: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
    db: "connected",
  });
});

it("answers 503 without describing the failure when the database is unreachable", async () => {
  vi.mocked(pingDatabase).mockRejectedValue(
    Object.assign(new Error("connect ECONNREFUSED 10.0.0.5:5432 user=admin"), {
      code: "ECONNREFUSED",
    }),
  );
  const response = await GET();
  expect(response.status).toBe(503);
  const body = await response.text();
  expect(JSON.parse(body)).toMatchObject({
    status: "error",
    db: "disconnected",
  });
  expect(body).not.toMatch(/ECONNREFUSED|5432|admin/);
});

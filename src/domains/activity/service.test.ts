import { expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { insertActivity, selectActivityPage } from "./repository";
import { InvalidCursorError, listActivity, logActivity } from "./service";

vi.mock("server-only", () => ({}));
vi.mock("./repository", () => ({
  insertActivity: vi.fn(),
  selectActivityPage: vi.fn(),
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

it("never rejects when the database fails; it logs instead", async () => {
  vi.mocked(insertActivity).mockRejectedValue(new Error("db down"));
  await expect(
    logActivity({ user: { id: "u", name: "Ana" }, action: "Login" }),
  ).resolves.toBeUndefined();
  expect(logger.error).toHaveBeenCalledOnce();
});

it("rejects a cursor with a valid date but a non-UUID id before querying", async () => {
  const cursor = Buffer.from("2026-01-01T00:00:00.000Z|abc").toString(
    "base64url",
  );
  await expect(listActivity({ cursor, limit: 50 })).rejects.toBeInstanceOf(
    InvalidCursorError,
  );
  expect(selectActivityPage).not.toHaveBeenCalled();
});

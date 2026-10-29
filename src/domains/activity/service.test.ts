import { expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";
import { insertActivity } from "./repository";
import { logActivity } from "./service";

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

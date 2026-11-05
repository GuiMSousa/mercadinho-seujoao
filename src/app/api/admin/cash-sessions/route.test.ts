import { expect, it, vi } from "vitest";
import { listCashSessions } from "@/domains/cash/service";
import { callRoute } from "../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/cash/service", () => ({ listCashSessions: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/admin/cash-sessions?page=2";

it("keeps the reconciliation from anyone but an ADMIN", async () => {
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect(listCashSessions).not.toHaveBeenCalled();
});

it("answers the requested page and refuses an invalid one", async () => {
  const page = { sessions: [], total: 0, page: 1, pageSize: 20 };
  vi.mocked(listCashSessions).mockResolvedValue(page);
  const response = await callRoute(GET, { url, role: "ADMIN" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(page);
  expect(listCashSessions).toHaveBeenCalledWith({ page: 2 });
  const invalid = await callRoute(GET, {
    url: "/api/admin/cash-sessions?page=0",
    role: "ADMIN",
  });
  expect(invalid.status).toBe(400);
});

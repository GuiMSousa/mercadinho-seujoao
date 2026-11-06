import { expect, it, vi } from "vitest";
import { countStockAlerts } from "@/domains/suppliers/service";
import { callRoute } from "../../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/suppliers/service", () => ({ countStockAlerts: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

it("answers the alert count to an ADMIN only", async () => {
  vi.mocked(countStockAlerts).mockResolvedValue(4);
  const url = "/api/admin/inventory/alerts";
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  const response = await callRoute(GET, { url, role: "ADMIN" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ count: 4 });
});

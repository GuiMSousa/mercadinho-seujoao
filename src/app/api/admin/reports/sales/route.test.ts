import { expect, it, vi } from "vitest";
import { listReportSales } from "@/domains/reports/service";
import { callRoute } from "../../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/reports/service", () => ({ listReportSales: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/admin/reports/sales?period=7d&page=2";

it("keeps each sale's CMV and margin from anyone but an ADMIN", async () => {
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect(listReportSales).not.toHaveBeenCalled();
});

it("answers the requested page of the period", async () => {
  const page = {
    period: { from: "2026-10-30", to: "2026-11-05" },
    sales: [
      {
        id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b09",
        number: 12,
        createdAt: "2026-11-05T19:20:00.000Z",
        operator: "Carla",
        paymentMethod: "PIX" as const,
        total: 1500,
        cogs: 500,
        marginPercent: 66.7,
      },
    ],
    total: 21,
    page: 2,
    pageSize: 20,
  };
  vi.mocked(listReportSales).mockResolvedValue(page);
  const response = await callRoute(GET, { url, role: "ADMIN" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(page);
  expect(listReportSales).toHaveBeenCalledWith(
    expect.objectContaining({ period: "7d", page: 2 }),
  );
  const invalid = await callRoute(GET, {
    url: "/api/admin/reports/sales?page=0",
    role: "ADMIN",
  });
  expect(invalid.status).toBe(400);
});

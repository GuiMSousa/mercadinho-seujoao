import { expect, it, vi } from "vitest";
import { getFinancialReport } from "@/domains/reports/service";
import { callRoute } from "../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/reports/service", () => ({ getFinancialReport: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const report = {
  period: { from: "2026-11-01", to: "2026-11-05" },
  summary: {
    revenue: 6372,
    cogs: 3680,
    grossProfit: 2692,
    marginPercent: 42.2,
    averageTicket: 2124,
    salesCount: 3,
    itemsSold: 9,
  },
  payments: [{ method: "CASH" as const, count: 3, total: 6372, percent: 100 }],
  top: { byQuantity: [], byRevenue: [], byProfit: [] },
};

it("keeps revenue, CMV and margins from anyone but an ADMIN", async () => {
  const url = "/api/admin/reports?period=month";
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect(getFinancialReport).not.toHaveBeenCalled();
});

it("answers the period's report", async () => {
  vi.mocked(getFinancialReport).mockResolvedValue(report);
  const response = await callRoute(GET, {
    url: "/api/admin/reports?period=month",
    role: "ADMIN",
  });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(report);
  expect(getFinancialReport).toHaveBeenCalledWith(
    expect.objectContaining({ period: "month" }),
  );
});

it("refuses an unknown period and an incomplete or reversed custom one", async () => {
  for (const query of [
    "period=week",
    "period=custom&from=2026-11-01",
    "period=custom&from=2026-11-05&to=2026-11-01",
    "period=custom&from=2026-02-30&to=2026-03-01",
  ]) {
    const response = await callRoute(GET, {
      url: `/api/admin/reports?${query}`,
      role: "ADMIN",
    });
    expect(response.status, query).toBe(400);
  }
  expect(getFinancialReport).not.toHaveBeenCalled();
});

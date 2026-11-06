import { expect, it, vi } from "vitest";
import { getReplenishment } from "@/domains/suppliers/service";
import { callRoute } from "../../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/suppliers/service", () => ({ getReplenishment: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/admin/inventory/replenishment";

it("keeps the replenishment list from anyone but an ADMIN", async () => {
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect(getReplenishment).not.toHaveBeenCalled();
});

it("answers the groups", async () => {
  const replenishment = {
    groups: [
      {
        supplier: null,
        items: [
          {
            productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b31",
            barcode: "789",
            name: "Arroz",
            unit: "UN" as const,
            stock: 2,
            minStock: 5,
            suggested: 8,
            nearestExpiration: null,
            daysLeft: null,
            signal: "yellow" as const,
            supplierCode: "",
          },
        ],
      },
    ],
  };
  vi.mocked(getReplenishment).mockResolvedValue(replenishment);
  const response = await callRoute(GET, { url, role: "ADMIN" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(replenishment);
});

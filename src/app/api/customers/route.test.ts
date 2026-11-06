import { expect, it, vi } from "vitest";
import { findCustomerOptions } from "@/domains/customers/service";
import { callRoute } from "../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/customers/service", () => ({
  findCustomerOptions: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

it("lets a CASHIER pick a fiado customer, without document or phone", async () => {
  vi.mocked(findCustomerOptions).mockResolvedValue({
    customers: [
      {
        id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b30",
        name: "Dona Maria",
        creditLimit: 20000,
        currentDebt: 3000,
        // A leak in the service must not reach the sale screen.
        document: "52998224725",
      } as never,
    ],
  });
  const url = "/api/customers?search=maria";
  expect((await callRoute(GET, { url })).status).toBe(401);
  const response = await callRoute(GET, { url, role: "CASHIER" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    customers: [
      {
        id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b30",
        name: "Dona Maria",
        creditLimit: 20000,
        currentDebt: 3000,
      },
    ],
  });
  expect(findCustomerOptions).toHaveBeenCalledWith("maria");
});

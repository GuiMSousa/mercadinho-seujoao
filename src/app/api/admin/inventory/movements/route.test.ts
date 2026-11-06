import { expect, it, vi } from "vitest";
import { listMovements } from "@/domains/inventory/history";
import { callRoute } from "../../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/history", () => ({ listMovements: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const get = (query: string, role?: "ADMIN" | "CASHIER") =>
  callRoute(GET, { url: `/api/admin/inventory/movements?${query}`, role });

it("lists the movements for an ADMIN, with empty filters meaning none", async () => {
  vi.mocked(listMovements).mockResolvedValue({
    movements: [],
    total: 0,
    page: 1,
    pageSize: 20,
  });
  const response = await get(
    "search=cafe&type=&from=2026-11-01&to=&page=2",
    "ADMIN",
  );
  expect(response.status).toBe(200);
  expect(listMovements).toHaveBeenCalledWith({
    search: "cafe",
    type: undefined,
    from: "2026-11-01",
    to: undefined,
    page: 2,
  });
});

it("keeps the history from a CASHIER and refuses bad filters", async () => {
  vi.mocked(listMovements).mockClear();
  expect((await get("page=1")).status).toBe(401);
  expect((await get("page=1", "CASHIER")).status).toBe(403);
  for (const query of [
    "type=SALE",
    "from=10/11/2026",
    "from=2026-11-10&to=2026-11-01",
  ])
    expect((await get(query, "ADMIN")).status, query).toBe(400);
  expect(listMovements).not.toHaveBeenCalled();
});

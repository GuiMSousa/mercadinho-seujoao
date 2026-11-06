import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { importProducts } from "@/domains/inventory/product-import";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/product-import", () => ({
  importProducts: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const post = (body: unknown, role: "ADMIN" | "CASHIER" = "ADMIN") =>
  callRoute(POST, {
    url: "/api/admin/products/import",
    method: "POST",
    role,
    body,
  });

it("imports an ADMIN's file in their name", async () => {
  vi.mocked(importProducts).mockResolvedValue({
    inserted: 2,
    updated: 1,
    categoriesCreated: 0,
  });
  const response = await post({ csv: "nome;...\nCafé;..." });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    inserted: 2,
    updated: 1,
    categoriesCreated: 0,
  });
  expect(importProducts).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    "nome;...\nCafé;...",
  );
});

it("refuses a CASHIER, an empty or oversized file, and passes the line errors on", async () => {
  vi.mocked(importProducts).mockReset();
  expect((await post({ csv: "x" }, "CASHIER")).status).toBe(403);
  expect((await post({ csv: "" })).status).toBe(422);
  expect((await post({ csv: "x".repeat(2_000_001) })).status).toBe(422);
  expect(importProducts).not.toHaveBeenCalled();
  vi.mocked(importProducts).mockRejectedValue(
    new ServiceError(422, "Nenhum produto foi importado.", {
      fields: { "3": "Informe o nome." },
    }),
  );
  const response = await post({ csv: "x" });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { "3": "Informe o nome." },
  });
});

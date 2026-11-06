import { expect, it, vi } from "vitest";
import { updateSupplier } from "@/domains/suppliers/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/suppliers/service", () => ({ updateSupplier: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const id = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b30";
const patch = (
  body: unknown,
  supplierId = id,
  role: "ADMIN" | "CASHIER" = "ADMIN",
) =>
  callRoute(
    PATCH,
    {
      url: `/api/admin/suppliers/${supplierId}`,
      method: "PATCH",
      role,
      body,
    },
    { params: Promise.resolve({ id: supplierId }) },
  );

it("deactivates a supplier for an ADMIN, sending only what changed", async () => {
  vi.mocked(updateSupplier).mockResolvedValue({
    id,
    name: "Sul",
    document: "",
    phone: "",
    email: "",
    contactPerson: "",
    active: false,
  });
  const response = await patch({ active: false });
  expect(response.status).toBe(200);
  expect(updateSupplier).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    id,
    { active: false },
  );
});

it("refuses a CASHIER, an empty change and a malformed id", async () => {
  expect((await patch({ active: false }, id, "CASHIER")).status).toBe(403);
  expect((await patch({})).status).toBe(422);
  expect((await patch({ name: "Sul" }, "nao-e-uuid")).status).toBe(404);
  expect(updateSupplier).not.toHaveBeenCalled();
});

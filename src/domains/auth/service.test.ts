import { beforeEach, expect, it, vi } from "vitest";
import { hashPassword } from "./password";
import { findUserByEmail } from "./repository";
import { authenticate } from "./service";

vi.mock("server-only", () => ({}));
vi.mock("./repository");

let passwordHash: string;
const stored = (overrides: Record<string, unknown> = {}) => ({
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Ana",
  email: "ana@loja.com",
  role: "ADMIN" as const,
  active: true,
  passwordHash,
  ...overrides,
});

beforeEach(async () => {
  vi.resetAllMocks();
  passwordHash ??= await hashPassword("senha1234");
});

it("returns the user for the right password", async () => {
  vi.mocked(findUserByEmail).mockResolvedValue(stored());
  await expect(authenticate("ana@loja.com", "senha1234")).resolves.toEqual({
    ok: true,
    user: {
      id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
      name: "Ana",
      email: "ana@loja.com",
      role: "ADMIN",
    },
  });
});

it("reports invalid for a wrong password or an unknown e-mail", async () => {
  vi.mocked(findUserByEmail).mockResolvedValue(stored());
  await expect(authenticate("ana@loja.com", "outra1234")).resolves.toEqual({
    ok: false,
    reason: "invalid",
  });
  vi.mocked(findUserByEmail).mockResolvedValue(undefined as never);
  await expect(authenticate("x@loja.com", "senha1234")).resolves.toEqual({
    ok: false,
    reason: "invalid",
  });
});

it("reports no_password for an invited user that has not set one", async () => {
  vi.mocked(findUserByEmail).mockResolvedValue(stored({ passwordHash: null }));
  await expect(authenticate("ana@loja.com", "senha1234")).resolves.toEqual({
    ok: false,
    reason: "no_password",
  });
});

it("tells inactive and non-admin users apart only after the password is right", async () => {
  vi.mocked(findUserByEmail).mockResolvedValue(stored({ active: false }));
  await expect(authenticate("ana@loja.com", "senha1234")).resolves.toEqual({
    ok: false,
    reason: "inactive",
  });
  await expect(authenticate("ana@loja.com", "errada123")).resolves.toEqual({
    ok: false,
    reason: "invalid",
  });
  vi.mocked(findUserByEmail).mockResolvedValue(stored({ role: "CASHIER" }));
  await expect(authenticate("ana@loja.com", "senha1234")).resolves.toEqual({
    ok: false,
    reason: "not_admin",
  });
  await expect(authenticate("ana@loja.com", "errada123")).resolves.toEqual({
    ok: false,
    reason: "invalid",
  });
});

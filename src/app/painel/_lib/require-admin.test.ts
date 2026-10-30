import { beforeEach, expect, it, vi } from "vitest";
import { readSession } from "@/domains/auth/sessions";
import { requireAdmin } from "./require-admin";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));
vi.mock("@/domains/auth/sessions", () => ({ readSession: vi.fn() }));

const session = (role: "ADMIN" | "CASHIER") =>
  ({ id: "s", user: { role } }) as Awaited<ReturnType<typeof readSession>>;

beforeEach(() => vi.mocked(readSession).mockReset());

it("returns the session of an ADMIN", async () => {
  vi.mocked(readSession).mockResolvedValue(session("ADMIN"));
  await expect(requireAdmin()).resolves.toMatchObject({ id: "s" });
  expect(readSession).toHaveBeenCalledWith("token");
});

it("redirects to /login without a session and for a CASHIER", async () => {
  vi.mocked(readSession).mockResolvedValue(null);
  await expect(requireAdmin()).rejects.toThrow("redirect:/login");
  vi.mocked(readSession).mockResolvedValue(session("CASHIER"));
  await expect(requireAdmin()).rejects.toThrow("redirect:/login");
});

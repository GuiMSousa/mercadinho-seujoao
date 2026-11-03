import { beforeEach, expect, it, vi } from "vitest";
import { readSession } from "@/domains/auth/sessions";
import { Landing } from "./_landing/landing";
import Home from "./page";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));
vi.mock("./theme", () => ({ getTheme: async () => "light" }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const as = (role?: "ADMIN" | "CASHIER") =>
  vi
    .mocked(readSession)
    .mockResolvedValue(
      role
        ? ({ user: { role } } as Awaited<ReturnType<typeof readSession>>)
        : null,
    );

beforeEach(() => vi.mocked(readSession).mockReset());

it("sends an ADMIN to the panel and shows the landing to everyone else", async () => {
  as("ADMIN");
  await expect(Home()).rejects.toThrow("redirect:/painel");
  as("CASHIER");
  expect((await Home()).type).toBe(Landing);
  as();
  expect((await Home()).type).toBe(Landing);
});

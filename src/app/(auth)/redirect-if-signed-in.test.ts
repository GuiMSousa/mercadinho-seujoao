import { beforeEach, expect, it, vi } from "vitest";
import { readSession } from "@/domains/auth/sessions";
import { redirectIfSignedIn } from "./redirect-if-signed-in";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "token" }) }),
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

beforeEach(() => vi.mocked(readSession).mockReset());

it("sends a signed-in ADMIN to the panel", async () => {
  vi.mocked(readSession).mockResolvedValue({
    user: { role: "ADMIN" },
  } as Awaited<ReturnType<typeof readSession>>);
  await expect(redirectIfSignedIn()).rejects.toThrow("redirect:/painel");
});

it("leaves signed-out visitors and a CASHIER on the auth screen", async () => {
  vi.mocked(readSession).mockResolvedValue(null);
  await expect(redirectIfSignedIn()).resolves.toBeUndefined();
  vi.mocked(readSession).mockResolvedValue({
    user: { role: "CASHIER" },
  } as Awaited<ReturnType<typeof readSession>>);
  await expect(redirectIfSignedIn()).resolves.toBeUndefined();
});

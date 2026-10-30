import { isValidElement } from "react";
import { expect, it, vi } from "vitest";
import { getStore } from "@/domains/store/service";
import { readSession } from "@/domains/auth/sessions";
import SettingsPage, { NoStore } from "./page";

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
vi.mock("@/domains/store/service", () => ({ getStore: vi.fn() }));
vi.mock("../../theme", () => ({ getTheme: async () => "light" }));

it("shows the create-the-store guidance instead of a 404 when there is no store", async () => {
  vi.mocked(readSession).mockResolvedValue({
    user: { email: "ana@loja.com", role: "ADMIN" },
  } as Awaited<ReturnType<typeof readSession>>);
  vi.mocked(getStore).mockResolvedValue(undefined);
  const page = await SettingsPage();
  expect(isValidElement(page)).toBe(true);
  expect((page as { type: unknown }).type).toBe(NoStore);
  expect(JSON.stringify(NoStore())).toContain(
    "Cadastre os dados da loja para continuar.",
  );
});

it("redirects to /login without a session or for a CASHIER, before reading the store", async () => {
  vi.mocked(getStore).mockClear();
  vi.mocked(readSession).mockResolvedValue(null);
  await expect(SettingsPage()).rejects.toThrow("redirect:/login");
  vi.mocked(readSession).mockResolvedValue({
    user: { email: "caixa@loja.com", role: "CASHIER" },
  } as Awaited<ReturnType<typeof readSession>>);
  await expect(SettingsPage()).rejects.toThrow("redirect:/login");
  expect(getStore).not.toHaveBeenCalled();
});

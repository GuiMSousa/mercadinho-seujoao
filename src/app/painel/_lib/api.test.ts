import { afterEach, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

const location = { href: "/painel" };
vi.stubGlobal("document", { cookie: "mkt_csrf=tok%20en" });
vi.stubGlobal("window", { location });

afterEach(() => {
  location.href = "/painel";
  vi.unstubAllGlobals();
  vi.stubGlobal("document", { cookie: "mkt_csrf=tok%20en" });
  vi.stubGlobal("window", { location });
});

const respond = (status: number, body: unknown) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(body, { status })),
  );

it("sends the CSRF header and JSON body, and keeps the page on success", async () => {
  respond(200, { ok: true });
  const result = await apiFetch("/api/x", { method: "POST", body: { a: 1 } });
  expect(result.ok).toBe(true);
  const [, init] = vi.mocked(fetch).mock.calls[0]!;
  expect(init?.headers).toMatchObject({
    "content-type": "application/json",
    "x-csrf-token": "tok en",
  });
  expect(location.href).toBe("/painel");
});

it("sends the person to the login on 401 and still returns the failure", async () => {
  respond(401, { error: "Faça login para continuar." });
  const result = await apiFetch("/api/x", { method: "POST" });
  expect(location.href).toBe("/login");
  expect(result).toMatchObject({ ok: false, status: 401 });
});

it("does not redirect on other failures", async () => {
  respond(409, { error: "Conflito." });
  await apiFetch("/api/x", { method: "POST" });
  expect(location.href).toBe("/painel");
});

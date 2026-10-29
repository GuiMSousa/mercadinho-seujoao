import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { THEME_COOKIE } from "@/contracts/theme";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new NextRequest("http://localhost:3000/api/theme", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

it.each(["light", "dark"])(
  "saves %s in a one-year HTTP-only cookie for anonymous callers",
  async (theme) => {
    const response = await post({ theme });
    expect(response.status).toBe(204);
    const cookie = response.cookies.get(THEME_COOKIE);
    expect(cookie).toMatchObject({
      value: theme,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 31_536_000,
    });
    expect(cookie?.secure).toBeFalsy();
  },
);

it("marks the cookie Secure behind HTTPS", async () => {
  const response = await post(
    { theme: "dark" },
    { "x-forwarded-proto": "https" },
  );
  expect(response.cookies.get(THEME_COOKIE)?.secure).toBe(true);
});

it("deletes the cookie for system", async () => {
  const response = await post({ theme: "system" });
  expect(response.status).toBe(204);
  const cookie = response.cookies.get(THEME_COOKIE);
  expect(cookie?.value).toBe("");
  expect(cookie?.expires).toEqual(new Date(0));
});

it("rejects unknown themes and unreadable bodies with 400 and no cookie", async () => {
  for (const body of [{ theme: "sepia" }, {}, "not json"]) {
    const response = await post(body);
    expect(response.status).toBe(400);
    expect(response.cookies.get(THEME_COOKIE)).toBeUndefined();
  }
});

it("refuses a cross-site origin", async () => {
  const response = await post(
    { theme: "dark" },
    { origin: "https://evil.example" },
  );
  expect(response.status).toBe(403);
  expect(response.cookies.get(THEME_COOKIE)).toBeUndefined();
});

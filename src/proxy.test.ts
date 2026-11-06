import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { config, proxy } from "./proxy";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

async function request(
  pathname: string,
  role?: "ADMIN" | "CASHIER",
  method = "GET",
) {
  const headers = new Headers();
  if (role) {
    vi.mocked(readSession).mockResolvedValue({
      id: "hashed-id",
      user: {
        id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
        name: role,
        email: `${role.toLowerCase()}@example.com`,
        role,
      },
      csrfHash: "hash",
      remember: false,
    });
    headers.set("cookie", `${SESSION_COOKIE}=token`);
  } else {
    vi.mocked(readSession).mockResolvedValue(null);
  }
  return proxy(
    new NextRequest(`http://localhost:3000${pathname}`, { headers, method }),
  );
}

it("blocks a CASHIER on ADMIN-only API routes and sends the pages to the sale screen", async () => {
  const api = await request("/api/admin/users", "CASHIER");
  expect(api.status).toBe(403);
  await expect(api.json()).resolves.toEqual({ error: "Acesso negado." });
  const page = await request("/painel/produtos", "CASHIER");
  expect(page.status).toBe(307);
  expect(page.headers.get("location")).toBe("http://localhost:3000/caixa");
  // A refused POST is not bounced to another page.
  expect((await request("/painel/produtos", "CASHIER", "POST")).status).toBe(
    403,
  );
});

it("opens the sale screen to both profiles", async () => {
  for (const role of ["ADMIN", "CASHIER"] as const)
    expect(
      (await request("/caixa", role)).headers.get("x-middleware-next"),
    ).toBe("1");
  expect((await request("/caixa")).headers.get("location")).toBe(
    "http://localhost:3000/login",
  );
});

it("reads the session cookie on page navigation after login", async () => {
  const response = await request("/vendas", "CASHIER");
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(readSession).toHaveBeenCalledWith("token");
});

it("lets an ADMIN through to ADMIN-only routes", async () => {
  for (const pathname of ["/api/admin/users", "/painel"]) {
    const response = await request(pathname, "ADMIN");
    expect(response.headers.get("x-middleware-next")).toBe("1");
  }
});

it("routes the home path by session", async () => {
  const admin = await request("/", "ADMIN");
  expect(admin.status).toBe(307);
  expect(admin.headers.get("location")).toBe("http://localhost:3000/painel");

  const anonymous = await request("/");
  expect(anonymous.headers.get("x-middleware-next")).toBe("1");

  const cashier = await request("/", "CASHIER");
  expect(cashier.status).toBe(307);
  expect(cashier.headers.get("location")).toBe("http://localhost:3000/caixa");
});

it("sends anonymous visitors to the login page and anonymous API calls a 401", async () => {
  const page = await request("/painel");
  expect(page.status).toBe(307);
  expect(page.headers.get("location")).toBe("http://localhost:3000/login");
  expect((await request("/api/admin/users")).status).toBe(401);
  for (const pathname of ["/login", "/cadastro", "/recuperar"])
    expect((await request(pathname)).headers.get("x-middleware-next")).toBe(
      "1",
    );
});

it("lets an anonymous POST /api/auth/logout reach the route so it can clear stale cookies", async () => {
  const response = await request("/api/auth/logout", undefined, "POST");
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect((await request("/api/auth/logout", undefined, "GET")).status).toBe(
    401,
  );
  expect(
    (await request("/api/account/sessions", undefined, "POST")).status,
  ).toBe(401);
});

it("re-issues both cookies for 30 days when a remembered session was renewed", async () => {
  const headers = new Headers({
    cookie: `${SESSION_COOKIE}=token; ${CSRF_COOKIE}=csrf-token`,
  });
  vi.mocked(readSession).mockResolvedValue({
    id: "hashed-id",
    user: {
      id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
      name: "Ana",
      email: "ana@example.com",
      role: "CASHIER",
    },
    csrfHash: "hash",
    remember: true,
    renewed: true,
  });
  const response = await proxy(
    new NextRequest("http://localhost:3000/vendas", { headers }),
  );
  expect(response.headers.get("x-middleware-next")).toBe("1");
  expect(response.cookies.get(SESSION_COOKIE)).toMatchObject({
    value: "token",
    maxAge: 2_592_000,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  expect(response.cookies.get(CSRF_COOKIE)).toMatchObject({
    value: "csrf-token",
    maxAge: 2_592_000,
    httpOnly: false,
  });
});

it("leaves the cookies alone when the session was not renewed", async () => {
  const response = await request("/vendas", "CASHIER");
  expect(response.cookies.getAll()).toEqual([]);
});

it("runs on pages and API routes but skips build assets and files with an extension", () => {
  // Next compiles the matcher as a path pattern; anchoring the same string as a RegExp is equivalent here.
  const matcher = new RegExp(`^${config.matcher[0]}$`);
  for (const path of ["/", "/painel", "/api/admin/users", "/login", "/vendas"])
    expect(matcher.test(path), path).toBe(true);
  for (const path of ["/favicon.ico", "/_next/static/x.js", "/_next/image"])
    expect(matcher.test(path), path).toBe(false);
});

it("puts a CSP with a fresh nonce on pages, and hands it to Next.js with the request", async () => {
  const first = await request("/login");
  const second = await request("/login");
  const policy = first.headers.get("content-security-policy") ?? "";
  expect(policy).toMatch(
    /script-src 'self' 'nonce-[A-Za-z0-9+/]+=*' 'strict-dynamic'/,
  );
  expect(second.headers.get("content-security-policy")).not.toBe(policy);
  // NextResponse.next({ request }) forwards overridden request headers this way.
  expect(
    first.headers.get("x-middleware-request-content-security-policy"),
  ).toBe(policy);
  // Redirects and refusals of pages carry it too; API answers are JSON and need none.
  expect(
    (await request("/painel")).headers.get("content-security-policy"),
  ).toMatch(/nonce-/);
  expect(
    (await request("/api/health")).headers.get("content-security-policy"),
  ).toBeNull();
});

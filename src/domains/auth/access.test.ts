import { expect, it } from "vitest";
import { accessDenial, type AccessRequest } from "./access";

const cashier = {
  id: "u1",
  username: "caixa",
  role: "CASHIER",
  csrf: "t",
} as const;
const admin = { ...cashier, username: "dono", role: "ADMIN" } as const;
const base: AccessRequest = {
  pathname: "/api/admin/users",
  method: "GET",
  session: null,
  csrfHeader: null,
  origin: null,
  host: "localhost:3000",
};
const deny = (overrides: Partial<AccessRequest>) =>
  accessDenial({ ...base, ...overrides });

it("refuses CASHIER on ADMIN-only pages and APIs and allows ADMIN", () => {
  for (const pathname of [
    "/admin",
    "/admin/usuarios",
    "/api/admin",
    "/api/admin/users",
  ]) {
    expect(deny({ pathname, session: cashier })).toBe(403);
    expect(deny({ pathname, session: admin })).toBeNull();
  }
  expect(deny({ pathname: "/administrativo", session: cashier })).toBeNull();
});

it("requires a session everywhere except the public paths", () => {
  expect(deny({ pathname: "/api/admin/users" })).toBe(401);
  expect(deny({ pathname: "/vendas" })).toBe(401);
  for (const pathname of ["/", "/login", "/design-system"])
    expect(deny({ pathname })).toBeNull();
  expect(deny({ pathname: "/design-system/x" })).toBe(401);
  expect(deny({ pathname: "/api/auth/login", method: "POST" })).toBeNull();
});

it("requires the CSRF header on authenticated mutations", () => {
  const logout = {
    pathname: "/api/auth/logout",
    method: "POST",
    session: cashier,
  };
  expect(deny(logout)).toBe(403);
  expect(deny({ ...logout, csrfHeader: "wrong" })).toBe(403);
  expect(deny({ ...logout, csrfHeader: "t" })).toBeNull();
});

it("refuses cross-origin mutations, including the public login", () => {
  const login = { pathname: "/api/auth/login", method: "POST" };
  expect(deny({ ...login, origin: "https://evil.example" })).toBe(403);
  expect(deny({ ...login, origin: "not a url" })).toBe(403);
  expect(deny({ ...login, origin: "http://localhost:3000" })).toBeNull();
});

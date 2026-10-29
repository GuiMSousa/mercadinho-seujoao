import { expect, it } from "vitest";
import { accessDenial, type AccessRequest } from "./access";

const cashier = { role: "CASHIER" } as const;
const admin = { role: "ADMIN" } as const;
const base: AccessRequest = {
  pathname: "/api/admin/users",
  method: "GET",
  session: null,
  csrfOk: false,
  origin: null,
  host: "localhost:3000",
};
const deny = (overrides: Partial<AccessRequest>) =>
  accessDenial({ ...base, ...overrides });

it("refuses CASHIER on ADMIN-only pages and APIs and allows ADMIN", () => {
  for (const pathname of [
    "/painel",
    "/painel/usuarios",
    "/api/admin",
    "/api/admin/users",
    "/api/account/password",
    "/api/store",
  ]) {
    expect(deny({ pathname, session: cashier })).toBe(403);
    expect(deny({ pathname, session: admin })).toBeNull();
  }
  expect(deny({ pathname: "/painelx", session: cashier })).toBeNull();
});

it("requires a session everywhere except the public paths", () => {
  expect(deny({ pathname: "/api/admin/users" })).toBe(401);
  expect(deny({ pathname: "/vendas" })).toBe(401);
  for (const pathname of [
    "/",
    "/login",
    "/cadastro",
    "/recuperar",
    "/design-system",
  ])
    expect(deny({ pathname })).toBeNull();
  expect(deny({ pathname: "/design-system/x" })).toBe(401);
  for (const pathname of [
    "/api/setup",
    "/api/theme",
    "/api/auth/login",
    "/api/auth/signup",
    "/api/auth/signup/verify",
    "/api/auth/signup/resend",
    "/api/auth/password-reset",
    "/api/auth/password-reset/confirm",
  ])
    expect(deny({ pathname, method: "POST" })).toBeNull();
  expect(deny({ pathname: "/api/auth/logout", method: "POST" })).toBe(401);
});

it("requires the CSRF header on authenticated mutations", () => {
  const logout = {
    pathname: "/api/auth/logout",
    method: "POST",
    session: cashier,
  };
  expect(deny(logout)).toBe(403);
  expect(deny({ ...logout, csrfOk: true })).toBeNull();
  expect(deny({ ...logout, method: "GET" })).toBeNull();
});

it("refuses cross-origin mutations, including the public login", () => {
  const login = { pathname: "/api/auth/login", method: "POST" };
  expect(deny({ ...login, origin: "https://evil.example" })).toBe(403);
  expect(deny({ ...login, origin: "not a url" })).toBe(403);
  expect(deny({ ...login, origin: "http://localhost:3000" })).toBeNull();
});

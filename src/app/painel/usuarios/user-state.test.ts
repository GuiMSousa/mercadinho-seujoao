import { expect, it } from "vitest";
import type { UserRow } from "@/contracts/users";
import { accessStatus, userPatch } from "./user-state";

const user: UserRow = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Ana",
  email: "ana@loja.com",
  role: "ADMIN",
  active: true,
  pending: false,
  lastLoginAt: null,
};

it("sends only the fields that changed", () => {
  expect(userPatch(user, { name: "Ana", role: "ADMIN", active: true })).toEqual(
    {},
  );
  expect(
    userPatch(user, { name: " Ana Souza ", role: "ADMIN", active: true }),
  ).toEqual({ name: "Ana Souza" });
  expect(
    userPatch(user, { name: "Ana", role: "CASHIER", active: false }),
  ).toEqual({ role: "CASHIER", active: false });
});

it("shows a deactivated pending user as inactive", () => {
  expect(accessStatus({ active: false, pending: true })).toBe("inactive");
  expect(accessStatus({ active: true, pending: true })).toBe("pending");
  expect(accessStatus({ active: true, pending: false })).toBe("active");
  expect(accessStatus({ active: false, pending: false })).toBe("inactive");
});

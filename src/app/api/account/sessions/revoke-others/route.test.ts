import { expect, it, vi } from "vitest";
import { endOtherSessions } from "@/domains/users/service";
import { callRoute, SESSION_ID } from "../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/users/service", () => ({ endOtherSessions: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const post = (role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, {
    url: "/api/account/sessions/revoke-others",
    method: "POST",
    role,
    csrf,
  });

it("refuses anonymous, CASHIER and a missing CSRF token", async () => {
  expect((await post()).status).toBe(401);
  expect((await post("CASHIER")).status).toBe(403);
  expect((await post("ADMIN", false)).status).toBe(403);
  expect(endOtherSessions).not.toHaveBeenCalled();
});

it("ends the other sessions and reports how many", async () => {
  vi.mocked(endOtherSessions).mockResolvedValue(3);
  const response = await post("ADMIN");
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ revoked: 3 });
  expect(endOtherSessions).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_ID }),
  );
});

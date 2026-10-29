import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "@/contracts/auth";
import { logActivity } from "@/domains/activity/service";
import { hashToken, readSession, revokeSession } from "@/domains/auth/sessions";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
  revokeSession: vi.fn(),
}));

const authSession = {
  id: "hashed-session-id",
  user: {
    id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
    name: "Maria",
    email: "maria@example.com",
    role: "CASHIER",
  },
  csrfHash: hashToken("expected-token"),
  remember: false,
} as const;

function logout(csrfHeader?: string, withSession = true) {
  vi.mocked(readSession).mockResolvedValue(withSession ? authSession : null);
  const headers = new Headers({ cookie: `${SESSION_COOKIE}=token` });
  if (csrfHeader) headers.set(CSRF_HEADER, csrfHeader);
  return POST(
    new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers,
    }),
  );
}

it("refuses logout without the matching anti-CSRF header and keeps the session", async () => {
  expect((await logout()).status).toBe(403);
  expect((await logout("forged")).status).toBe(403);
  expect(revokeSession).not.toHaveBeenCalled();
});

it("revokes the session, clears the cookies and logs the logout with the matching header", async () => {
  const response = await logout("expected-token");
  expect(response.status).toBe(204);
  expect(revokeSession).toHaveBeenCalledWith("hashed-session-id");
  expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe("");
  expect(logActivity).toHaveBeenCalledWith({
    user: { id: authSession.user.id, name: "Maria" },
    action: "Logout",
  });
});

it("answers 401 and still clears the cookies when the session is missing or stale", async () => {
  const response = await logout("expected-token", false);
  expect(response.status).toBe(401);
  expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe("");
  expect(revokeSession).not.toHaveBeenCalled();
  expect(logActivity).not.toHaveBeenCalled();
});

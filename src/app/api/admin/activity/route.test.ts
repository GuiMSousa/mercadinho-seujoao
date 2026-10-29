import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { activityPageSchema } from "@/contracts/activity";
import { SESSION_COOKIE } from "@/contracts/auth";
import { InvalidCursorError, listActivity } from "@/domains/activity/service";
import { readSession } from "@/domains/auth/sessions";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/activity/service")>()),
  listActivity: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const ID = "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b";

async function get(role?: "ADMIN" | "CASHIER", query = "") {
  const headers = new Headers();
  if (role) {
    vi.mocked(readSession).mockResolvedValue({
      id: "hashed-id",
      user: { id: ID, name: "U", email: "u@example.com", role },
      csrfHash: "hash",
      remember: false,
    });
    headers.set("cookie", `${SESSION_COOKIE}=token`);
  } else {
    vi.mocked(readSession).mockResolvedValue(null);
  }
  return GET(
    new NextRequest(`http://localhost:3000/api/admin/activity${query}`, {
      headers,
    }),
  );
}

it("refuses anonymous with 401 and CASHIER with 403", async () => {
  expect((await get()).status).toBe(401);
  expect((await get("CASHIER")).status).toBe(403);
  expect(listActivity).not.toHaveBeenCalled();
});

it("returns a contract-valid page and forwards the cursor to an ADMIN", async () => {
  vi.mocked(listActivity).mockResolvedValue({
    items: [
      {
        id: ID,
        at: "2026-01-01T00:00:00.000Z",
        userName: "Ana",
        action: "Login",
        detail: "",
      },
    ],
    nextCursor: "abc",
  });
  const response = await get("ADMIN", "?cursor=xyz");
  expect(response.status).toBe(200);
  expect(activityPageSchema.parse(await response.json()).nextCursor).toBe(
    "abc",
  );
  expect(listActivity).toHaveBeenCalledWith({ cursor: "xyz", limit: 50 });
});

it("answers 400 for an invalid cursor", async () => {
  vi.mocked(listActivity).mockRejectedValue(new InvalidCursorError());
  expect((await get("ADMIN", "?cursor=bad")).status).toBe(400);
});

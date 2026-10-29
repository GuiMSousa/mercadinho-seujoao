import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { setupResponseSchema } from "@/contracts/auth";
import { hasStore } from "@/domains/store/service";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/store/service", () => ({ hasStore: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

it("tells anonymous callers whether the store exists", async () => {
  for (const exists of [false, true]) {
    vi.mocked(hasStore).mockResolvedValue(exists);
    const response = await GET(
      new NextRequest("http://localhost:3000/api/setup"),
    );
    expect(response.status).toBe(200);
    expect(setupResponseSchema.parse(await response.json())).toEqual({
      hasStore: exists,
    });
  }
});

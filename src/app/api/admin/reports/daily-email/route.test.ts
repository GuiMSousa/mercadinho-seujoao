import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { sendDailySummary } from "@/domains/reports/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/reports/service", () => ({ sendDailySummary: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const post = (role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, {
    url: "/api/admin/reports/daily-email",
    method: "POST",
    role,
    csrf,
  });

it("sends only for an ADMIN, with the anti-CSRF header", async () => {
  expect((await post()).status).toBe(401);
  expect((await post("CASHIER")).status).toBe(403);
  expect((await post("ADMIN", false)).status).toBe(403);
  expect(sendDailySummary).not.toHaveBeenCalled();
});

it("sends to the session's own e-mail", async () => {
  vi.mocked(sendDailySummary).mockResolvedValue({ sentTo: SESSION_USER.email });
  const response = await post("ADMIN");
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({
    sentTo: SESSION_USER.email,
  });
  expect(sendDailySummary).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id, email: SESSION_USER.email }),
  );
});

it("tells when the e-mail service failed", async () => {
  vi.mocked(sendDailySummary).mockRejectedValue(
    new ServiceError(502, "Não foi possível enviar o e-mail agora."),
  );
  const response = await post("ADMIN");
  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({
    error: "Não foi possível enviar o e-mail agora.",
  });
});

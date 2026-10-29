import { beforeEach, expect, it, vi } from "vitest";
import { verifyCode } from "./codes";
import { claimCode } from "./verification";
import { claimAttempt, latestCode } from "./verification-repository";

vi.mock("server-only", () => ({}));
vi.mock("@/infrastructure/mail", () => ({ getMailer: vi.fn() }));
vi.mock("./verification-repository");
// Hashing is slow on purpose; what matters here is how often it runs.
vi.mock("./codes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./codes")>()),
  hashCode: vi.fn().mockResolvedValue("dummy-hash"),
  verifyCode: vi.fn().mockResolvedValue(false),
}));

const NOW = new Date("2026-01-10T12:00:00Z");
const row = (overrides: Record<string, unknown> = {}) => ({
  id: "c1",
  codeHash: "stored-hash",
  attempts: 0,
  consumedAt: null,
  expiresAt: new Date(NOW.getTime() + 60_000),
  payload: { any: "thing" },
  ...overrides,
});

beforeEach(() => {
  vi.mocked(verifyCode).mockClear().mockResolvedValue(false);
});

// Unknown e-mail and locked, expired or consumed codes must cost the same hash as a real guess.
it.each([
  ["no code for the e-mail", undefined, undefined, "invalid"],
  ["a consumed code", row({ consumedAt: NOW }), undefined, "consumed"],
  [
    "an expired code",
    row({ expiresAt: new Date(NOW.getTime() - 1) }),
    undefined,
    "expired",
  ],
  ["a code out of attempts", row({ attempts: 5 }), undefined, "too_many"],
  ["a wrong guess", row(), row({ attempts: 1 }), "wrong"],
])(
  "runs exactly one hash comparison for %s",
  async (_name, latest, claimed, reason) => {
    vi.mocked(latestCode).mockResolvedValue(latest as never);
    vi.mocked(claimAttempt).mockResolvedValue(claimed as never);
    await expect(
      claimCode("signup", "ana@loja.com", "123456", NOW),
    ).resolves.toEqual({ ok: false, reason });
    expect(verifyCode).toHaveBeenCalledTimes(1);
  },
);

it("accepts the right code after one hash comparison", async () => {
  vi.mocked(latestCode).mockResolvedValue(row() as never);
  vi.mocked(claimAttempt).mockResolvedValue(row({ attempts: 1 }) as never);
  vi.mocked(verifyCode).mockResolvedValue(true);
  await expect(
    claimCode("signup", "ana@loja.com", "123456", NOW),
  ).resolves.toEqual({ ok: true, id: "c1", payload: { any: "thing" } });
  expect(verifyCode).toHaveBeenCalledTimes(1);
  expect(verifyCode).toHaveBeenCalledWith("123456", "stored-hash");
});

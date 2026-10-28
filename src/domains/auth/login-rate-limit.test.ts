import { expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./login-rate-limit";

const WINDOW = 15 * 60 * 1000;

it("allows 10 hits per window, refuses the 11th and reopens after the window", () => {
  const limiter = createRateLimiter({ limit: 10, windowMs: WINDOW });
  for (let i = 0; i < 10; i++)
    expect(limiter.hit("ip", 1_000 + i).allowed).toBe(true);
  expect(limiter.hit("ip", 2_000)).toEqual({
    allowed: false,
    retryAfterSeconds: 899,
  });
  expect(limiter.hit("other-ip", 2_000).allowed).toBe(true);
  expect(limiter.hit("ip", 1_000 + WINDOW).allowed).toBe(true);
});

it("bounds memory by evicting the least recently seen key", () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: WINDOW, maxKeys: 2 });
  limiter.hit("a", 0);
  limiter.hit("b", 1);
  limiter.hit("c", 2); // evicts "a"
  expect(limiter.hit("a", 3).allowed).toBe(true);
  expect(limiter.hit("c", 3).allowed).toBe(false);
});

it("prefers the Cloudflare client IP, then the first forwarded hop", () => {
  expect(
    clientIp(
      new Headers({
        "cf-connecting-ip": "1.1.1.1",
        "x-forwarded-for": "2.2.2.2",
      }),
    ),
  ).toBe("1.1.1.1");
  expect(
    clientIp(new Headers({ "x-forwarded-for": "3.3.3.3, 10.0.0.1" })),
  ).toBe("3.3.3.3");
  expect(clientIp(new Headers())).toBe("unknown");
});

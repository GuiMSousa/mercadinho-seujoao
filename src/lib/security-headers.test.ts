import { expect, it } from "vitest";
import nextConfig from "../../next.config";

it("sends the anti-framing, no-sniff and same-origin referrer headers on every route", async () => {
  const rules = await nextConfig.headers!();
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  expect(
    Object.fromEntries(rules[0].headers.map((h) => [h.key, h.value])),
  ).toEqual({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
  });
});

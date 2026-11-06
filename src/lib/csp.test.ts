import { expect, it } from "vitest";
import { contentSecurityPolicy, newNonce } from "./csp";

const directive = (policy: string, name: string) =>
  policy.split("; ").find((part) => part.startsWith(`${name} `));

it("lets scripts run only with the response's nonce, and eval only in development", () => {
  const production = contentSecurityPolicy("abc123==", false);
  expect(directive(production, "script-src")).toBe(
    "script-src 'self' 'nonce-abc123==' 'strict-dynamic'",
  );
  expect(production).not.toContain("unsafe-eval");
  expect(directive(production, "object-src")).toBe("object-src 'none'");
  expect(directive(production, "frame-ancestors")).toBe(
    "frame-ancestors 'none'",
  );
  // Plain HTTP on the store's LAN must keep working.
  expect(production).not.toContain("upgrade-insecure-requests");
  expect(
    directive(contentSecurityPolicy("abc123==", true), "script-src"),
  ).toContain("'unsafe-eval'");
});

it("makes a new 128-bit nonce each time", () => {
  const nonces = new Set(Array.from({ length: 50 }, newNonce));
  expect(nonces.size).toBe(50);
  for (const nonce of nonces) expect(atob(nonce)).toHaveLength(16);
});

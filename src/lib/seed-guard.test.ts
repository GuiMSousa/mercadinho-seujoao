import { expect, it } from "vitest";
import { DEMO_EMAILS, DEMO_STORE_DOCUMENT, seedRefusal } from "./seed-guard";

it("allows an empty database and the demo database (idempotent re-run)", () => {
  expect(seedRefusal({ storeDocument: undefined, userEmails: [] })).toBeNull();
  expect(
    seedRefusal({
      storeDocument: DEMO_STORE_DOCUMENT,
      userEmails: [...DEMO_EMAILS],
    }),
  ).toBeNull();
  // A store with no users yet, or only some demo users, is still demo territory.
  expect(
    seedRefusal({ storeDocument: undefined, userEmails: [DEMO_EMAILS[0]] }),
  ).toBeNull();
});

it("refuses a real store, even without users", () => {
  expect(
    seedRefusal({ storeDocument: "98765432000100", userEmails: [] }),
  ).toMatch(/loja/);
});

it("refuses when any user is not a demo user", () => {
  expect(
    seedRefusal({
      storeDocument: DEMO_STORE_DOCUMENT,
      userEmails: [DEMO_EMAILS[0], "dono@mercado.com"],
    }),
  ).toMatch(/usuários/);
});

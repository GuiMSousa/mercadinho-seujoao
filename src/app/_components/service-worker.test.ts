import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

type FetchEvent = {
  request: { url: string; method: string };
  respondWith: (response: Promise<unknown>) => void;
  waitUntil: (work: Promise<unknown>) => void;
};

const ORIGIN = "https://loja.test";
const source = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");

/** Runs public/sw.js against fake browser APIs and fires one fetch event at it. */
function fire(url: string, method: string, caches: unknown, network: unknown) {
  let onFetch: ((event: FetchEvent) => void) | undefined;
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: (event: FetchEvent) => void) => {
      if (type === "fetch") onFetch = listener;
    },
  };
  runInNewContext(source, { self, caches, fetch: () => network, URL });
  let answered: Promise<unknown> | undefined;
  const work: Promise<unknown>[] = [];
  onFetch?.({
    request: { url, method },
    respondWith: (response) => {
      answered = response;
    },
    waitUntil: (promise) => work.push(promise),
  });
  return { answered, work };
}

const emptyCaches = (cache: unknown) => ({ open: async () => cache });
const unusedCache = { match: vi.fn(), put: vi.fn(), keys: vi.fn() };

it("never handles what carries session data or prices", () => {
  for (const [url, method] of [
    [`${ORIGIN}/api/admin/products`, "GET"],
    [`${ORIGIN}/api/products?barcode=1`, "GET"],
    [`${ORIGIN}/painel/produtos`, "GET"],
    [`${ORIGIN}/`, "GET"],
    [`${ORIGIN}/_next/static/a.js`, "POST"],
    ["https://outro.test/_next/static/a.js", "GET"],
  ]) {
    const { answered } = fire(url, method, emptyCaches(unusedCache), null);
    expect(answered).toBeUndefined();
  }
});

it("serves a build asset from the cache when it has it", async () => {
  const cache = { ...unusedCache, match: async () => "cached" };
  const { answered } = fire(
    `${ORIGIN}/_next/static/a.js`,
    "GET",
    emptyCaches(cache),
    "network",
  );
  await expect(answered).resolves.toBe("cached");
});

it("stores a new asset and drops the oldest beyond the limit", async () => {
  const keys = Array.from({ length: 201 }, (_, index) => `key-${index}`);
  const remove = vi.fn(async () => true);
  const cache = {
    match: async () => undefined,
    put: vi.fn(async () => undefined),
    keys: async () => keys,
    delete: remove,
  };
  const network = { ok: true, clone: () => "copy" };
  const { answered, work } = fire(
    `${ORIGIN}/_next/static/a.js`,
    "GET",
    emptyCaches(cache),
    network,
  );
  await expect(answered).resolves.toBe(network);
  await Promise.all(work);
  expect(cache.put).toHaveBeenCalledOnce();
  expect(remove.mock.calls).toEqual([["key-0"]]);
});

it("still answers from the network when the cache is broken or full", async () => {
  const broken = { open: async () => Promise.reject(new Error("corrupted")) };
  const first = fire(`${ORIGIN}/_next/static/a.js`, "GET", broken, "network");
  await expect(first.answered).resolves.toBe("network");

  const full = {
    match: async () => undefined,
    put: async () => Promise.reject(new Error("quota")),
  };
  const network = { ok: true, clone: () => "copy" };
  const second = fire(
    `${ORIGIN}/_next/static/a.js`,
    "GET",
    emptyCaches(full),
    network,
  );
  await expect(second.answered).resolves.toBe(network);
  await expect(Promise.all(second.work)).resolves.toBeDefined();
});

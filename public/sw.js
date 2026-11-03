// Enables PWA install and caches only build assets, whose names change with their content.
// HTML and API responses carry session data and prices, so they always go to the network.
const CACHE = "mkt-control-assets-v1";
// Each deploy adds new names; without a limit the old ones would stay forever.
const MAX_ENTRIES = 200;

async function store(cache, request, response) {
  await cache.put(request, response);
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, -MAX_ENTRIES).map((key) => cache.delete(key)),
  );
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const cacheable =
    event.request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/_next/static/");
  if (!cacheable) return;

  event.respondWith(
    caches
      .open(CACHE)
      .then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const response = await fetch(event.request);
        // A full cache must not cost the person the file that just arrived.
        if (response.ok)
          event.waitUntil(
            store(cache, event.request, response.clone()).catch(
              () => undefined,
            ),
          );
        return response;
      })
      // Broken cache storage must not take the whole system down with it.
      .catch(() => fetch(event.request)),
  );
});

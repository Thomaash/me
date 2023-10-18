export function initOffline() {
  // Files to cache.
  const cacheName = process.env.VITE_BUILD_COMMIT_HASH;
  const cacheURLs = ["CACHE_URLS_PLACEHOLDER"];

  // Precache assets on install to enable offline usage (old service worker is
  // still active).
  self.addEventListener("install", (event) => {
    console.info("[Service Worker] Install");
    event.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);
        console.info("[Service Worker] Caching");
        await cache.addAll(cacheURLs);
        console.info("[Service Worker] Cached");
      })(),
    );
  });

  // Wipe stale caches on activation (old service worker is inactive now).
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      (async () => {
        await Promise.all(
          (await caches.keys())
            .filter((oldCacheName) => {
              return oldCacheName !== cacheName;
            })
            .map((oldCacheName) => {
              return caches.delete(oldCacheName);
            }),
        );
      })(),
    );
  });

  // Fetching content using Service Worker.
  self.addEventListener("fetch", (event) => {
    // Cache HTTP(S) only, skip unsupported chrome-extension:// and file://…
    if (
      !(
        event.request.url.startsWith("http:") ||
        event.request.url.startsWith("https:")
      )
    ) {
      return;
    }

    event.respondWith(
      (async () => {
        const url = new URL(event.request.url);
        url.hash = "";

        const cache = await caches.open(cacheName);

        const cachedRequest = await cache.match(url);
        console.info(
          `[Service Worker] Fetching resource: ${url.href} from ${event.request.url}`,
        );

        if (cachedRequest) {
          return cachedRequest;
        }

        const response = await fetch(event.request);
        console.info(
          `[Service Worker] Caching new resource: ${url.href} from ${event.request.url}`,
        );
        cache.put(url, response.clone());

        return response;
      })(),
    );
  });
}

export function initOffline() {
  // Files to cache
  const cacheName = "me-v1";
  const cacheURLs = ["CACHE_URLS_PLACEHOLDER"];

  // Installing Service Worker
  self.addEventListener("install", (event) => {
    console.info("[Service Worker] Install");
    event.waitUntil(
      (async () => {
        const cache = await caches.open(cacheName);
        console.info("[Service Worker] Caching");
        await cache.addAll(cacheURLs);
        console.info("[Service Worker] Cached");
      })()
    );
  });

  // Fetching content using Service Worker
  self.addEventListener("fetch", (event) => {
    // Cache http and https only, skip unsupported chrome-extension:// and file://...
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

        const cachedRequest = await caches.match(url);
        console.info(
          `[Service Worker] Fetching resource: ${url.href} from ${event.request.url}`
        );

        if (cachedRequest) {
          return cachedRequest;
        }

        const response = await fetch(event.request);

        const cache = await caches.open(cacheName);
        console.info(
          `[Service Worker] Caching new resource: ${url.href} from ${event.request.url}`
        );
        cache.put(url, response.clone());

        return response;
      })()
    );
  });
}

// EduBridge service worker — installable PWA + fast repeat loads + graceful offline.
// Deliberately conservative on a shared-device school app: page HTML is NEVER
// cached (so one student's logged-in pages can't show to the next); only the
// content-hashed static assets and a static offline page are cached.

const CACHE = "edubridge-v1";
const PRECACHE = ["/offline", "/logo-no-bg.png", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle our own origin — never touch Supabase, Paystack, Google, etc.
  if (url.origin !== self.location.origin) return;

  // Full-page navigations: always try the network (fresh, authed content), and
  // only fall back to the offline page when there's no connection.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/offline")));
    return;
  }

  // Content-hashed static assets, icons, images, fonts: stale-while-revalidate.
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:png|jpg|jpeg|webp|svg|gif|ico|woff2?|ttf)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((res) => {
              if (res && res.ok) cache.put(request, res.clone());
              return res;
            })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Everything else (RSC payloads, data): network-first, no caching of dynamic data.
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

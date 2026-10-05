/* DisasterGuard service worker — offline / low-connectivity support.
   Caches: app shell, emergency guides pages, contacts data, last known alerts.
   Network-first for data APIs with cache fallback; cache-first for static assets. */

const VERSION = "disasterguard-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;
const SHELL_ASSETS = ["/", "/offline", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Emergency-critical data: alerts, shelters, guides, contacts → network-first, cached fallback
  const isEmergencyData =
    url.pathname.startsWith("/api/alerts") ||
    url.pathname.startsWith("/api/shelters") ||
    url.pathname.startsWith("/api/preparedness") ||
    url.pathname.startsWith("/api/emergency-contacts") ||
    url.pathname.startsWith("/api/notifications") ||
    url.pathname.startsWith("/dashboard/preparedness") ||
    url.pathname.startsWith("/dashboard/contacts") ||
    pathnameIsGuide(url.pathname);

  if (isEmergencyData) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              new Response(JSON.stringify({ offline: true, error: "Limited connectivity — showing last available information." }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              })
          )
        )
    );
    return;
  }

  // Static assets → cache-first
  if (/\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$/.test(url.pathname) || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Pages / other API → network-first with cache fallback; offline page for navigation
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(DATA_CACHE).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") return caches.match("/offline");
          return new Response("Offline", { status: 503 });
        })
      )
  );
});

function pathnameIsGuide(pathname) {
  return pathname.startsWith("/dashboard/preparedness/");
}

/* Push notification architecture (ready for a real push service):
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "DisasterGuard Alert", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "alert",
      data: { url: data.url || "/dashboard" },
    })
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
*/

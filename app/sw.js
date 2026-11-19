// Permite usar la app sin conexión una vez abierta (tablet / PC con la versión web)
const CACHE = "lectoescritura-v1";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
  "./fonts/andika.woff2", "./fonts/andika-bold.woff2", "./fonts/playwrite-es.woff2"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true })));
});

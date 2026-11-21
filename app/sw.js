// Permite usar la app sin conexión una vez abierta (tablet / PC con la versión web)
const CACHE = "lectoescritura-v37";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./css/estilos.css",
  "./js/banco.js", "./js/contenidos.js", "./js/trazos.js", "./js/medios.js", "./js/app.js",
  "./fonts/andika.woff2", "./fonts/andika-bold.woff2", "./fonts/playwrite-es.woff2"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Red primero (para recibir las actualizaciones), pero si la red tarda más de 4 s o falla, se usa la copia guardada
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(e.request, { ignoreSearch: true });
    const timer = setTimeout(() => fromCache().then(c => { if (c && !done) { done = true; resolve(c); } }), 4000);
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      if (!done) { done = true; clearTimeout(timer); resolve(r); }
    }).catch(() => fromCache().then(c => { if (!done) { done = true; clearTimeout(timer); resolve(c || Response.error()); } }));
  }));
});

const CACHE = "mv-gestao-v1";
const ARQUIVOS = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css?v=1",
  "js/util.js?v=1",
  "js/db.js?v=1",
  "js/ui.js?v=1",
  "js/inicio.js?v=1",
  "js/estoque.js?v=1",
  "js/agenda.js?v=1",
  "js/mandar.js?v=1",
  "js/ajustes.js?v=1",
  "js/app.js?v=1",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/logo.jpg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        const copia = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return r;
      })
      .catch(() => caches.match(e.request))
  );
});

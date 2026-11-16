const CACHE = "mv-gestao-v2";
const ARQUIVOS = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css?v=2",
  "js/util.js?v=2",
  "js/db.js?v=2",
  "js/ui.js?v=2",
  "js/inicio.js?v=2",
  "js/estoque.js?v=2",
  "js/agenda.js?v=2",
  "js/mandar.js?v=2",
  "js/ajustes.js?v=2",
  "js/app.js?v=2",
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

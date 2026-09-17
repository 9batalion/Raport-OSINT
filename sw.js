const CACHE = "argus-shell-v1.4.0-flow-fraud-presets";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./core.js",
  "./report.js",
  "./odt.js",
  "./report-template.js",
  "./report-defaults.js",
  "./fraud-presets.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./pdf-lib.min.js",
  "./fontkit.umd.min.js",
  "./DejaVuSans.ttf",
  "./DejaVuSans-Bold.ttf",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("argus-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("fetch", (e) => {
  if (
    e.request.method !== "GET" ||
    new URL(e.request.url).origin !== self.location.origin
  )
    return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request)),
  );
});

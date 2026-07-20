/*
 * sw.js — Service Worker cho PWA: đọc offline + tải nhanh.
 * Chiến lược: network-first (ưu tiên bản mới khi có mạng), fallback về cache khi offline.
 * Bài viết luôn được cập nhật khi online; khi mất mạng vẫn đọc lại được trang đã ghé.
 */
const CACHE = "hw-cache-v1";
const CORE = [
  "index.html", "blog.html", "post.html", "figures.html", "figure.html",
  "topics.html", "atlas.html", "gallery.html", "profile.html",
  "config.js", "manifest.webmanifest", "assets/icon.svg",
  "assets/css/style.css",
  "assets/js/i18n.js", "assets/js/md.js", "assets/js/store.js", "assets/js/main.js",
  "assets/js/home.js", "assets/js/blog.js", "assets/js/post.js",
  "assets/js/figures.js", "assets/js/figure.js", "assets/js/topics.js",
  "assets/js/atlas.js", "assets/js/gallery.js", "assets/js/profile.js",
  "assets/data/world.geo.json",
  "posts/index.json", "figures/index.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // ảnh/bên ngoài: để trình duyệt tự xử lý

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error()))
      )
  );
});

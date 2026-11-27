// Offline cache: the books open instantly and work without internet after the first visit.
// Bump the version number whenever you publish new chapters, so every device refreshes its copy.
const CACHE = "nitin-books-v4";
const CORE = ["./", "index.html", "books.json", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE);
    // Pre-load every chapter so the whole library reads offline from the first visit.
    try {
      const m = await (await fetch("books.json", { cache: "no-store" })).json();
      const files = m.books.flatMap(b => b.chapters.filter(x => x.file).map(x => `books/${b.id}/${x.file}`));
      await Promise.allSettled(files.map(f => c.add(f)));
    } catch (err) { /* fine: chapters will be cached as they are opened */ }
  })());
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/") || url.pathname.startsWith("/cdn-cgi/")) return;
  // stale-while-revalidate: show the cached copy now, refresh it in the background
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok && (r.type === "basic" || r.type === "cors")) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});

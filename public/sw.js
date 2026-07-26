// Minimal service worker: exists solely to satisfy install-to-home-screen
// eligibility criteria (Chrome/Android requires a registered service worker
// with a fetch handler). Offline data caching is explicitly out of scope
// for this app (see .scratch/expense-tracking-budgeting/spec.md) — this is
// a pure network passthrough, no cache storage involved.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

/* Offline support: network first, the last good copy of every page and script is kept and used when there is no network.
   The league itself is in the browser's database and never goes through here. Change V to drop the old copies after a release. */
const V = 'fbgm-hub-v1.74';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; }).catch(() => caches.match(r, { ignoreSearch: true })));
});

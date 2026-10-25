const CACHE = 'rezonans-v39';
const ASSETS = ['./', 'index.html', 'css/app.css', 'js/data.js', 'js/store.js', 'js/engine.js', 'js/ai.js', 'js/ui.js', 'js/analytics.js', 'js/studio.js', 'js/brand.js', 'js/own.js', 'js/wizard.js', 'js/generator.js', 'js/awake.js', 'js/main.js', 'manifest.webmanifest', 'assets/logos/warhead.png', 'assets/logos/melodia-emblem.png', 'assets/logos/melodia-wide.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});

const CACHE = 'cyberx-shell-v5-zero-trust';
const SHELL = [
  './', './index.html', './Command-Centre.html', './Full-Workspace.html',
  './manifest.webmanifest', './icons/cyberx-icon.svg',
  './Index/index.html', './Index/Code-Studio.html', './Index/cyberx-visual-theme.css',
  './Index/supabase-config.js', './Index/supabase-rest.js', './Index/login.js',
  './Index/Developer-Console.html', './Index/developer-console.js',
  './Index/Code-Library.html', './Index/code-library.json', './Index/Device-Security-Lab.html'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  // Always use network-first. Never cache Supabase Auth, database, or external responses.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./Index/index.html'))));
});
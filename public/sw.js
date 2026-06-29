// ============================================================
// OpsHub — Service Worker (JavaScript pur)
// ============================================================

var CACHE_NAME = 'opshub-v1'
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/vite.svg',
]

// ============================================================
// Installation
// ============================================================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// ============================================================
// Activation — nettoyage des anciens caches
// ============================================================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME })
          .map(function (name) { return caches.delete(name) })
      )
    })
  )
  self.clients.claim()
})

// ============================================================
// Fetch — network-first, fallback cache
// ============================================================
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url)

  // Ne pas intercepter les requêtes API / Supabase / HMR
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.indexOf('supabase') !== -1 ||
    url.pathname.indexOf('.hot-update.') !== -1
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        var clone = response.clone()
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone)
        })
        return response
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || new Response('Offline', { status: 503 })
        })
      })
  )
})

// ============================================================
// Message — mise à jour du badge PWA
// ============================================================
self.addEventListener('message', function (event) {
  if (!event.data || event.data.type !== 'UPDATE_BADGE') return

  var count = event.data.count || 0

  // Badging API dans le contexte Service Worker
  if (navigator.setAppBadge) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(function () {})
    } else {
      navigator.clearAppBadge().catch(function () {})
    }
  }
})

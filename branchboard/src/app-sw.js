import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache and route all files
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Handle navigation routes for SPA
let allowlist;
if (import.meta.env.DEV) {
  allowlist = [/^\/$/];
}

// Create navigation route
const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL('/'),
  { allowlist }
);
registerRoute(navigationRoute);

// Cache strategies
// Cache images with cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'branchboard-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API calls with network-first strategy (for eventual online sync)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'branchboard-api',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Cache other resources with stale-while-revalidate
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'branchboard-assets',
  })
);

// Background sync for eventual offline task management
// (This would be expanded later when adding background sync functionality)

// Install event
self.addEventListener('install', (event) => {
  console.log('Branchboard Service Worker installing...');
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Branchboard Service Worker activated!');
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Message handling for communication with the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notification click handler (for future push notifications)
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.openWindow('/')
  );
});
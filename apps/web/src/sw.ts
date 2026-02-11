// VitePWA SW + FCM background 통합

/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { createHandlerBoundToURL } from "workbox-precaching";

// Firebase (Service Worker용 entry)
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: any[];
};

// --- Workbox / PWA ---
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// SPA 네비게이션은 index.html로
const handler = createHandlerBoundToURL("/index.html");
registerRoute(new NavigationRoute(handler));

// --- Firebase Messaging (background) ---
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, async (payload) => {
  // to prevent repetitive message
  if (payload?.notification) return;

  // show only data-only message
  const title = payload?.data?.title ?? "MadMed";
  const body = payload?.data?.body ?? "Time for medication";

  await self.registration.showNotification(title, {body, 
    icon: '/pwa-192.png',
    badge: '/pwa-192.png',
    tag: 'medication-reminder',
    data: payload?.data ?? {},
  });
});

// 알림 클릭 처리/딥링크
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data?.link as string) ?? "/dashboard";
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const hadClient = allClients.length > 0;
    if (hadClient) {
      const client = allClients[0];
      await client.focus();
      client.navigate(url);
    } else {
      await self.clients.openWindow(url);
    }
  })());
});
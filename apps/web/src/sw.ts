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

onBackgroundMessage(messaging, (payload) => {
  const title = payload?.notification?.title ?? "MadMed";
  const options: NotificationOptions = {
    body: payload?.notification?.body ?? "Time for medication",
    data: payload?.data ?? {},
  };

  self.registration.showNotification(title, options);
});

// (선택) 알림 클릭 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const client = allClients[0];
      if (client) return client.focus();
      return self.clients.openWindow("/");
    })()
  );
});

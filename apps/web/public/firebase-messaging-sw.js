/* 
Vite는 public/ 안 파일을 그대로 사이트 루트(/...)로 서빙;
navigator.serviceWorker.register("/firebase-messaging-sw.js")가 동작
*/

/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyAoW4jCRU0hfWQId6xx6uPRXAzmut7D4xM",
    authDomain: "madmed-pwa.firebaseapp.com",
    projectId: "madmed-pwa",
    messagingSenderId: "313941018352",
    appId: "1:313941018352:web:93c3c656fdfa30c6ebe435",
});

const messaging = firebase.messaging();

// 백그라운드(앱이 안 떠있거나, PWA 백그라운드) 수신 시 표시
messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title ?? "MadMed";
    const options = {
        body: payload?.notification?.body ?? "Time for medication",
        data: payload?.data ?? {},
    };
    self.registration.showNotification(title, options);
});

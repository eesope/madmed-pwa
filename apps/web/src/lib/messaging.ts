// src/lib/messaging.ts
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase/firebase"; 

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export async function ensureFcmToken(params: {
  householdId: string;
  uid: string;
  vapidPublicKey: string; // Console에서 생성한 VAPID public key
}) {
  // FCM이 지원 안 되는 환경이면 조용히 패스
  if (!(await isSupported())) return { token: null as string | null, reason: "not-supported" as const };

  // 알림 권한
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return { token: null, reason: "permission-denied" as const };

  // FCM SW 등록 (중요: getToken에 registration을 넘기면 안정적)
  const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey: params.vapidPublicKey,
    serviceWorkerRegistration: swReg,
  });

  if (!token) return { token: null, reason: "no-token" as const };

  // members/{uid}에 pushTokens[]로 저장
  const memberRef = doc(db, "households", params.householdId, "members", params.uid);
  await updateDoc(memberRef, {
    pushTokens: arrayUnion(token),
    pushTokenUpdatedAt: serverTimestamp(),
  });

  return { token, reason: "ok" as const };
}

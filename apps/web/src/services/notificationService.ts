const STORAGE_KEY = "madmed.notification.permission";

export type NotificationPermissionState = NotificationPermission | "unsupported";

/** 브라우저가 Notification API를 지원하는지 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** 현재 permission 상태 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

/** (선택) 마지막으로 앱이 기록한 permission 상태 */
export function getStoredPermission(): NotificationPermissionState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return (raw as NotificationPermissionState) || null;
}

function storePermission(p: NotificationPermissionState) {
  localStorage.setItem(STORAGE_KEY, p);
}

/** 권한 요청 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    storePermission("unsupported");
    return "unsupported";
  }

  // 일부 브라우저는 Promise, 일부는 콜백 형태 지원. 최신 기준 Promise 사용.
  const result = await Notification.requestPermission();
  storePermission(result);
  return result;
}

/** 상태별 안내 문구 */
export function getPermissionHelpText(state: NotificationPermissionState): string {
  switch (state) {
    case "unsupported":
      return "This browser does not support notifications.";
    case "default":
      return "Notifications are not enabled yet. Tap the button to allow.";
    case "denied":
      return "Notifications are blocked. Please enable them in your browser/site settings.";
    case "granted":
      return "Notifications are enabled ✅";
    default:
      return "";
  }
}

// 테스트 버튼용
export async function showTestNotification(title: string, body?: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  // iOS에서 더 잘 되는 경로: ServiceWorkerRegistration.showNotification
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, body ? { body } : undefined);
      return;
    } catch {
      // fallback below
    }
  }

  // fallback (데스크탑 크롬 등)
  new Notification(title, body ? { body } : undefined);
}

// TODO 메시징 확인 후 코드 정리

import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { arrayUnion, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase/firebase";

/**
 * iOS PWA 포함 Web Push(FCM) 토큰 발급 + Firestore 저장
 * - households/{hid}/members/{uid}.pushTokens[]에 저장
 */
export async function ensureFcmToken(params: {
  householdId: string;
  uid: string;
  vapidPublicKey?: string; // 없으면 env에서 읽음
}): Promise<
  | { ok: true; token: string }
  | { ok: false; reason: "unsupported" | "permission-denied" | "no-token" | "save-failed"; error?: unknown }
> {
  // 1) 브라우저 지원 체크 (FCM 자체 지원 여부)
  const fcmSupported = await isSupported().catch(() => false);
  if (!fcmSupported) return { ok: false, reason: "unsupported" };

  // 2) 알림 권한 확보 (기존 함수 재사용)
  const permission = await requestNotificationPermission();
  if (permission !== "granted") return { ok: false, reason: "permission-denied" };

  // 3) FCM 전용 서비스워커 등록 (public/firebase-messaging-sw.js 필요)
  let swReg: ServiceWorkerRegistration;
  try {
    swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  } catch (error) {
    return { ok: false, reason: "no-token", error };
  }

  // 4) VAPID key 가져오기 (param 우선, 없으면 env)
  const vapidKey = params.vapidPublicKey ?? import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    return { ok: false, reason: "no-token", error: new Error("Missing VAPID public key") };
  }

  // 5) 토큰 발급
  const messaging = getMessaging();
  let token: string | null = null;

  try {
    token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
  } catch (error) {
    return { ok: false, reason: "no-token", error };
  }

  if (!token) return { ok: false, reason: "no-token" };

  // 6) Firestore에 저장 (members/{uid}.pushTokens[])
  try {
    const memberRef = doc(db, "households", params.householdId, "members", params.uid);
    await updateDoc(memberRef, {
      pushTokens: arrayUnion(token),
      pushTokenUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    // 여기서 실패하면 보통:
    // - members/{uid} 문서가 아직 없거나
    // - rules에서 members 업데이트가 막혀있거나
    // - householdId/uid 경로가 틀렸거나
    return { ok: false, reason: "save-failed", error };
  }

  return { ok: true, token };
}

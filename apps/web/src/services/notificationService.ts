// permission + token 발급

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


import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { arrayUnion, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseApp } from "../lib/firebase/firebase";

// ✅ foreground
export function startForegroundMessageListener(onPayload: (payload: any) => void) {
  const messaging = getMessaging(firebaseApp);
  return onMessage(messaging, (payload) => onPayload(payload));
}

type Step =
  | "start"
  | "check-supported"
  | "check-permission"
  | "request-permission"
  | "wait-sw-ready"
  | "get-token"
  | "save-token"
  | "done";

export type PushStepLog = { at: number; step: Step; ok?: boolean; detail?: string };

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e))
    );
  });
}

// ✅ 단계별 로그 버전
export async function ensureFcmTokenWithSteps(
  params: { householdId: string; uid: string; vapidPublicKey?: string },
  onLog: (log: PushStepLog) => void
): Promise<
  | { ok: true; token: string }
  | { ok: false; reason: "unsupported" | "permission-denied" | "no-token" | "save-failed"; error?: unknown }
> {
  const log = (step: Step, ok?: boolean, detail?: string) =>
    onLog({ at: Date.now(), step, ok, detail });

  log("start", true);

  try {
    const supported = await withTimeout(isSupported(), 5000, "isSupported()");
    if (!supported) return { ok: false, reason: "unsupported" };
    log("check-supported", true, "isSupported() true");
  } catch (e) {
    log("check-supported", false, String((e as any)?.message ?? e));
    return { ok: false, reason: "unsupported", error: e };
  }

  log("check-permission", true, `Notification.permission=${Notification.permission}`);
  if (Notification.permission !== "granted") {
    log("request-permission", true);
    const p = await requestNotificationPermission();
    log("request-permission", p === "granted", `result=${p}`);
    if (p !== "granted") return { ok: false, reason: "permission-denied" };
  }

  // ✅ 중요: 별도 register 하지 말고 "현재 PWA SW ready"를 사용
  let swReg: ServiceWorkerRegistration;
  try {
    log("wait-sw-ready", true, "waiting navigator.serviceWorker.ready");
    swReg = await withTimeout(navigator.serviceWorker.ready, 10000, "serviceWorker.ready");
    log("wait-sw-ready", true, `scope=${swReg.scope}`);
  } catch (e) {
    log("wait-sw-ready", false, String((e as any)?.message ?? e));
    return { ok: false, reason: "no-token", error: e };
  }

  const vapidKey = params.vapidPublicKey ?? import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return { ok: false, reason: "no-token", error: new Error("Missing VAPID public key") };

  const messaging = getMessaging(firebaseApp);

  let token: string | null = null;
  try {
    log("get-token", true, "calling getToken()");
    token = await withTimeout(
      getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg }),
      15000,
      "getToken()"
    );
    log("get-token", Boolean(token), token ? "token acquired" : "token null");
  } catch (e) {
    log("get-token", false, String((e as any)?.message ?? e));
    return { ok: false, reason: "no-token", error: e };
  }

  if (!token) return { ok: false, reason: "no-token" };

  try {
    log("save-token", true, "saving to Firestore");
    const memberRef = doc(db, "households", params.householdId, "members", params.uid);
    await withTimeout(
      updateDoc(memberRef, { pushTokens: arrayUnion(token), pushTokenUpdatedAt: serverTimestamp() }),
      8000,
      "updateDoc(members)"
    );
    log("save-token", true, "saved");
  } catch (e) {
    log("save-token", false, String((e as any)?.message ?? e));
    return { ok: false, reason: "save-failed", error: e };
  }

  log("done", true);
  return { ok: true, token };
}


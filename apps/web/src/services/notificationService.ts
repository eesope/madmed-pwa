// apps/web/src/services/notificationService.ts

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

export function showTestNotification(title: string, body?: string) {
  // 권한/지원 여부는 호출 측에서 체크해도 되지만, 여기서도 안전하게 처리
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  // 가장 단순한 테스트: 로컬 Notification
  new Notification(title, body ? { body } : undefined);
}

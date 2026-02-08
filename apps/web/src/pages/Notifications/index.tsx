import { useEffect, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import { useHouseholdId } from "../../app/householdStore";

import {
  getNotificationPermission,
  getPermissionHelpText,
  requestNotificationPermission,
  showTestNotification,
  ensureFcmTokenWithSteps,
  startForegroundMessageListener,
  type NotificationPermissionState,
  type PushStepLog,
} from "../../services/notificationService";

function badgeClass(state: NotificationPermissionState) {
  switch (state) {
    case "granted":
      return "bg-green-50 text-green-800 border-green-200";
    case "denied":
      return "bg-red-50 text-red-700 border-red-200";
    case "default":
      return "bg-yellow-50 text-yellow-800 border-yellow-200";
    case "unsupported":
      return "bg-gray-50 text-gray-700 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export function NotificationsPage() {
  const { householdId } = useHouseholdId();
  const uid = getAuth().currentUser?.uid ?? null;

  // Permission UI
  const [perm, setPerm] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [permBusy, setPermBusy] = useState(false);

  // Local test
  const [testTitle, setTestTitle] = useState("MadMed test");
  const [testBody, setTestBody] = useState("This is a local notification test (not FCM).");

  // FCM setup UI
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  const [pushLogs, setPushLogs] = useState<PushStepLog[]>([]);

  // Foreground message UI
  const [fgMsg, setFgMsg] = useState<string>("");

  // focus/visibility 때 permission 다시 sync
  useEffect(() => {
    const sync = () => setPerm(getNotificationPermission());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  // Foreground listener
  useEffect(() => {
    const unsub = startForegroundMessageListener((payload) => {
      const title = payload?.notification?.title ?? "MadMed";
      const body = payload?.notification?.body ?? "(no body)";
      setFgMsg(`${title} — ${body}`);
      console.log("FG message payload:", payload);
    });
    return () => unsub();
  }, []);

  async function onRequestPermission() {
    setPermBusy(true);
    try {
      const p = await requestNotificationPermission();
      setPerm(p);
    } finally {
      setPermBusy(false);
    }
  }

  async function onEnableFcm() {
    setPushMsg("");
    setPushLogs([]);

    if (!householdId) {
      setPushMsg("householdId가 없어요. 먼저 household를 선택/생성해야 해요.");
      return;
    }
    if (!uid) {
      setPushMsg("로그인이 아직 준비되지 않았어요. (currentUser가 null)");
      return;
    }

    setPushBusy(true);
    try {
      const res = await ensureFcmTokenWithSteps(
        { householdId, uid },
        (log) => setPushLogs((prev) => [...prev, log])
      );

      if (res.ok) {
        setPushMsg("✅ FCM 토큰 저장 완료 (Firestore: households/{hid}/members/{uid}.pushTokens)");
        console.log("FCM token:", res.token);
      } else {
        setPushMsg(
          `❌ FCM 설정 실패: ${res.reason} ${res.error ? `(${String((res.error as any)?.message ?? res.error)})` : ""}`
        );
        console.error(res.reason, res.error);
      }
    } finally {
      setPushBusy(false);
    }
  }

  const envInfo = useMemo(() => {
    const isStandalone =
      (window.matchMedia?.("(display-mode: standalone)")?.matches ?? false) ||
      ((navigator as any).standalone ?? false);

    return {
      protocol: location.protocol,
      secure: window.isSecureContext,
      standalone: isStandalone,
      hasSW: "serviceWorker" in navigator,
      hasPush: "PushManager" in window,
      permission: typeof Notification !== "undefined" ? Notification.permission : "no-Notification",
    };
  }, [perm]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Notifications Lab</h1>

      {/* Environment */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Environment</div>
        <div className="text-xs font-mono bg-gray-50 rounded-lg p-3">
          {JSON.stringify({ householdId, uid, ...envInfo }, null, 2)}
        </div>
      </div>

      {/* Permission */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">Notification Permission</div>
          <span
            className={[
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
              badgeClass(perm),
            ].join(" ")}
          >
            {perm}
          </span>
        </div>

        <div className="text-sm text-gray-700">{getPermissionHelpText(perm)}</div>

        <button
          onClick={onRequestPermission}
          disabled={permBusy || perm === "granted" || perm === "unsupported"}
          className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {perm === "granted" ? "Enabled" : permBusy ? "Requesting..." : "Enable notifications"}
        </button>
      </div>

      {/* Local notification test */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Local Notification Test (not FCM)</div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Title"
          />
          <input
            value={testBody}
            onChange={(e) => setTestBody(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Body"
          />
        </div>

        <button
          type="button"
          onClick={() => showTestNotification(testTitle, testBody)}
          disabled={perm !== "granted"}
          className="inline-flex rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          Test notification
        </button>
      </div>

      {/* FCM setup */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">FCM Setup (Token + Save + Logs)</div>

        <button
          onClick={onEnableFcm}
          disabled={pushBusy}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {pushBusy ? "Setting up..." : "Enable Push + Save Token"}
        </button>

        {pushMsg ? <div className="text-sm">{pushMsg}</div> : null}

        {pushLogs.length > 0 ? (
          <div className="rounded-lg bg-gray-50 p-3 text-xs font-mono space-y-1">
            {pushLogs.map((l, idx) => (
              <div key={idx}>
                [{new Date(l.at).toLocaleTimeString()}] {l.step}
                {typeof l.ok === "boolean" ? (l.ok ? " ✅" : " ❌") : ""}
                {l.detail ? ` — ${l.detail}` : ""}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Foreground message */}
      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Foreground Message (when app is open)</div>
        {fgMsg ? (
          <div className="text-sm">{fgMsg}</div>
        ) : (
          <div className="text-sm text-gray-500">
            (No message yet) — Firebase Console에서 “test message”를 보내면 여기에 표시돼요.
          </div>
        )}
      </div>
    </div>
  );
}

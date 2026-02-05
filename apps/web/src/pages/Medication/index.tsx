import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMedication,
  getSchedule,
  getStatus,
  markDoseTaken,
  resetTodayStatus,
  setSchedule,
} from "../../services/medService.firestore";
import type { Medication, MedicationSchedule, MedicationStatus } from "../../types/domain";

import {
  getNotificationPermission,
  getPermissionHelpText,
  requestNotificationPermission,
  showTestNotification,
  type NotificationPermissionState,
} from "../../services/notificationService";

function formatTime(ms: number | null) {
  if (!ms) return "❌";
  return new Date(ms).toLocaleTimeString();
}

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

export function MedicationPage() {
  const { medId } = useParams();
  const [med, setMed] = useState<Medication | null>(null);
  const [schedule, setScheduleState] = useState<MedicationSchedule | null>(null);
  const [status, setStatus] = useState<MedicationStatus | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Notification permission state ---
  const [perm, setPerm] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [permBusy, setPermBusy] = useState(false);

  const canRender = useMemo(() => Boolean(medId), [medId]);

  useEffect(() => {
    (async () => {
      if (!medId) return;
      const m = await getMedication(medId);
      setMed(m);

      const sc = await getSchedule(medId);
      setScheduleState(
        sc ?? {
          medId,
          morningTime: "07:30",
          eveningTime: "19:30",
          reminderMinutes: 15,
          timezone: "America/Vancouver",
        }
      );

      const st = await getStatus(medId);
      setStatus(st);
    })();
  }, [medId]);

  // 탭 전환/포커스 시 permission 상태 다시 읽기 (설정에서 바꿔왔을 때 반영)
  useEffect(() => {
    function sync() {
      setPerm(getNotificationPermission());
    }
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
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

  async function onSaveSchedule() {
    if (!schedule) return;
    setSaving(true);
    await setSchedule(schedule);
    const sc = await getSchedule(schedule.medId);
    setScheduleState(sc);
    setSaving(false);
  }

  async function onMark(slot: "morning" | "evening") {
    if (!medId) return;
    await markDoseTaken(medId, slot);
    const st = await getStatus(medId);
    setStatus(st);
  }

  async function onResetToday() {
    if (!medId) return;
    await resetTodayStatus(medId);
    const st = await getStatus(medId);
    setStatus(st);
  }

  if (!canRender) return <div className="text-sm text-gray-600">Missing medId.</div>;
  if (!med || !schedule || !status) return <div className="text-sm text-gray-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Medication</div>
        <h1 className="text-2xl font-semibold">
          {med.name}{" "}
          {med.dose ? <span className="text-gray-500 text-base">({med.dose})</span> : null}
        </h1>
      </div>

      {/* ✅ Notifications Permission UI */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">Notifications</div>
          <span className={["inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium", badgeClass(perm)].join(" ")}>
            {perm}
          </span>
        </div>

        <div className="text-sm text-gray-700">{getPermissionHelpText(perm)}</div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRequestPermission}
            disabled={permBusy || perm === "granted" || perm === "unsupported"}
            className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {perm === "granted"
              ? "Enabled"
              : permBusy
              ? "Requesting..."
              : "Enable notifications"}
          </button>

            <button
                type="button"
                onClick={() =>
                  showTestNotification(
                    "MadMed test",
                    `Test notification for ${med.name} (${schedule.morningTime}/${schedule.eveningTime})`
                  )
                }
                disabled={perm !== "granted"}
                className="inline-flex rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
              >
                Test notification
            </button>

          {perm === "denied" ? (
            <div className="text-xs text-gray-500">
              Tip: 개발자에게 연락해주세요.
            </div>
          ) : null}
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Schedule</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Morning</label>
            <input
              type="time"
              value={schedule.morningTime}
              onChange={(e) => setScheduleState({ ...schedule, morningTime: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Evening</label>
            <input
              type="time"
              value={schedule.eveningTime}
              onChange={(e) => setScheduleState({ ...schedule, eveningTime: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Reminder minutes</label>
            <input
              type="number"
              min={0}
              value={schedule.reminderMinutes}
              onChange={(e) =>
                setScheduleState({ ...schedule, reminderMinutes: Number(e.target.value || 0) })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Timezone</label>
            <input
              value={schedule.timezone}
              onChange={(e) => setScheduleState({ ...schedule, timezone: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={onSaveSchedule}
          disabled={saving}
          className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save schedule"}
        </button>
      </div>

      {/* Status */}
      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Today status</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Morning</div>
            <div className="font-mono text-sm">{formatTime(status.morningTakenAt)}</div>
            <button
              onClick={() => onMark("morning")}
              className="mt-2 rounded-lg bg-black px-3 py-2 text-sm text-white"
            >
              Mark taken
            </button>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Evening</div>
            <div className="font-mono text-sm">{formatTime(status.eveningTakenAt)}</div>
            <button
              onClick={() => onMark("evening")}
              className="mt-2 rounded-lg bg-black px-3 py-2 text-sm text-white"
            >
              Mark taken
            </button>
          </div>
        </div>

        <button onClick={onResetToday} className="text-sm underline">
          Reset today
        </button>
      </div>

      <Link className="text-sm underline" to="/dashboard">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

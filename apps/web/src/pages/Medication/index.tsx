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

function formatTime(ms: number | null) {
  if (!ms) return "❌";
  return new Date(ms).toLocaleTimeString();
}

export function MedicationPage() {
  const { medId } = useParams();
  const [med, setMed] = useState<Medication | null>(null);
  const [schedule, setScheduleState] = useState<MedicationSchedule | null>(null);
  const [status, setStatus] = useState<MedicationStatus | null>(null);
  const [saving, setSaving] = useState(false);

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

      <Link className="text-sm underline" to="/notifications">
          → Notifications 설정/테스트 하러 가기
      </Link>


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

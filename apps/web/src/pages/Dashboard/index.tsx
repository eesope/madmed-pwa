// 오늘 아침/저녁 투약 상태 카드
// 펫 리스트

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPets, listMedications, getStatus, markDoseTaken } from "../../services/medService";
import type { Medication, Pet } from "../../types/domain";

export function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [statusText, setStatusText] = useState<string>("");

  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);

      if (p[0]) {
        const m = await listMedications(p[0].id);
        setMeds(m);

        if (m[0]) {
          const s = await getStatus(m[0].id);
          setStatusText(
            `morning: ${s.morningTakenAt ? new Date(s.morningTakenAt).toLocaleTimeString() : "❌"} / ` +
              `evening: ${s.eveningTakenAt ? new Date(s.eveningTakenAt).toLocaleTimeString() : "❌"}`
          );
        }
      }
    })();
  }, []);

  async function onMarkMorning() {
    if (!meds[0]) return;
    await markDoseTaken(meds[0].id, "morning");
    const s = await getStatus(meds[0].id);
    setStatusText(
      `morning: ${s.morningTakenAt ? new Date(s.morningTakenAt).toLocaleTimeString() : "❌"} / ` +
        `evening: ${s.eveningTakenAt ? new Date(s.eveningTakenAt).toLocaleTimeString() : "❌"}`
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Today status</div>
        <div className="font-mono text-sm">{statusText || "Loading..."}</div>

        <button
          onClick={onMarkMorning}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white"
        >
          Mark Morning Taken
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Pets</div>
        {pets.map((p) => (
          <div key={p.id} className="flex items-center justify-between">
            <div className="font-medium">{p.name}</div>
            <Link className="text-sm underline" to={`/pets/${p.id}`}>
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

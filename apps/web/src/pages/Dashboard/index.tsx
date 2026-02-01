import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listPets, listMedications, getStatus, markDoseTaken } from "../../services/medService";
import type { Medication, MedicationStatus, Pet } from "../../types/domain";

function formatTime(ms: number | null) {
  if (!ms) return "❌";
  return new Date(ms).toLocaleTimeString();
}

export function DashboardPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedMedId, setSelectedMedId] = useState<string>("");

  const [status, setStatus] = useState<MedicationStatus | null>(null);

  const selectedMed = useMemo(
    () => meds.find((m) => m.id === selectedMedId) ?? null,
    [meds, selectedMedId]
  );

  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);
      if (p[0]) setSelectedPetId(p[0].id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedPetId) {
        setMeds([]);
        setSelectedMedId("");
        setStatus(null);
        return;
      }
      const m = await listMedications(selectedPetId);
      setMeds(m);
      if (m[0]) setSelectedMedId(m[0].id);
      else {
        setSelectedMedId("");
        setStatus(null);
      }
    })();
  }, [selectedPetId]);

  useEffect(() => {
    (async () => {
      if (!selectedMedId) {
        setStatus(null);
        return;
      }
      const s = await getStatus(selectedMedId);
      setStatus(s);
    })();
  }, [selectedMedId]);

  async function onMark(slot: "morning" | "evening") {
    if (!selectedMedId) return;
    await markDoseTaken(selectedMedId, slot);
    const s = await getStatus(selectedMedId);
    setStatus(s);
  }

  const statusText = useMemo(() => {
    if (!status) return "";
    return `morning: ${formatTime(status.morningTakenAt)} / evening: ${formatTime(status.eveningTakenAt)}`;
  }, [status]);

  const morningDone = Boolean(status?.morningTakenAt);
  const eveningDone = Boolean(status?.eveningTakenAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Today status</div>

        {selectedMed ? (
          <>
            <div className="text-sm">
              Selected: <span className="font-medium">{selectedMed.name}</span>
              {selectedMed.dose ? <span className="text-gray-500"> ({selectedMed.dose})</span> : null}
              {" · "}
              <Link className="underline text-sm" to={`/meds/${selectedMed.id}`}>
                Open
              </Link>
            </div>

            <div className="font-mono text-sm">{status ? statusText : "Loading..."}</div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onMark("morning")}
                disabled={!status || morningDone}
                className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {morningDone ? "Morning ✓" : "Mark Morning"}
              </button>

              <button
                onClick={() => onMark("evening")}
                disabled={!status || eveningDone}
                className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {eveningDone ? "Evening ✓" : "Mark Evening"}
              </button>
            </div>

            {morningDone && eveningDone ? (
              <div className="text-sm text-green-700">All done for today ✅</div>
            ) : (
              <div className="text-xs text-gray-500">
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500">No medication found for this pet (mock).</div>
        )}
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Select pet</div>

        <select
          value={selectedPetId}
          onChange={(e) => setSelectedPetId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        >
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {pets.length > 0 ? (
          <Link className="text-sm underline" to={`/pets/${selectedPetId}`}>
            View pet details
          </Link>
        ) : null}
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Medications</div>

        {meds.length === 0 ? (
          <div className="text-sm text-gray-500">No meds yet (mock).</div>
        ) : (
          meds.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{m.name}</div>
                {m.dose ? <div className="text-xs text-gray-500">{m.dose}</div> : null}
              </div>
              <Link className="text-sm underline" to={`/meds/${m.id}`}>
                Open
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

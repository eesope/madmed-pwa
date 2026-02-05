import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addMedication, getPet, listMedications } from "../../services/medService.firestore";
import type { Medication, Pet } from "../../types/domain";

export function PetPage() {
  const { petId } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState<Pet | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMedName, setNewMedName] = useState("");
  const [newMedDose, setNewMedDose] = useState("");
  const [adding, setAdding] = useState(false);

  const canRender = useMemo(() => Boolean(petId), [petId]);

  async function refresh() {
    if (!petId) return;
    setLoading(true);
    const p = await getPet(petId);
    setPet(p);
    if (p) {
      const m = await listMedications(p.id);
      setMeds(m);
    } else {
      setMeds([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function onAddMedication() {
    if (!petId) return;
    const name = newMedName.trim();
    if (!name) return;

    setAdding(true);
    try {
      const created = await addMedication({
        petId,
        name,
        dose: newMedDose.trim() || undefined,
      });

      setNewMedName("");
      setNewMedDose("");

      await refresh();

      // UX: 추가 후 바로 Medication 상세로 이동
      navigate(`/meds/${created.id}`);
    } finally {
      setAdding(false);
    }
  }

  if (!canRender) return <div className="text-sm text-gray-600">Missing petId.</div>;
  if (loading) return <div className="text-sm text-gray-600">Loading...</div>;
  if (!pet) return <div className="text-sm text-gray-600">Pet not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Pet</div>
        <h1 className="text-2xl font-semibold">{pet.name}</h1>
      </div>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Add medication</div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={newMedName}
            onChange={(e) => setNewMedName(e.target.value)}
            placeholder="Medication name (e.g. Felimazole)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            value={newMedDose}
            onChange={(e) => setNewMedDose(e.target.value)}
            placeholder='Dose (optional) e.g. "2.5mg"'
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <button
          onClick={onAddMedication}
          disabled={adding || !newMedName.trim()}
          className="inline-flex rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add medication"}
        </button>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Medications</div>

        {meds.length === 0 ? (
          <div className="text-sm text-gray-500">No meds yet.</div>
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

      <Link className="text-sm underline" to="/dashboard">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

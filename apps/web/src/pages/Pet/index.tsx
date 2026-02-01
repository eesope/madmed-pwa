import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPet, listMedications } from "../../services/medService";
import type { Medication, Pet } from "../../types/domain";

export function PetPage() {
  const { petId } = useParams();
  const [pet, setPet] = useState<Pet | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
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
    })();
  }, [petId]);

  if (loading) return <div className="text-sm text-gray-600">Loading...</div>;
  if (!pet) return <div className="text-sm text-gray-600">Pet not found.</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Pet</div>
        <h1 className="text-2xl font-semibold">{pet.name}</h1>
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

      <Link className="text-sm underline" to="/dashboard">
        ← Back to Dashboard
      </Link>
    </div>
  );
}

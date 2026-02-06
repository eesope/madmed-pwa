// apps/web/src/pages/Dashboard/index.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  addPet,
  getStatus,
  listMedications,
  listPets,
  markDoseTaken,
} from "../../services/medService.firestore";
import type { Medication, MedicationStatus, Pet } from "../../types/domain";

// for messaging test
import { getAuth } from "firebase/auth";
import { useHouseholdId } from "../../app/householdStore";
import { ensureFcmToken } from "../../services/notificationService";

import { getApp } from "firebase/app";

function formatTime(ms: number | null) {
  if (!ms) return "❌";
  return new Date(ms).toLocaleTimeString();
}

export function DashboardPage() {

      console.log("uid:", getAuth().currentUser?.uid);
      console.log("project:", getApp().options.projectId);


  // for messaging test
    const { householdId } = useHouseholdId();

  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string>("");

  async function onEnablePush() {
    setPushMsg("");

    if (!householdId) {
      setPushMsg("householdId가 없어요. 먼저 household를 선택/생성해야 해요.");
      return;
    }

    const uid = getAuth().currentUser?.uid;
    if (!uid) {
      setPushMsg("로그인이 아직 준비되지 않았어요. (currentUser가 null)");
      return;
    }

    setPushBusy(true);
    try {
      const res = await ensureFcmToken({ householdId, uid });
      if (res.ok) {
        setPushMsg("FCM 토큰 저장 완료 ✅ (Firestore members/{uid}.pushTokens 확인)");
        console.log("FCM token:", res.token); // 개발용
      } else {
        console.error(res.reason, res.error);
        setPushMsg(`FCM 설정 실패: ${res.reason}`);
      }
    } finally {
      setPushBusy(false);
    }
  }



  // state code
  const [pets, setPets] = useState<Pet[]>([]);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [selectedMedId, setSelectedMedId] = useState<string>("");

  const [status, setStatus] = useState<MedicationStatus | null>(null);

  const [newPetName, setNewPetName] = useState("");
  const [addingPet, setAddingPet] = useState(false);

  const selectedMed = useMemo(
    () => meds.find((m) => m.id === selectedMedId) ?? null,
    [meds, selectedMedId]
  );

  // 초기 pets 로드
  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);
      if (p[0]) setSelectedPetId(p[0].id);
    })();
  }, []);

  // pet 변경 → meds 로드
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

  // med 변경 → status 로드
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

  async function onAddPet() {
    const name = newPetName.trim();
    if (!name) return;

    setAddingPet(true);
    try {
      const created = await addPet(name);
      const p = await listPets();
      setPets(p);
      setSelectedPetId(created.id);
      setNewPetName("");
    } finally {
      setAddingPet(false);
    }
  }

  const statusText = useMemo(() => {
    if (!status) return "";
    return `morning: ${formatTime(status.morningTakenAt)} / evening: ${formatTime(
      status.eveningTakenAt
    )}`;
  }, [status]);

  const morningDone = Boolean(status?.morningTakenAt);
  const eveningDone = Boolean(status?.eveningTakenAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* MSG TEST */}
        <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Push (FCM) Setup</div>

        <div className="text-sm">
          householdId: <span className="font-mono">{householdId ?? "❌ none"}</span>
        </div>

        <button
          onClick={onEnablePush}
          disabled={pushBusy}
          className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {pushBusy ? "Setting up..." : "Enable Push + Save Token"}
        </button>

        {pushMsg ? <div className="text-sm">{pushMsg}</div> : null}
      </div>

      {/* MSG TEST FIN */}

      <div className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Today status</div>

        {selectedMed ? (
          <>
            <div className="text-sm">
              Selected: <span className="font-medium">{selectedMed.name}</span>
              {selectedMed.dose ? (
                <span className="text-gray-500"> ({selectedMed.dose})</span>
              ) : null}
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
            ) : null}
          </>
        ) : (
          <div className="text-sm text-gray-500">No medication found for this pet (yet).</div>
        )}
      </div>

      <div className="rounded-xl border p-4 space-y-4">
        <div className="text-sm text-gray-600">Pets</div>

        {/* Select */}
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

        {selectedPetId ? (
          <Link className="text-sm underline" to={`/pets/${selectedPetId}`}>
            View pet details
          </Link>
        ) : null}

        {/* Add Pet */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <input
            value={newPetName}
            onChange={(e) => setNewPetName(e.target.value)}
            placeholder="New pet name (e.g. Domingo)"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={onAddPet}
            disabled={addingPet || !newPetName.trim()}
            className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {addingPet ? "Adding..." : "Add Pet"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <div className="text-sm text-gray-600">Medications</div>

        {meds.length === 0 ? (
          <div className="text-sm text-gray-500">
            No meds yet. Add one from the Pet page.
          </div>
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

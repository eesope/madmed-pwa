import type {
  Medication,
  MedicationId,
  MedicationSchedule,
  MedicationStatus,
  Pet,
  PetId,
} from "../types/domain";
import { getHouseholdId } from "../app/householdStore";
import { db } from "../lib/firebase/firebase";
import { paths } from "../lib/firebase/paths";
import { ensureAnonymousAuth } from "../lib/firebase/authService";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

function requireHouseholdId(): string {
  const id = getHouseholdId();
  if (!id) throw new Error("No household connected. Please create/join a household first.");
  return id;
}

function schedulesPath(householdId: string) {
  return `households/${householdId}/schedules`;
}
function statusPath(householdId: string) {
  return `households/${householdId}/status`;
}

/* -----------------------------
 * Pets
 * ----------------------------- */

export async function listPets(): Promise<Pet[]> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const snap = await getDocs(collection(db, paths.pets(householdId)));
  return snap.docs.map((d) => {
    const data = d.data() as any;
    return { id: d.id, name: data.name ?? "(Unnamed)" } satisfies Pet;
  });
}

export async function getPet(petId: PetId): Promise<Pet | null> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${paths.pets(householdId)}/${petId}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;
  const data = snap.data() as any;
  return { id: snap.id, name: data.name ?? "(Unnamed)" } satisfies Pet;
}

export async function addPet(nameRaw: string): Promise<Pet> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const name = nameRaw.trim();
  if (!name) throw new Error("Pet name is required.");

  const ref = await addDoc(collection(db, paths.pets(householdId)), {
    name,
    createdAt: Date.now(),
  });

  return { id: ref.id, name };
}

/* -----------------------------
 * Medications
 * ----------------------------- */

export async function listMedications(petId: PetId): Promise<Medication[]> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const col = collection(db, paths.medications(householdId));
  const q = query(col, where("petId", "==", petId));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      petId: data.petId,
      name: data.name ?? "(Unnamed)",
      dose: data.dose ?? undefined,
    } satisfies Medication;
  });
}

export async function getMedication(medId: MedicationId): Promise<Medication | null> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${paths.medications(householdId)}/${medId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  return {
    id: snap.id,
    petId: data.petId,
    name: data.name ?? "(Unnamed)",
    dose: data.dose ?? undefined,
  } satisfies Medication;
}

export async function addMedication(input: {
  petId: PetId;
  name: string;
  dose?: string;
}): Promise<Medication> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const name = input.name.trim();
  if (!name) throw new Error("Medication name is required.");

  const ref = await addDoc(collection(db, paths.medications(householdId)), {
    petId: input.petId,
    name,
    dose: input.dose?.trim() || null,
    createdAt: Date.now(),
  });

  return {
    id: ref.id,
    petId: input.petId,
    name,
    dose: input.dose?.trim() || undefined,
  };
}

/* -----------------------------
 * Schedule (households/{hid}/schedules/{medId})
 * ----------------------------- */

export async function getSchedule(medId: MedicationId): Promise<MedicationSchedule | null> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${schedulesPath(householdId)}/${medId}`);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as any;
  return {
    medId,
    morningTime: data.morningTime,
    eveningTime: data.eveningTime,
    reminderMinutes: data.reminderMinutes ?? 15,
    timezone: data.timezone ?? "America/Vancouver",
  } satisfies MedicationSchedule;
}

export async function setSchedule(schedule: MedicationSchedule): Promise<void> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${schedulesPath(householdId)}/${schedule.medId}`);
  await setDoc(
    ref,
    {
      medId: schedule.medId,
      morningTime: schedule.morningTime,
      eveningTime: schedule.eveningTime,
      reminderMinutes: schedule.reminderMinutes ?? 15,
      timezone: schedule.timezone ?? "America/Vancouver",
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

/* -----------------------------
 * Status (households/{hid}/status/{medId})
 * ----------------------------- */

export async function getStatus(medId: MedicationId): Promise<MedicationStatus> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${statusPath(householdId)}/${medId}`);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial: MedicationStatus = { medId, morningTakenAt: null, eveningTakenAt: null };
    await setDoc(ref, initial);
    return initial;
  }

  const data = snap.data() as any;
  return {
    medId,
    morningTakenAt: data.morningTakenAt ?? null,
    eveningTakenAt: data.eveningTakenAt ?? null,
  } satisfies MedicationStatus;
}

export async function markDoseTaken(
  medId: MedicationId,
  slot: "morning" | "evening"
): Promise<void> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${statusPath(householdId)}/${medId}`);
  const patch =
    slot === "morning"
      ? { medId, morningTakenAt: Date.now() }
      : { medId, eveningTakenAt: Date.now() };

  // ✅ updateDoc 대신 setDoc merge: 문서 없으면 생성
  await setDoc(ref, patch, { merge: true });
}

export async function resetTodayStatus(medId: MedicationId): Promise<void> {
  await ensureAnonymousAuth();
  const householdId = requireHouseholdId();

  const ref = doc(db, `${statusPath(householdId)}/${medId}`);
  await setDoc(ref, { medId, morningTakenAt: null, eveningTakenAt: null }, { merge: true });
}

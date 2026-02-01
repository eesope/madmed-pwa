// apps/web/src/services/medService.ts
import type { Medication, MedicationId, MedicationSchedule, MedicationStatus, Pet, PetId } from "../types/domain";
import { getHouseholdId } from "../app/householdStore";
import { seedForHousehold, type HouseholdSeed } from "../mock/data";

type DB = {
  pets: Pet[];
  meds: Medication[];
  schedules: Record<string, MedicationSchedule>;
  statuses: Record<string, MedicationStatus>;
};

function dbKey(householdId: string) {
  return `madmed.db.${householdId}`;
}

function requireHouseholdId(): string {
  const id = getHouseholdId();
  if (!id) throw new Error("No household connected. Please create/join a household first.");
  return id;
}

function loadDB(householdId: string): DB {
  const key = dbKey(householdId);
  const raw = localStorage.getItem(key);

  if (!raw) {
    const seed: HouseholdSeed = seedForHousehold(householdId);
    const fresh: DB = {
      pets: seed.pets,
      meds: seed.meds,
      schedules: seed.schedules,
      statuses: seed.statuses,
    };
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }

  try {
    return JSON.parse(raw) as DB;
  } catch {
    // 깨졌으면 seed로 리셋 (개발단계 편의)
    const seed = seedForHousehold(householdId);
    const fresh: DB = {
      pets: seed.pets,
      meds: seed.meds,
      schedules: seed.schedules,
      statuses: seed.statuses,
    };
    localStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }
}

function saveDB(householdId: string, db: DB) {
  localStorage.setItem(dbKey(householdId), JSON.stringify(db));
}

// --- Pets ---
export async function listPets(): Promise<Pet[]> {
  const hid = requireHouseholdId();
  return loadDB(hid).pets;
}

export async function getPet(petId: PetId): Promise<Pet | null> {
  const hid = requireHouseholdId();
  return loadDB(hid).pets.find((p) => p.id === petId) ?? null;
}

// (UI 보강할 때 바로 쓰도록 추가해둠)
export async function addPet(name: string): Promise<Pet> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);
  const id = `pet_${crypto.randomUUID()}`;
  const pet: Pet = { id, name: name.trim() || "Unnamed" };
  db.pets.push(pet);
  saveDB(hid, db);
  return pet;
}

// --- Medications ---
export async function listMedications(petId: PetId): Promise<Medication[]> {
  const hid = requireHouseholdId();
  return loadDB(hid).meds.filter((m) => m.petId === petId);
}

export async function getMedication(medId: MedicationId): Promise<Medication | null> {
  const hid = requireHouseholdId();
  return loadDB(hid).meds.find((m) => m.id === medId) ?? null;
}

export async function addMedication(input: { petId: PetId; name: string; dose?: string }): Promise<Medication> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);
  const id = `med_${crypto.randomUUID()}`;
  const med: Medication = {
    id,
    petId: input.petId,
    name: input.name.trim() || "Unnamed",
    dose: input.dose?.trim() || undefined,
  };
  db.meds.push(med);
  saveDB(hid, db);
  return med;
}

// --- Schedule ---
export async function getSchedule(medId: MedicationId): Promise<MedicationSchedule | null> {
  const hid = requireHouseholdId();
  return loadDB(hid).schedules[medId] ?? null;
}

export async function setSchedule(schedule: MedicationSchedule): Promise<void> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);
  db.schedules[schedule.medId] = schedule;
  saveDB(hid, db);
}

// --- Status ---
export async function getStatus(medId: MedicationId): Promise<MedicationStatus> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);
  return db.statuses[medId] ?? { medId, morningTakenAt: null, eveningTakenAt: null };
}

export async function markDoseTaken(medId: MedicationId, slot: "morning" | "evening"): Promise<void> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);

  const current = db.statuses[medId] ?? { medId, morningTakenAt: null, eveningTakenAt: null };
  const now = Date.now();

  db.statuses[medId] = {
    ...current,
    morningTakenAt: slot === "morning" ? now : current.morningTakenAt,
    eveningTakenAt: slot === "evening" ? now : current.eveningTakenAt,
  };

  saveDB(hid, db);
}

export async function resetTodayStatus(medId: MedicationId): Promise<void> {
  const hid = requireHouseholdId();
  const db = loadDB(hid);
  db.statuses[medId] = { medId, morningTakenAt: null, eveningTakenAt: null };
  saveDB(hid, db);
}

/**
 * 개발 편의: 현재 household의 DB를 seed로 초기화
 * (원하면 Household disconnect 때 호출해도 됨)
 */
export async function resetHouseholdDB(): Promise<void> {
  const hid = requireHouseholdId();
  const seed = seedForHousehold(hid);
  const fresh: DB = {
    pets: seed.pets,
    meds: seed.meds,
    schedules: seed.schedules,
    statuses: seed.statuses,
  };
  saveDB(hid, fresh);
}

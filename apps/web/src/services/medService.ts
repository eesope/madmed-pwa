import { mockMeds, mockPets, mockScheduleByMedId, mockStatusByMedId } from "../mock/data";
import type { Medication, MedicationSchedule, MedicationStatus, Pet } from "../types/domain";

// MVP: 메모리 DB (나중에 Firestore로 교체)
const pets: Pet[] = [...mockPets];
const meds: Medication[] = [...mockMeds];
const schedules = { ...mockScheduleByMedId };
const statuses = { ...mockStatusByMedId };

export async function listPets(): Promise<Pet[]> {
  return pets;
}

export async function listMedications(petId: string): Promise<Medication[]> {
  return meds.filter((m) => m.petId === petId);
}

export async function getSchedule(medId: string): Promise<MedicationSchedule | null> {
  return schedules[medId] ?? null;
}

export async function setSchedule(schedule: MedicationSchedule): Promise<void> {
  schedules[schedule.medId] = schedule;
}

export async function getStatus(medId: string): Promise<MedicationStatus> {
  return statuses[medId] ?? { medId, morningTakenAt: null, eveningTakenAt: null };
}

export async function markDoseTaken(medId: string, slot: "morning" | "evening"): Promise<void> {
  const current = await getStatus(medId);
  const now = Date.now();
  statuses[medId] = {
    ...current,
    morningTakenAt: slot === "morning" ? now : current.morningTakenAt,
    eveningTakenAt: slot === "evening" ? now : current.eveningTakenAt,
  };
}

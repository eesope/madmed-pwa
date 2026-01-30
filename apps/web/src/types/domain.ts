export type HouseholdId = string;
export type PetId = string;
export type MedicationId = string;

export type Pet = {
  id: PetId;
  name: string;
};

export type Medication = {
  id: MedicationId;
  petId: PetId;
  name: string;
  dose?: string; // 예: "2.5mg"
};

export type MedicationSchedule = {
  medId: MedicationId;
  morningTime: string; // "07:30"
  eveningTime: string; // "19:30"
  reminderMinutes: number; // 15
  timezone: string; // "Seoul/Vancouver"
};

export type MedicationStatus = {
  medId: MedicationId;
  morningTakenAt: number | null; // epoch ms
  eveningTakenAt: number | null; // epoch ms
};

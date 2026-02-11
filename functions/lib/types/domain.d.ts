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
    dose?: string;
    createdAt?: number;
};
export type MedicationSchedule = {
    medId: MedicationId;
    morningTime: string;
    eveningTime: string;
    reminderMinutes: number;
    timezone: string;
    updatedAt?: number;
};
export type MedicationStatus = {
    medId: MedicationId;
    morningTakenAt: number | null;
    eveningTakenAt: number | null;
    lastReminderAt?: number | null;
};

import type { Medication, MedicationSchedule, MedicationStatus, Pet } from "../types/domain";

export const mockPets: Pet[] = [
  { id: "pet_domingo", name: "Domingo" },
];

export const mockMeds: Medication[] = [
  { id: "med_felimazole", petId: "pet_domingo", name: "Felimazole", dose: "2.5mg" },
];

export const mockScheduleByMedId: Record<string, MedicationSchedule> = {
  med_felimazole: {
    medId: "med_felimazole",
    morningTime: "07:30",
    eveningTime: "19:30",
    reminderMinutes: 15,
    timezone: "America/Vancouver",
  },
};

export const mockStatusByMedId: Record<string, MedicationStatus> = {
  med_felimazole: {
    medId: "med_felimazole",
    morningTakenAt: null,
    eveningTakenAt: null,
  },
};


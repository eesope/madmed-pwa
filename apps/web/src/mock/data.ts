// apps/web/src/mock/data.ts
import type { Medication, MedicationSchedule, MedicationStatus, Pet } from "../types/domain";

export type HouseholdSeed = {
  pets: Pet[];
  meds: Medication[];
  schedules: Record<string, MedicationSchedule>;
  statuses: Record<string, MedicationStatus>;
};

/**
 * householdId별로 첫 생성 시 들어갈 seed 데이터
 * - 지금은 기본 1펫 1약
 * - 필요하면 householdId에 따라 다른 seed를 줄 수 있음
 */
export function seedForHousehold(householdId: string): HouseholdSeed {
  // 예시: 특정 household에만 다른 이름 주기
  const petName = householdId.startsWith("DOMI") ? "Domingo" : "My Pet";

  const pets: Pet[] = [{ id: "pet_1", name: petName }];

  const meds: Medication[] = [
    { id: "med_1", petId: "pet_1", name: "Felimazole", dose: "2.5mg" },
  ];

  const schedules: Record<string, MedicationSchedule> = {
    med_1: {
      medId: "med_1",
      morningTime: "07:30",
      eveningTime: "19:30",
      reminderMinutes: 15,
      timezone: "America/Vancouver",
    },
  };

  const statuses: Record<string, MedicationStatus> = {
    med_1: {
      medId: "med_1",
      morningTakenAt: null,
      eveningTakenAt: null,
    },
  };

  return { pets, meds, schedules, statuses };
}

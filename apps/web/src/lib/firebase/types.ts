import type { Timestamp } from "firebase/firestore";

export type MedicationDoc = {
  petId: string;
  name: string;
  dose: string | null;
  createdAt: Timestamp;
};

export type ScheduleDoc = {
  medId: string;
  morningTime: string;
  eveningTime: string;
  reminderMinutes: number;
  timezone: string;
  updatedAt: Timestamp;
};

export type StatusDoc = {
  medId: string;
  morningTakenAt: Timestamp | null;
  eveningTakenAt: Timestamp | null;
  lastReminderAt: Timestamp | null;
};

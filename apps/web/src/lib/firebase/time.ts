// src/lib/firebase/time.ts
import { Timestamp } from "firebase/firestore";

/**
 * Domain → Firestore
 */
export const toTs = (ms: number | null | undefined) => {
  if (ms == null) return null;
  return Timestamp.fromMillis(ms);
};

/**
 * Firestore → Domain
 */
export const fromTs = (ts?: Timestamp | null) => {
  if (!ts) return null;
  return ts.toMillis();
};

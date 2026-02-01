// apps/web/src/app/householdStore.ts
import { useEffect, useState } from "react";

const STORAGE_KEY = "madmed.householdId";

export function getHouseholdId(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setHouseholdId(id: string) {
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event("madmed:household-changed"));
}

export function clearHouseholdId() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("madmed:household-changed"));
}

/**
 * 앱 어디서든 현재 householdId를 읽고,
 * 변경되면 자동으로 업데이트되는 훅.
 */
export function useHouseholdId() {
  const [householdId, setId] = useState<string | null>(() => {
    // SSR은 없지만, 안전하게 try/catch
    try {
      return getHouseholdId();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    function sync() {
      setId(getHouseholdId());
    }
    window.addEventListener("madmed:household-changed", sync);
    return () => window.removeEventListener("madmed:household-changed", sync);
  }, []);

  return { householdId, setHouseholdId, clearHouseholdId };
}

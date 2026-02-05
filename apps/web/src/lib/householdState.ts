const KEY = "madmed_householdId";

export function getHouseholdId(): string | null {
  return localStorage.getItem(KEY);
}

export function setHouseholdId(householdId: string) {
  localStorage.setItem(KEY, householdId);
}

export function clearHouseholdId() {
  localStorage.removeItem(KEY);
}

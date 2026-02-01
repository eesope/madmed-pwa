// apps/web/src/services/householdService.ts

const HOUSEHOLDS_KEY = "madmed.mock.households";

type HouseholdRecord = {
  id: string;
  createdAt: number;
};

function loadHouseholds(): Record<string, HouseholdRecord> {
  const raw = localStorage.getItem(HOUSEHOLDS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, HouseholdRecord>;
  } catch {
    return {};
  }
}

function saveHouseholds(map: Record<string, HouseholdRecord>) {
  localStorage.setItem(HOUSEHOLDS_KEY, JSON.stringify(map));
}

/**
 * 코드 포맷 정규화:
 * - 공백 제거
 * - 소문자 → 대문자
 * - 허용문자: A-Z, 0-9, 하이픈(-)
 */
export function normalizeHouseholdCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function validateHouseholdCode(code: string): string | null {
  if (!code) return "Household code is empty.";
  if (code.length < 4) return "Household code is too short.";
  if (!/^[A-Z0-9-]+$/.test(code)) return "Use only A-Z, 0-9, and hyphen (-).";
  return null;
}

export async function householdExists(id: string): Promise<boolean> {
  const map = loadHouseholds();
  return Boolean(map[id]);
}

/**
 * 사용자가 입력한 코드로 household 생성
 * - 이미 존재하면 에러
 */
export async function createHouseholdWithCode(rawCode: string): Promise<{ id: string }> {
  const id = normalizeHouseholdCode(rawCode);
  const err = validateHouseholdCode(id);
  if (err) throw new Error(err);

  const map = loadHouseholds();
  if (map[id]) throw new Error("Household code already exists. Try a different code.");

  map[id] = { id, createdAt: Date.now() };
  saveHouseholds(map);
  return { id };
}

/**
 * 기존 household에 조인
 * - 존재하지 않으면 에러
 */
export async function joinHousehold(rawCode: string): Promise<{ id: string }> {
  const id = normalizeHouseholdCode(rawCode);
  const err = validateHouseholdCode(id);
  if (err) throw new Error(err);

  const map = loadHouseholds();
  if (!map[id]) throw new Error("Household not found. Check the code and try again.");

  return { id };
}

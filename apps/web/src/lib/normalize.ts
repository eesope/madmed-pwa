export function normalizeHouseholdCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

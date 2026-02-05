export const paths = {
  household: (householdId: string) => `households/${householdId}`,
  members: (householdId: string) => `households/${householdId}/members`,
  member: (householdId: string, uid: string) => `households/${householdId}/members/${uid}`,
  pets: (householdId: string) => `households/${householdId}/pets`,
  medications: (householdId: string) => `households/${householdId}/medications`,
};

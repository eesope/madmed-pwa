export type Pet = {
  id: string;
  name: string;
  species?: "dog" | "cat";
  createdAt?: number; // mock 호환용 (Firestore에서는 Timestamp 쓰게 될 것)
};

export interface PetsRepo {
  list(householdId: string): Promise<Pet[]>;
  create(householdId: string, pet: Omit<Pet, "id">): Promise<string>;
  update(householdId: string, petId: string, patch: Partial<Pet>): Promise<void>;
  remove(householdId: string, petId: string): Promise<void>;
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { paths } from "@/lib/firebase/paths";
import type { Pet, PetsRepo } from "./petsRepo";

export const petsRepoFirestore: PetsRepo = {
  async list(householdId) {
    const snap = await getDocs(collection(db, paths.pets(householdId)));
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        species: data.species,
      } satisfies Pet;
    });
  },

  async create(householdId, pet) {
    const ref = await addDoc(collection(db, paths.pets(householdId)), {
      ...pet,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(householdId, petId, patch) {
    await updateDoc(doc(db, `${paths.pets(householdId)}/${petId}`), patch as any);
  },

  async remove(householdId, petId) {
    await deleteDoc(doc(db, `${paths.pets(householdId)}/${petId}`));
  },
};

import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { ensureAnonymousAuth } from "./authService";
import { paths } from "./paths";

export async function createHouseholdWithCode(householdIdRaw: string): Promise<{ id: string }> {
  const user = await ensureAnonymousAuth(); // ✅ 추가
  const uid = user.uid;

  const householdId = householdIdRaw.trim().toUpperCase();

  const hhRef = doc(db, paths.household(householdId));
  const hhSnap = await getDoc(hhRef);
  if (hhSnap.exists()) throw new Error("That household code is already taken.");

  await setDoc(hhRef, { createdAt: serverTimestamp(), createdBy: uid });

  const memberRef = doc(db, paths.member(householdId, uid));

  await setDoc(memberRef, {
    role: "owner", createdAt: serverTimestamp(), pushTokens: [],}, 
    {merge: true});

  return { id: householdId };
}

export async function joinHousehold(householdIdRaw: string): Promise<void> {
  const user = await ensureAnonymousAuth(); // ✅ 추가
  const uid = user.uid;

  const householdId = householdIdRaw.trim().toUpperCase();

  const hhRef = doc(db, paths.household(householdId));
  const hhSnap = await getDoc(hhRef);
  if (!hhSnap.exists()) throw new Error("Household code not found.");

    const memberRef = doc(db, paths.member(householdId, uid));

  await setDoc(memberRef,
    { role: "member", createdAt: serverTimestamp(), pushTokens: [] },
    { merge: true }
  );
}

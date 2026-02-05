import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function must(name: string) {
  const v = import.meta.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v as string;
}

const firebaseConfig = {
  apiKey: must("VITE_FIREBASE_API_KEY"),
  authDomain: must("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: must("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: must("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: must("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: must("VITE_FIREBASE_APP_ID"),
};


export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

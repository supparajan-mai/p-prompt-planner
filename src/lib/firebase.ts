import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// ✅ Firebase config (ของไหม)
const firebaseConfig = {
  apiKey: "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
  authDomain: "p-prompt.firebaseapp.com",
  projectId: "p-prompt",
  storageBucket: "p-prompt.firebasestorage.app",
  messagingSenderId: "566289872852",
  appId: "1:566289872852:web:4ea11ccbe1c619fded0841",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ✅ ใช้ region เดียวกับ functions ที่ deploy (us-central1)
export const functions = getFunctions(app, "us-central1");

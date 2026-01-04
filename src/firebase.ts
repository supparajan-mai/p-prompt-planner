// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config (ของคุณ)
const firebaseConfig = {
  apiKey: "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
  authDomain: "p-prompt.firebaseapp.com",
  projectId: "p-prompt",
  storageBucket: "p-prompt.firebasestorage.app",
  messagingSenderId: "566289872852",
  appId: "1:566289872852:web:4ea11ccbe1c619fded0841",
};

// Initialize Firebase (ทำครั้งเดียว)
export const app = initializeApp(firebaseConfig);

// Services ที่พี่พร้อมใช้
export const auth = getAuth(app);
export const db = getFirestore(app);

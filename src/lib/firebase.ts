import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "p-prompt.firebaseapp.com",
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://p-prompt-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "p-prompt",
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "p-prompt.firebasestorage.app",
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "566289872852",
      appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:566289872852:web:4ea11ccbe1c619fded0841"
    };

// Singleton pattern ป้องกันการ Initialize ซ้ำ
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);           // สำหรับ Firestore
export const rtdb = getDatabase(app);          // สำหรับ Realtime DB (เชื่อม Sheet)
export const storage = getStorage(app);        // สำหรับเก็บสลิปโอนเงิน
export const functions = getFunctions(app);

export default app;
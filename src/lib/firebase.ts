import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig =
  typeof (globalThis as any).__firebase_config !== "undefined"
    ? JSON.parse((globalThis as any).__firebase_config)
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "p-prompt.firebaseapp.com",
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://p-prompt-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "p-prompt",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "p-prompt.firebasestorage.app",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "566289872852",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:566289872852:web:4ea11ccbe1c619fded0841",
      };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

/**
 * เรียก OpenAI ผ่าน Netlify Function (ปลอดภัย - API Key ไม่รั่วไหล)
 */
export async function callOpenAI(prompt: string) {
  try {
    const response = await fetch('/.netlify/functions/openai', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Function call failed');
    }
    
    const result = await response.json();
    return result.message || "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  }
}

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "p-prompt.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://p-prompt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "p-prompt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "p-prompt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "566289872852",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:566289872852:web:4ea11ccbe1c619fded0841"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export async function callOpenAI(prompt: string) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return "ไม่พบคีย์ AI จ๊ะ";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "คุณคือพี่พร้อม ผู้ช่วยที่อบอุ่น" },
          { role: "user", content: prompt }
        ]
      })
    });
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  }
}
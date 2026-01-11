import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDKxHVKU9F36vD8_qgX00UfZNPCMiknXqM",
  authDomain: "p-prompt.firebaseapp.com",
  databaseURL: "https://p-prompt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "p-prompt",
  storageBucket: "p-prompt.firebasestorage.app",
  messagingSenderId: "566289872852",
  appId: "1:566289872852:web:4ea11ccbe1c619fded0841"
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

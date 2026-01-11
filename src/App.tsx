import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User } from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { Sparkles, Plus, Loader2, Briefcase, Book, Wallet, Heart } from "lucide-react";

// --- Import Custom Tabs ---
import WorkTab from "./tabs/WorkTab";
import MemoTab from "./tabs/MemoTab";
import FinanceTab from "./tabs/FinanceTab";
import HealthTab from "./tabs/HealthTab";

// --- 1. Configuration ---
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_');

// --- 2. OpenAI Service ---
const callOpenAI = async (prompt: string): Promise<string | null> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // ดึงจาก Netlify Env
  if (!apiKey) return "ขออภัยจ๊ะ ไม่พบ API Key สำหรับเชื่อมต่อ AI";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // หรือ gpt-4 ตามโควตาของคุณ
        messages: [{ role: "system", content: "คุณคือ 'พี่พร้อม' ผู้ช่วยส่วนตัวที่อบอุ่น สุภาพ และใช้ภาษาไทยอย่างเป็นกันเอง" }, { role: "user", content: prompt }],
        temperature: 0.7
      })
    });
      const result: any = await res.json();
      return result?.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("OpenAI Error:", e);
    return null;
  }
};

// --- 3. Main UI Components ---
const Header = ({ user }: { user: User | null }) => {
  const [userData, setUserData] = useState<{ status: string; fullName: string }>({ status: 'เพื่อน', fullName: '...' });
  useEffect(() => {
    if (!user) return;
    return onValue(ref(db, `artifacts/${appId}/public/data/users/${user.uid}`), (s) => {
      const d = s.val();
      if (d) setUserData({ status: d.status || 'เพื่อน', fullName: d.fullName || user.displayName || "คุณ" });
    });
  }, [user]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20}/></div>
          <div>
            <h1 className="font-black text-slate-800 text-sm sm:text-base leading-none mb-1">พี่พร้อม</h1>
            <p className="text-[10px] text-slate-400 font-bold italic leading-none">สวัสดีจ๊ะคุณ {userData.fullName}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${userData.status === 'เพื่อนผู้มีพระคุณ' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
          {userData.status}
        </div>
      </div>
    </header>
  );
};

const BottomNav = ({ tab, setTab }: { tab: string; setTab: (t: string) => void }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
    <div className="max-w-4xl mx-auto grid grid-cols-4 h-20 items-center">
      {[
        { id: 'work', icon: Briefcase, label: 'งาน', color: 'text-indigo-600' },
        { id: 'memo', icon: Book, label: 'โน้ต', color: 'text-indigo-600' },
        { id: 'finance', icon: Wallet, label: 'เงิน', color: 'text-emerald-600' },
        { id: 'health', icon: Heart, label: 'ดูแลใจ', color: 'text-rose-500' }
      ].map((item) => (
        <button key={item.id} onClick={() => setTab(item.id)} className={`flex flex-col items-center gap-1 transition-all ${tab === item.id ? `${item.color} scale-110 font-bold` : "text-slate-300"}`}>
          <item.icon size={20} />
          <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
        </button>
      ))}
    </div>
  </nav>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("work");

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
      else await signInAnonymously(auth);
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFCFB]">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans pb-24">
      <Header user={user} />
      
      <main className="max-w-5xl mx-auto pt-4">
        {/* แสดงผลตาม Tab โดยใช้ Component ที่แยกไฟล์ไว้ */}
        {tab === "work" && <WorkTab />}
        {tab === "memo" && <MemoTab />}
        {tab === "finance" && <FinanceTab />}
        {tab === "health" && <HealthTab />}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}
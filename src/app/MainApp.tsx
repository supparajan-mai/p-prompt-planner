import React, { useMemo, useState, useEffect } from "react";
import { 
  getDatabase, ref, set, onValue, push, remove as dbRemove 
} from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc 
} from 'firebase/firestore';
import { 
  X, Plus, Check, Loader2, Heart, Smile, Star, Sparkles, 
  Send, Trash2, ShieldCheck, AlertTriangle, History, 
  MessageCircle, Coffee, Briefcase, Book, Wallet, 
  Settings, User, ChevronRight, LogIn, Award, FileText, Lock, Scale, Gift, 
  Laugh, Zap, IceCream, Ghost, Rocket, RefreshCw, UserCircle
} from "lucide-react";

// --- 1. การตั้งค่า Firebase (Configuration) ---
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
const store = getFirestore(app);

// จัดการ appId ให้ปลอดภัยจากเครื่องหมายพิเศษ (Rule 1)
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_');

// การตั้งค่า OpenChat API (สำหรับการใช้งานจริง)
const OPENCHAT_CONFIG = {
  apiKey: "", 
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-3.5-turbo"
};

// --- ส่วนประกอบย่อย (Sub-components) ---

/**
 * Header: ส่วนหัวของแอปที่ดึงข้อมูลชื่อและสถานะสมาชิกจ๊ะ
 */
const Header = ({ user }) => {
  const [userData, setUserData] = useState({ status: 'เพื่อน', fullName: '...' });

  useEffect(() => {
    if (!user) return;
    const userRef = ref(db, `artifacts/${appId}/public/data/users/${user.uid}`);
    return onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setUserData({ 
        status: data.status || 'เพื่อน', 
        fullName: data.fullName || user.displayName || "คุณ" 
      });
    });
  }, [user]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20}/></div>
          <div>
            <h1 className="font-black text-slate-800 text-base">พี่พร้อม</h1>
            <p className="text-[10px] text-slate-400 font-bold italic">สวัสดีจ๊ะคุณ {userData.fullName}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black uppercase text-slate-500 border border-slate-200">
          สถานะ: {userData.status}
        </div>
      </div>
    </header>
  );
};

/**
 * BottomNav: แถบเมนูด้านล่างจ๊ะ
 */
const BottomNav = ({ tab, setTab, onAdd }) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
    <div className="max-w-4xl mx-auto grid grid-cols-5 h-20 items-center">
      <button onClick={() => setTab("work")} className={`flex flex-col items-center gap-1 ${tab === "work" ? "text-indigo-600" : "text-slate-300"}`}>
        <Briefcase size={20} /><span className="text-[9px] font-black uppercase">งาน</span>
      </button>
      <button onClick={() => setTab("memo")} className={`flex flex-col items-center gap-1 ${tab === "memo" ? "text-indigo-600" : "text-slate-300"}`}>
        <Book size={20} /><span className="text-[9px] font-black uppercase">โน้ต</span>
      </button>
      <div className="flex justify-center">
        <button onClick={onAdd} className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl -translate-y-4 active:scale-90 transition-transform"><Plus size={28}/></button>
      </div>
      <button onClick={() => setTab("finance")} className={`flex flex-col items-center gap-1 ${tab === "finance" ? "text-indigo-600" : "text-slate-300"}`}>
        <Wallet size={20} /><span className="text-[9px] font-black uppercase">เงิน</span>
      </button>
      <button onClick={() => setTab("health")} className={`flex flex-col items-center gap-1 ${tab === "health" ? "text-indigo-600" : "text-slate-300"}`}>
        <Heart size={20} /><span className="text-[9px] font-black uppercase">ดูแลใจ</span>
      </button>
    </div>
  </nav>
);

/**
 * Tabs: คอมโพเนนต์จำลองหน้า Tab ต่างๆ จ๊ะ
 */
const WorkTab = () => <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto mb-4 text-indigo-600"/><p className="text-sm font-bold text-slate-400 italic">หน้างานกำลังปรับปรุงจ๊ะ...</p></div>;
const MemoTab = () => <div className="p-10 text-center"><Book className="mx-auto mb-4 text-indigo-200" size={48}/><p className="text-sm font-bold text-slate-400 italic">หน้าโน้ตกำลังเตรียมข้อมูลจ๊ะ...</p></div>;
const FinanceTab = () => <div className="p-10 text-center"><Wallet className="mx-auto mb-4 text-emerald-200" size={48}/><p className="text-sm font-bold text-slate-400 italic">หน้าการเงินกำลังคิดเลขจ๊ะ...</p></div>;

/**
 * HealthTab: หน้าดูแลใจแบบประมวลผลผ่าน AI จ๊ะ
 */
const HealthTab = ({ user }) => {
  const [healthEntries, setHealthEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const pPath = `artifacts/${appId}/users/${user.uid}/health`;
    return onValue(ref(db, pPath), (snapshot) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      setHealthEntries(data.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  }, [user]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthEntries.map(entry => (
          <div key={entry.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
             <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">
                  {entry.moodLevel >= 4 ? "😊" : entry.moodLevel === 3 ? "🙂" : "😣"}
                </div>
                <p className="text-[10px] font-black text-slate-300">{entry.date}</p>
             </div>
             <p className="text-sm text-slate-700 font-bold leading-relaxed italic">"{entry.story}"</p>
             {entry.aiResponse && (
               <div className="p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-600 mb-1 uppercase tracking-widest italic">พี่พร้อมบอกว่า...</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{entry.aiResponse}</p>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 3. ส่วนหลักของแอป (App Component) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("work");
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState("นัด");

  // 1. จัดการสิทธิ์การเข้าถึงจ๊ะ
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error", err); }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      }
    });
  }, []);

  // 2. ฟังก์ชันบันทึกข้อมูลแบบรวมศูนย์จ๊ะ
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    const id = Date.now().toString();
    const collectionMap = {
      "นัด": "appointments",
      "งาน": "todos",
      "โน้ต": "notes",
      "สุขภาพ": "health"
    };
    const collectionName = collectionMap[addMode] || "others";
    const path = `artifacts/${appId}/users/${user.uid}/${collectionName}/${id}`;

    try {
      await set(ref(db, path), {
        ...data,
        id,
        createdAt: Date.now(),
        date: new Date().toLocaleDateString('th-TH')
      });
      setAddOpen(false);
    } catch (e) {
      alert("บันทึกไม่สำเร็จจ๊ะ ลองใหม่อีกครั้งนะจ๊ะ");
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#FDFCFB]">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-left pb-32">
      <Header user={user} />

      <main className="mx-auto max-w-4xl px-6 pt-8">
        <h2 className="text-3xl font-black text-slate-800 mb-8 capitalize underline decoration-indigo-200 decoration-8 font-serif">
          {tab === "work" ? "งานประจำวัน" : tab === "memo" ? "บันทึกโน้ต" : tab === "finance" ? "แผนการเงิน" : "ดูแลสุขภาพใจ"}
        </h2>
        
        {tab === "work" && <WorkTab />}
        {tab === "memo" && <MemoTab />}
        {tab === "finance" && <FinanceTab />}
        {tab === "health" && <HealthTab user={user} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} onAdd={() => { setAddMode(tab === "health" ? "สุขภาพ" : tab === "memo" ? "โน้ต" : "นัด"); setAddOpen(true); }} />

      {/* Modal เพิ่มรายการใหม่ (รวมไฟล์เดียวจ๊ะ) */}
      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto text-left">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative shadow-2xl my-auto animate-in zoom-in duration-300">
            <button onClick={() => setAddOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-indigo-600 p-2"><X size={22}/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6 font-serif">บันทึก{addMode}</h3>
            
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">หัวข้อเรื่องจ๊ะ</label>
                <input name="title" required placeholder="พิมพ์สิ่งที่ต้องการบันทึก..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>

              {addMode === "สุขภาพ" ? (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">เล่าให้พี่พร้อมฟังหน่อยจ๊ะ</label>
                  <textarea name="story" required placeholder="วันนี้เป็นยังไงบ้าง..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium shadow-inner h-32 outline-none focus:ring-2 focus:ring-indigo-100"></textarea>
                  <input type="hidden" name="moodLevel" value="3" />
                </div>
              ) : (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">รายละเอียดเพิ่มเติม</label>
                   <textarea name="content" placeholder="พิมพ์โน้ตเสริมจ๊ะ..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium shadow-inner h-24 outline-none focus:ring-2 focus:ring-indigo-100"></textarea>
                </div>
              )}

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-black active:scale-95 transition-all mt-4">
                ยืนยันบันทึกจ๊ะ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
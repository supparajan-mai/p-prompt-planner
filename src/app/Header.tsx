import React, { useState, useEffect } from 'react';
import { 
  getDatabase, ref, onValue 
} from "firebase/database";
import { 
  getAuth, 
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  ShieldCheck, 
  Sparkles, 
  User,
  Award,
  ChevronDown
} from 'lucide-react';

// --- 1. การตั้งค่าระบบ (Firebase Configuration) ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "p-prompt.firebaseapp.com",
      databaseURL: "https://p-prompt-default-rtdb.firebaseio.com",
      projectId: "p-prompt",
      appId: "1:123456789:web:abcdef"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); 

export default function Header() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({
    status: 'เพื่อน',
    fullName: 'กำลังโหลด...',
    renewDate: ''
  });

  // 2. การจัดการสิทธิ์ (Rule 3)
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 3. ดึงข้อมูลสถานะและแผนสมาชิก (Rule 1)
  useEffect(() => {
    if (!user) return;
    
    // ดึงข้อมูลจาก Public Data ตามที่เราตั้งค่าไว้ใน MembershipTab
    const userRef = ref(db, `artifacts/${appId}/public/data/users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUserData({
          status: data.status || 'เพื่อน',
          fullName: data.fullName || (user.displayName || "คุณผู้ใช้งาน"),
          renewDate: data.renewDate || "" // เช่น "หมดอายุ 31/01/2569"
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // คำทักทายตามช่วงเวลา
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้านะครับ";
    if (hour < 17) return "บ่ายนี้สู้ๆ นะครับ";
    return "เย็นนี้พักผ่อนบ้างนะครับ";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        
        {/* ส่วนซ้าย: โลโก้และชื่อ */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
             <Sparkles size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-black text-slate-800 text-lg leading-tight truncate">พี่พร้อม</h1>
              <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold border border-emerald-100">
                <ShieldCheck size={10} /> Online
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold truncate italic">{getGreeting()} คุณ{userData.fullName} 👋</p>
          </div>
        </div>

        {/* ส่วนขวา: สถานะสมาชิก */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden xs:block">
            <div className="flex items-center justify-end gap-1.5 mb-0.5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">สถานะ</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                userData.status === 'เพื่อนผู้มีพระคุณ' 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : userData.status === 'คนคุย'
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {userData.status}
              </span>
            </div>
            {userData.renewDate && (
              <p className="text-[9px] text-slate-300 font-bold italic">{userData.renewDate}</p>
            )}
          </div>
          
          {/* Avatar จำลอง */}
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors cursor-pointer shadow-inner">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
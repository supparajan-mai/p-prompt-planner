import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { auth, rtdb as db } from "../lib/firebase";
import { ShieldCheck, Sparkles, User, Award, ChevronDown } from 'lucide-react';

export default function Header() {
  const [userData, setUserData] = useState({ fullName: "ผู้ใช้งาน", status: "สมาชิกทั่วไป" });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(db, `users/${user.uid}/profile`);
    return onValue(userRef, (snapshot) => {
      if (snapshot.exists()) setUserData(snapshot.val());
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "อรุณสวัสดิ์จ๊ะ";
    if (hour < 18) return "สวัสดีตอนบ่ายจ๊ะ";
    return "สวัสดียามค่ำคืนจ๊ะ";
  };

  return (
    <header className="sticky top-0 z-[90] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 italic font-black text-xl">P</div>
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 tracking-tight">P-PROMPT</h1>
            <p className="text-[10px] text-slate-400 font-bold italic">{getGreeting()} คุณ{userData.fullName} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden xs:block text-right">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${userData.status === 'VIP' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {userData.status}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400"><User size={20}/></div>
        </div>
      </div>
    </header>
  );
}
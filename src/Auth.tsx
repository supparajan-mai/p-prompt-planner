// src/Auth.tsx
import React, { useEffect, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase"; // ดึงจาก lib เท่านั้นจ๊ะ
import { LogIn, Loader2, Sparkles } from "lucide-react";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center">พี่พร้อมกำลังเตรียมระบบ...</div>;
  
  if (!user) return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#FDFCFB]">
      <Sparkles size={48} className="text-indigo-600 mb-6" />
      <h1 className="text-2xl font-black mb-10">สวัสดีจ๊ะ เข้าใช้งานด้วย Google นะ</h1>
      <button 
        onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
        className="w-full max-w-xs bg-slate-900 text-white py-5 rounded-3xl font-black shadow-xl active:scale-95 transition-all"
      >
        เข้าสู่ระบบจ๊ะ
      </button>
    </div>
  );

  return <>{children}</>;
}
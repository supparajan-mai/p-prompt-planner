import React, { useEffect, useState } from "react";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
// --- ดึง auth มาจาก lib ที่เดียวจ๊ะ ---
import { auth } from "./lib/firebase";
import { 
  LogIn, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  LogOut,
  AlertTriangle
} from "lucide-react";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setAuthError("เข้าสู่ระบบขัดข้องจ๊ะ: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#FDFCFB] gap-4">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">พี่พร้อมกำลังเตรียมระบบจ๊ะ...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB] p-6 text-center">
        <div className="mb-10 animate-slide-up">
          <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Sparkles className="text-indigo-600 w-12 h-12" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">ยินดีต้อนรับจ๊ะ</h1>
          <p className="text-slate-400 text-sm font-medium">มาเริ่มจัดระเบียบชีวิตและดูแลใจไปกับพี่พร้อมจ๊ะ</p>
        </div>

        <button
          onClick={signInGoogle}
          className="w-full max-w-xs flex items-center justify-center gap-3 rounded-[1.8rem] bg-slate-900 text-white py-5 font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          <LogIn size={20} strokeWidth={3} />
          เข้าใช้งานด้วย Google
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-300">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">ระบบความปลอดภัยมาตรฐานสากลจ๊ะ</span>
        </div>

        {authError && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2 text-rose-600 text-xs font-bold animate-in fade-in">
            <AlertTriangle size={14} className="shrink-0" />
            <p className="text-left leading-relaxed">{authError}</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

export function LogoutButton() {
  const handleSignOut = () => signOut(auth);
  return (
    <button onClick={handleSignOut} className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
      <LogOut size={14} /> ออกจากระบบ
    </button>
  );
}
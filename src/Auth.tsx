import React, { useEffect, useState } from "react";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  LogIn, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  LogOut
} from "lucide-react";

/**
 * --- 1. การตั้งค่าระบบ (Configuration) ---
 * พี่พร้อมปรับให้ใช้ค่าจากสภาพแวดล้อมจำลองเพื่อให้แสดงผลใน Preview ได้จ๊ะ
 * เมื่อคุณนำไปใช้ในโปรเจกต์ Vite จริง ให้เปลี่ยนกลับไปใช้ import.meta.env ตามความเหมาะสมนะจ๊ะ
 */
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "", 
      authDomain: "p-prompt.firebaseapp.com",
      projectId: "p-prompt",
      appId: "1:123456789:web:abcdef"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default function AuthGate({ children }) {
  const [user, setUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // จัดการผลลัพธ์จากการเข้าสู่ระบบแบบ Redirect (กรณี Popup ถูกบล็อก)
    const handleRedirect = async () => {
      try {
        await getRedirectResult(auth);
      } catch (e) {
        setAuthError("การเข้าสู่ระบบขัดข้องนิดหน่อยจ๊ะ ลองใหม่อีกครั้งนะจ๊ะ");
      }
    };
    handleRedirect();

    // ติดตามสถานะการเข้าสู่ระบบของผู้ใช้
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  async function signInGoogle() {
    setAuthError(null);
    const provider = new GoogleAuthProvider();

    try {
      // ลองใช้หน้าต่าง Popup ก่อนจ๊ะ
      await signInWithPopup(auth, provider);
    } catch (e) {
      const code = String(e?.code || "");
      // หาก Popup ถูกบล็อกหรือมีปัญหา ให้ใช้การ Redirect แทนจ๊ะ
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      setAuthError("เข้าสู่ระบบไม่สำเร็จจ๊ะ กรุณาลองใหม่อีกครั้งนะจ๊ะ");
    }
  }

  // หน้าจอแสดงสถานะกำลังโหลดข้อมูล
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB]">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12 mb-4" />
      <p className="text-xs font-black text-slate-400 tracking-[0.3em] uppercase italic text-center">
        พี่พร้อมกำลังเตรียมข้อมูลให้คุณจ๊ะ...
      </p>
    </div>
  );

  // หากล็อกอินสำเร็จแล้ว ให้แสดงเนื้อหาภายในแอปจ๊ะ
  if (user) return <>{children}</>;

  // หน้าจอเข้าสู่ระบบสไตล์พี่พร้อม (Login Screen)
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FDFCFB] font-sans text-left">
      <div className="w-full max-w-sm bg-white rounded-[3rem] shadow-[0_30px_70px_rgba(0,0,0,0.08)] border border-slate-50 p-10 text-center animate-in zoom-in duration-500">
        
        {/* ส่วนแสดงโลโก้ */}
        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-200">
          <Sparkles size={40} />
        </div>

        <div className="mb-10 text-left">
          <h2 className="text-3xl font-black text-slate-800 leading-tight mb-2">ยินดีที่ได้พบกัน<br/>อีกครั้งนะจ๊ะ</h2>
          <p className="text-sm text-slate-400 font-medium italic text-left leading-relaxed">เข้าสู่ระบบเพื่อวางแผนชีวิตและดูแลใจไปกับพี่พร้อมจ๊ะ</p>
        </div>

        <button
          onClick={signInGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-[1.8rem] bg-slate-900 text-white py-5 font-black text-sm hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
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
    </div>
  );
}

/**
 * ปุ่มออกจากระบบสำหรับการนำไปใช้ในส่วนอื่นๆ ของแอปจ๊ะ
 */
export function LogoutButton() {
  return (
    <button
      onClick={() => signOut(auth)}
      className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-5 py-2.5 text-xs font-black text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95"
    >
      <LogOut size={14} />
      ออกจากระบบ
    </button>
  );
}
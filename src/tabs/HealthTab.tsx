import React, { useState, useEffect } from 'react';
import { 
  getDatabase, ref, set, onValue, remove as dbRemove 
} from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  Heart, Smile, Star, Sparkles, Send, Trash2, 
  Loader2, X, ShieldCheck, Check, AlertTriangle,
  History, MessageCircle, Coffee 
} from "lucide-react";

// --- 1. การตั้งค่าระบบ (Configuration) ---
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
const auth = getAuth(app);
const db = getDatabase(app);

// --- การจัดการ Path ที่ถูกต้อง (Fix Error: invalid path) ---
// Firebase Realtime Database ไม่อนุญาตให้มี . # $ [ ] ใน Path
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); // เปลี่ยนตัวอักษรต้องห้ามเป็น _

// API Key สำหรับ Gemini
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

const MOODS = [
  { id: 5, emoji: "🤩", name: "ตื่นเต้น", color: "bg-orange-100 text-orange-600" },
  { id: 4, emoji: "😊", name: "มีความสุข", color: "bg-emerald-100 text-emerald-600" },
  { id: 3, emoji: "🙂", name: "ปกติ", color: "bg-sky-100 text-sky-600" },
  { id: 2, emoji: "🥱", name: "เหนื่อยล้า", color: "bg-violet-100 text-violet-600" },
  { id: 1, emoji: "😣", name: "ไม่โอเค", color: "bg-rose-100 text-rose-600" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthEntries, setHealthEntries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [dbError, setDbError] = useState(null);

  const [moodLevel, setMoodLevel] = useState(3);
  const [story, setStory] = useState("");

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 2. การจัดการสิทธิ์การใช้งาน (Rule 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth Error:", err); 
        setDbError("ระบบยืนยันตัวตนขัดข้องจ๊ะ");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 3. การดึงข้อมูลจากฐานข้อมูล (Rule 1 & 3) ---
  useEffect(() => {
    if (!user) return;
    
    // ใช้ appId ที่ถูกล้างค่าพิเศษแล้ว
    const pPath = `artifacts/${appId}/users/${user.uid}/health`;
    
    const unsubscribe = onValue(ref(db, pPath), (snapshot) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      setHealthEntries(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Read Error:", error);
      if (error.code === 'PERMISSION_DENIED') {
        setDbError("การเข้าถึงข้อมูลถูกจำกัดจ๊ะ");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- 4. ฟังก์ชันบันทึกเรื่องราวและให้ AI วิเคราะห์ใจ ---
  const saveEntry = async (e) => {
    e.preventDefault();
    if (!user || story.length > 500) return;

    setIsAiAnalyzing(true);
    let aiResponseText = "วันนี้คุณทำดีที่สุดแล้วนะจ๊ะ พี่พร้อมอยู่ข้างๆ เสมอจ๊ะ";
    
    // เช็คว่ามี Gemini API Key หรือไม่
    if (apiKey) {
      const prompt = `ผู้ใช้งานเล่าว่า: "${story}" และเลือกอารมณ์ระดับ ${moodLevel}/5. ในฐานะ "พี่พร้อม" ที่ปรึกษาที่อบอุ่นและเป็นกลาง โปรดให้คำตอบสั้นๆ (3-4 ประโยค) ที่แสดงความเห็นใจและให้กำลังใจเขาเป็นภาษาไทย ใช้สรรพนามเรียกผู้ใช้งานว่า "คุณ" และแทนตัวเองว่า "พี่พร้อม" นะจ๊ะ`;
      
      try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });
          const result = await res.json();
          // ตรวจสอบให้แน่ใจว่าได้ค่าเป็น String (Fix Error: Objects are not valid as a React child)
          const extractedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof extractedText === 'string') {
            aiResponseText = extractedText;
          }
      } catch (e) { 
          console.error("AI Error:", e); 
      }
    }

    const id = Date.now().toString();
    const entry = { 
      id, 
      moodLevel, 
      story: String(story), 
      aiResponse: String(aiResponseText), 
      createdAt: Date.now(), 
      date: new Date().toLocaleDateString('th-TH') 
    };

    try {
        await set(ref(db, `artifacts/${appId}/users/${user.uid}/health/${id}`), entry);
        setIsAiAnalyzing(false);
        setShowModal(false);
        setStory("");
        notify("พี่พร้อมจดบันทึกใจให้คุณเรียบร้อยแล้วจ๊ะ");
    } catch (e) { 
        console.error("Save Error:", e);
        notify("บันทึกไม่สำเร็จจ๊ะ", "error"); 
        setIsAiAnalyzing(false); 
    }
  };

  const deleteEntry = async (id) => {
    if (!user) return;
    if (window.confirm("คุณต้องการลบความทรงจำนี้ใช่ไหมจ๊ะ?")) {
      try {
        await dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/health/${id}`));
        notify("ลบเรื่องราวเรียบร้อยแล้วจ๊ะ");
      } catch (e) {
        notify("ลบไม่สำเร็จจ๊ะ", "error");
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-3">
        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
        <p className="text-xs font-black text-slate-300 tracking-[0.2em] uppercase italic">P'Prompt Wellness</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-36 text-left overflow-y-auto">
      {notification && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
            <Check size={16} className="text-emerald-400"/><span className="text-xs font-bold">{String(notification.msg)}</span>
        </div>
      )}
      
      <header className="bg-white px-6 pt-12 pb-8 rounded-b-[3.5rem] shadow-sm border-b border-slate-100 mb-8 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2 text-left">
          <div className="text-left">
            <h1 className="text-2xl font-black text-slate-800 leading-tight">ดูแลใจ</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Mental Wellness Space</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm">
            <Heart size={22} fill="currentColor"/>
          </div>
        </div>
        {dbError && (
          <div className="max-w-4xl mx-auto mt-4 px-2">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center gap-3 text-amber-700 text-xs font-bold italic text-left">
              <AlertTriangle size={18} className="shrink-0" /> {String(dbError)}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10 text-left">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            <div className="text-left flex-1">
              <h2 className="text-xl font-black text-slate-800 mb-1 leading-tight">วันนี้เป็นยังไงบ้างครับ?</h2>
              <p className="text-sm text-slate-400 font-medium italic">มาเล่าเรื่องราวให้พี่พร้อมฟังได้เสมอนะครับ</p>
            </div>
            <button onClick={() => setShowModal(true)} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all shrink-0">
                <MessageCircle size={20} /> บันทึกใจวันนี้
            </button>
        </div>

        <div className="space-y-6 text-left">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 px-4 italic text-left"><History size={20} className="text-slate-400"/> บันทึกที่ผ่านมา</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {healthEntries.length === 0 ? (
                  <div className="col-span-full py-20 text-center text-slate-300 italic text-sm font-bold opacity-50 border-2 border-dashed border-slate-100 rounded-[3rem]">
                    ยังไม่มีบันทึกใจนะจ๊ะ...
                  </div>
                ) : (
                  healthEntries.map(entry => {
                    const mood = MOODS.find(m => m.id === entry.moodLevel);
                    return (
                        <div key={entry.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative group text-left flex flex-col">
                            <div className="flex justify-between items-start mb-6 text-left">
                                <div className={`w-14 h-14 ${mood?.color} rounded-3xl flex items-center justify-center text-3xl shadow-sm`}>{mood?.emoji}</div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-slate-300 mb-2">{String(entry.date)}</p>
                                  <button onClick={() => deleteEntry(entry.id)} className="text-slate-200 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-700 font-bold leading-relaxed mb-6 italic text-left">"{String(entry.story)}"</p>
                            {entry.aiResponse && (
                                <div className="mt-auto p-5 bg-indigo-50/50 rounded-[2rem] border border-dashed border-indigo-100 text-left">
                                    <div className="flex items-center gap-2 mb-2 text-indigo-600"><Sparkles size={14}/><p className="text-[10px] font-black uppercase tracking-widest italic text-left">พี่พร้อมอยากบอกว่า...</p></div>
                                    <p className="text-xs text-slate-600 font-medium leading-relaxed text-left">{String(entry.aiResponse)}</p>
                                </div>
                            )}
                        </div>
                    );
                  })
                )}
            </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative animate-in zoom-in duration-300 shadow-2xl my-auto text-left font-sans">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-indigo-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-rose-200 decoration-8 text-left font-serif">บันทึกใจวันนี้</h2>
            <form onSubmit={saveEntry} className="space-y-10 text-left">
                <div className="space-y-4 text-left">
                    <label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em] text-left">ความรู้สึกตอนนี้เป็นอย่างไรจ๊ะ</label>
                    <div className="flex justify-between px-2 text-left">
                        {MOODS.map(m => (
                            <button key={m.id} type="button" onClick={() => setMoodLevel(m.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${moodLevel === m.id ? 'bg-indigo-50 scale-125' : 'opacity-30 grayscale hover:grayscale-0'}`}>
                                <span className="text-3xl">{m.emoji}</span>
                                <span className={`text-[8px] font-black uppercase ${moodLevel === m.id ? 'text-indigo-600' : 'text-slate-400'}`}>{String(m.name)}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">เรื่องราวในใจคุณ</label>
                    <span className="text-[10px] text-slate-300 font-bold">{story.length}/500</span>
                  </div>
                  <textarea value={story} onChange={(e) => setStory(e.target.value.slice(0, 500))} required rows="5" placeholder="เล่าให้พี่พร้อมฟังได้เสมอนะครับ..." className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 text-sm outline-none focus:ring-2 focus:ring-rose-100 shadow-inner font-medium leading-relaxed text-left"></textarea>
                </div>
                <button type="submit" disabled={isAiAnalyzing || !story.trim()} className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                  {isAiAnalyzing ? <><Loader2 className="animate-spin w-5 h-5"/> พี่พร้อมกำลังตั้งใจอ่าน...</> : "บันทึกเรื่องราววันนี้"}
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
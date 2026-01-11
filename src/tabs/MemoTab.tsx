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
  Plus, Trash2, StickyNote, Palette, X, Loader2, Check, AlertTriangle, ShieldCheck
} from "lucide-react";

// --- 1. Firebase Configuration ---
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

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); 

const NOTE_COLORS = [
  { key: "orange", bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-400", ring: "ring-orange-200" },
  { key: "yellow", bg: "bg-yellow-50", border: "border-yellow-100", dot: "bg-yellow-400", ring: "ring-yellow-200" },
  { key: "emerald", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-400", ring: "ring-emerald-200" },
  { key: "sky", bg: "bg-sky-50", border: "border-sky-100", dot: "bg-sky-400", ring: "ring-sky-200" },
  { key: "violet", bg: "bg-violet-50", border: "border-violet-100", dot: "bg-violet-400", ring: "ring-violet-200" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dbError, setDbError] = useState(null);
  const [userStatus] = useState('เพื่อนผู้มีพระคุณ');

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- 2. Strict Authentication Logic (Rule 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth process error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- 3. Data Fetching with Error Handling (Rule 1 & 3) ---
  useEffect(() => {
    if (!user) return;

    setDbError(null);
    const notesPath = `artifacts/${appId}/users/${user.uid}/notes`;
    const notesRef = ref(db, notesPath);

    // Error callback is mandatory to catch permission_denied
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val() ? Object.values(snapshot.val()) : [];
      setNotes(data.sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.error("Firebase Read Error:", error);
      if (error.code === 'PERMISSION_DENIED') {
        setDbError("การเชื่อมต่อข้อมูลถูกจำกัดจ๊ะ กรุณารอสักครู่นะจ๊ะ");
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- 4. Database Operations ---
  const saveNote = async (e) => {
    e.preventDefault();
    if (!user) return;

    const fd = new FormData(e.target);
    const id = Date.now().toString();
    const newNote = {
      id,
      title: fd.get('title'),
      content: fd.get('content'),
      color: fd.get('color'),
      createdAt: Date.now()
    };

    try {
      const targetRef = ref(db, `artifacts/${appId}/users/${user.uid}/notes/${id}`);
      await set(targetRef, newNote);
      setShowModal(false);
      notify("บันทึกโน้ตเรียบร้อยแล้วจ๊ะ");
    } catch (e) { 
      console.error("Save Error:", e);
      notify("บันทึกไม่สำเร็จจ๊ะ", "error"); 
    }
  };

  const deleteNote = async (id) => {
    if (!user) return;
    if (window.confirm("ต้องการลบโน้ตนี้ใช่ไหมจ๊ะ?")) {
      try {
        await dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/notes/${id}`));
        notify("ลบโน้ตแล้วจ๊ะ");
      } catch (e) { 
        console.error("Delete Error:", e);
        notify("ลบไม่สำเร็จจ๊ะ", "error"); 
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-3">
      <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
      <p className="text-xs font-black text-slate-400 tracking-widest uppercase italic">พี่พร้อมแพลนเนอร์</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-24 text-left p-4 sm:p-8 overflow-y-auto">
      {/* แจ้งเตือน */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-indigo-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          {notification.type === 'error' ? <AlertTriangle size={16}/> : <Check size={16}/>}
          <span className="text-xs font-black">{notification.msg}</span>
        </div>
      )}

      <header className="max-w-4xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-2">
          <div className="text-left">
            <h1 className="text-3xl font-black text-slate-800">สมุดโน้ต</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Private Memo Box</p>
          </div>
          <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100 flex items-center gap-1 shadow-sm">
            <ShieldCheck size={12} /> {userStatus}
          </div>
        </div>

        {/* แจ้งเตือนข้อผิดพลาดฐานข้อมูล */}
        {dbError && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 text-xs font-bold animate-in fade-in">
            <AlertTriangle size={18} className="shrink-0" />
            <p>{dbError}</p>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 px-2">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic tracking-[0.2em]">บันทึกส่วนตัว</p>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm active:scale-95">
            <Plus size={16} /> เขียนบันทึกใหม่
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3.5rem] border border-slate-100 shadow-inner opacity-50 flex flex-col items-center">
            <StickyNote size={64} className="text-slate-100 mb-6" />
            <p className="text-sm font-bold text-slate-400 tracking-wide uppercase italic text-center">Empty Memory Box</p>
            <p className="text-[10px] text-slate-300 mt-2 font-medium italic text-center">จดไอเดีย หรือเรื่องสำคัญไว้ที่นี่นะจ๊ะ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => {
              const style = NOTE_COLORS.find(c => c.key === note.color) || NOTE_COLORS[0];
              return (
                <div key={note.id} className={`${style.bg} ${style.border} border-2 rounded-[2.5rem] p-8 shadow-sm relative group hover:shadow-2xl hover:-translate-y-1 transition-all overflow-hidden text-left`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-4 h-4 rounded-full ${style.dot} shadow-lg ring-4 ${style.ring}`} />
                    <button onClick={() => deleteNote(note.id)} className="text-slate-300 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm mb-3 leading-tight text-left">{note.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium text-left">{note.content}</p>
                  <div className="mt-8 pt-5 border-t border-black/5 flex justify-between items-center opacity-30 italic">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[7px]">Sticky Note</span>
                    <span className="text-[9px] font-bold">{new Date(note.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* หน้าต่างป๊อปอัพเขียนโน้ต */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative animate-in zoom-in duration-300 shadow-2xl my-auto text-left">
            <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
              <X size={22} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3 underline decoration-indigo-200 decoration-8 text-left font-serif">จดบันทึกใหม่</h2>
            <form onSubmit={saveNote} className="space-y-8 text-left">
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em] text-left">หัวข้อโน้ต</label>
                <input name="title" required placeholder="เรื่องสำคัญวันนี้..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner font-bold" />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[11px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">เนื้อหา</label>
                <textarea name="content" rows="5" placeholder="จดสิ่งที่อยากจำไว้จ๊ะ..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner font-medium"></textarea>
              </div>
              <div className="space-y-4 text-left">
                <label className="text-[11px] font-black text-slate-400 ml-4 uppercase flex items-center gap-2 text-left tracking-widest"><Palette size={14}/> เลือกสีโน้ต</label>
                <div className="flex gap-4 px-3 text-left">
                  {NOTE_COLORS.map(c => (
                    <label key={c.key} className="cursor-pointer text-left">
                      <input type="radio" name="color" value={c.key} defaultChecked={c.key === 'orange'} className="hidden peer" />
                      <div className={`w-11 h-11 rounded-full ${c.dot} transition-all peer-checked:ring-4 ${c.ring} shadow-lg peer-checked:scale-110 active:scale-95`} />
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-black transition-all active:scale-95 mt-4">บันทึกโน้ตนี้จ๊ะ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
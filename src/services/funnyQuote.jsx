import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Laugh, 
  Quote, 
  Ghost, 
  IceCream, 
  Rocket,
  Zap,
  RefreshCw,
  Settings2,
  Check,
  Loader2,
  UserCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// --- 1. การตั้งค่าระบบ (Firebase Configuration) ---
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
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';

// URL สำหรับดึงข้อมูลจาก Google Sheets (Export as CSV)
const SHEET_ID = "1LC1mBr7ZtAFamAf9zpqT20Cp5g8ySTx5XY1n_14HDDU";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

const RANDOM_ICONS = [
  <Ghost className="text-purple-400" />,
  <IceCream className="text-rose-400" />,
  <Laugh className="text-amber-400" />,
  <Zap className="text-yellow-400" />,
  <Sparkles className="text-pink-400" />,
  <Rocket className="text-sky-400" />,
  <RefreshCw className="text-emerald-400" />
];

export default function App() {
  const [user, setUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [currentQuote, setCurrentQuote] = useState({ text: "กำลังโหลดคำคมจ๊ะ...", icon: RANDOM_ICONS[0] });
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({ frequency: 'always', lastShown: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // --- 2. การจัดการสิทธิ์ (Rule 3) ---
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
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- 3. ดึงข้อมูลจาก Google Sheets (ปรับปรุงการดึงข้อมูลเพื่อรักษาบรรทัดใหม่) ---
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        
        /**
         * ระบบ Parse CSV แบบแม่นยำสูง (Manual Parse):
         * ช่วยให้สามารถเก็บ "ขึ้นบรรทัดใหม่" ที่อยู่ภายใน Cell ของ Google Sheets ได้จ๊ะ
         */
        const fetchedQuotes = [];
        let currentRow = '';
        let inQuotes = false;

        for (let i = 0; i < csvData.length; i++) {
          const char = csvData[i];
          if (char === '"') inQuotes = !inQuotes; // ตรวจสอบว่าอยู่ในเครื่องหมายคำพูดไหม
          
          // ถ้าเจอการขึ้นบรรทัดใหม่ และไม่ได้อยู่ในเครื่องหมายคำพูด แสดงว่าเป็นจบแถว
          if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentRow.trim()) {
              // ลบเครื่องหมายคำพูดครอบหัวท้าย และเปลี่ยน "" เป็น " ตามมาตรฐาน CSV
              const cleaned = currentRow.trim()
                .replace(/^"|"$/g, '')
                .replace(/""/g, '"');
              fetchedQuotes.push(cleaned);
            }
            currentRow = '';
          } else {
            currentRow += char;
          }
        }
        // เก็บแถวสุดท้าย
        if (currentRow.trim()) {
          fetchedQuotes.push(currentRow.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        }

        if (fetchedQuotes.length > 0) {
          setQuotes(fetchedQuotes);
          setIsDataLoaded(true);
        }
      } catch (error) {
        console.error("Fetch Sheet Error:", error);
        setQuotes(["ถ้าหัวใจคุณยังว่าง\nลองมาวางแผนงานกับพี่พร้อมดูไหมจ๊ะ"]); 
      }
    };

    fetchQuotes();
  }, []);

  // --- 4. ตรวจสอบเงื่อนไขการแสดงผลอัตโนมัติ ---
  useEffect(() => {
    if (!user || !isDataLoaded) return;

    const checkAndShow = async () => {
      const configRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'funny_quote_config');
      const snap = await getDoc(configRef);
      
      let userConfig = { frequency: 'always', lastShown: 0 };
      if (snap.exists()) {
        userConfig = snap.data();
      }
      setConfig(userConfig);

      if (userConfig.frequency === 'off') return;

      if (userConfig.frequency === 'daily') {
        const lastDate = new Date(userConfig.lastShown).toDateString();
        const todayDate = new Date().toDateString();
        if (lastDate === todayDate) return; 
      }

      const showTimeout = setTimeout(() => {
        handleRandomQuote();
        setIsVisible(true);
        updateDoc(configRef, { lastShown: Date.now() }).catch(() => {
          setDoc(configRef, { ...userConfig, lastShown: Date.now() }, { merge: true });
        });
      }, 1500);

      return () => clearTimeout(showTimeout);
    };

    checkAndShow();
  }, [user, isDataLoaded]);

  const handleRandomQuote = () => {
    if (quotes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomIconIndex = Math.floor(Math.random() * RANDOM_ICONS.length);
    setCurrentQuote({
      text: quotes[randomIndex],
      icon: RANDOM_ICONS[randomIconIndex]
    });
  };

  const updateFrequency = async (newFreq) => {
    if (!user) return;
    setIsSaving(true);
    const configRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'funny_quote_config');
    const newConfig = { ...config, frequency: newFreq };
    
    try {
      await setDoc(configRef, newConfig, { merge: true });
      setConfig(newConfig);
      if (newFreq === 'off') setIsVisible(false);
      setShowSettings(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible && !showSettings) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-50 relative overflow-hidden animate-in zoom-in duration-500">
        
        {/* Background Decos */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-60"></div>

        {/* Top Controls */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-all ${showSettings ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-300 hover:text-indigo-400'}`}
          >
            <Settings2 size={18} />
          </button>
          <button 
            onClick={() => { setIsVisible(false); setShowSettings(false); }}
            className="p-2 bg-slate-50 text-slate-300 hover:text-slate-600 rounded-full transition-all active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-10 text-center relative z-10">
          {showSettings ? (
            <div className="py-6 animate-in slide-in-from-bottom-4 duration-300 text-left">
              <h3 className="text-lg font-black text-slate-800 mb-2 underline decoration-indigo-200 decoration-4 text-center">ตั้งค่าการทักทาย</h3>
              <p className="text-[10px] text-slate-400 font-bold mb-6 flex items-center justify-center gap-1 text-center">
                <UserCircle size={12} /> ปรับแต่งได้ที่หน้าโปรไฟล์เช่นกันจ๊ะ
              </p>
              
              <div className="space-y-3">
                {[
                  { id: 'always', label: "ทักทายทุกครั้งที่เข้าแอป", desc: "โผล่มาให้หายคิดถึงทุกรอบเลยจ๊ะ" },
                  { id: 'daily', label: "ทักทายวันละครั้งพอ", desc: "เจอกันวันละหนกำลังดีนะจ๊ะ" },
                  { id: 'off', label: "ปิดการทักทาย", desc: "พี่พร้อมจะไม่เด้งออกมากวนใจจ๊ะ" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    disabled={isSaving}
                    onClick={() => updateFrequency(opt.id)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${config.frequency === opt.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 bg-white hover:border-indigo-200'}`}
                  >
                    <div>
                      <p className={`text-xs font-black ${config.frequency === opt.id ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{opt.desc}</p>
                    </div>
                    {config.frequency === opt.id && <Check size={16} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
              
              {isSaving && <div className="mt-4 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={20}/></div>}
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-3xl mx-auto mb-8 border border-slate-50 animate-bounce duration-[2000ms]">
                {currentQuote.icon}
              </div>

              <div className="flex justify-center mb-4 opacity-10">
                <Quote size={40} className="fill-indigo-600 text-indigo-600" />
              </div>

              {/* ส่วนแสดงผลคำคม: ใช้ whitespace-pre-wrap เพื่อรองรับการขึ้นบรรทัดใหม่ตามที่พิมพ์ไว้จ๊ะ */}
              <div className="min-h-[100px] flex items-center justify-center px-2 text-left">
                <h3 className="text-lg font-black text-slate-800 leading-relaxed italic whitespace-pre-wrap">
                  "{currentQuote.text}"
                </h3>
              </div>

              <div className="mt-10 flex flex-col gap-4">
                <button 
                  onClick={handleRandomQuote}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} strokeWidth={3} />
                  เอาอีกจ๊ะพี่พร้อม
                </button>
                <button 
                  onClick={() => setIsVisible(false)}
                  className="w-full py-2 text-[10px] font-black text-slate-300 hover:text-slate-500 transition-colors uppercase tracking-widest"
                >
                  พอแล้วจ๊ะ ขอบคุณนะ
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 w-full"></div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { 
  getDatabase, ref, set, onValue, push, update, remove as dbRemove 
} from "firebase/database";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { 
  CheckCircle, Sparkles, Clock, ListTodo, Loader2, ChevronRight,
  CalendarDays, CheckCircle2, Info, ShieldCheck, Plus, Trash2,
  BrainCircuit, Calendar as CalendarIcon, Briefcase, Target, Bell,
  ChevronLeft, LayoutGrid, Zap, X, AlertTriangle, Flag, Rocket,
  Mountain, MapPin, Repeat, BarChart3
} from "lucide-react";

// --- 1. การตั้งค่า Firebase ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "",
      authDomain: "p-prompt.firebaseapp.com",
      databaseURL: "https://p-prompt-default-rtdb.firebaseio.com",
      projectId: "p-prompt",
      storageBucket: "p-prompt.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:abcdef"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'p-prompt-planner';
const appId = rawAppId.replace(/[.#$[\]]/g, '_'); 

// --- 2. ส่วนประกอบย่อย: แจ้งเตือน ---
const Notification = ({ item }) => (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
    <div className={`px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border ${item.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-900 text-white border-indigo-800'}`}>
      {item.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
      <span className="text-xs font-black">{item.msg}</span>
    </div>
  </div>
);

// --- 3. คอมโพเนนต์หลัก (ตั้งชื่อ App เพื่อให้ Preview ทำงาน) ---
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState('เพื่อนผู้มีพระคุณ');
  const [dbError, setDbError] = useState(null);
  const [notification, setNotification] = useState(null);

  // สถานะข้อมูล
  const [appointments, setAppointments] = useState([]);
  const [todos, setTodos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [aiSortedTasks, setAiSortedTasks] = useState(null);

  // สถานะปฏิทิน
  const [cMonth, setCMonth] = useState(new Date().getMonth());
  const [cYear, setCYear] = useState(new Date().getFullYear());

  // การควบคุม Modal
  const [showApptModal, setShowApptModal] = useState(false);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const daysInM = useMemo(() => new Date(cYear, cMonth + 1, 0).getDate(), [cYear, cMonth]);
  const firstD = useMemo(() => new Date(cYear, cMonth, 1).getDay(), [cYear, cMonth]);

  const renderStrategyIcon = (type) => {
    switch (type) {
      case 'calendar': return <CalendarIcon size={12} />;
      case 'rocket': return <Rocket size={12} />;
      case 'mountain': return <Mountain size={12} />;
      case 'briefcase': return <Briefcase size={12} />;
      default: return <ListTodo size={12} />;
    }
  };

  // --- 4. การจัดการ Authentication & Data (Rule 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Failure:", err); }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const pPath = `artifacts/${appId}/users/${user.uid}`;
    const pubPath = `artifacts/${appId}/public/data/users/${user.uid}`;
    
    const hErr = (e) => { if(e.code === 'PERMISSION_DENIED') setDbError("สิทธิ์การเข้าถึงขัดข้องจ๊ะ"); };

    const unsubs = [
      onValue(ref(db, `${pubPath}/status`), (s) => s.exists() && setUserStatus(String(s.val())), hErr),
      onValue(ref(db, `${pPath}/appointments`), (s) => setAppointments(s.val() ? Object.values(s.val()) : []), hErr),
      onValue(ref(db, `${pPath}/todos`), (s) => setTodos(s.val() ? Object.values(s.val()) : []), hErr),
      onValue(ref(db, `${pPath}/projects`), (s) => setProjects(s.val() ? Object.values(s.val()) : []), hErr)
    ];
    return () => unsubs.forEach(un => un());
  }, [user]);

  // --- 5. กลยุทธ์การจัดลำดับงาน AI ---
  const handleAiSort = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setIsAiProcessing(true);
    
    setTimeout(() => {
      // 1. ดึงนัดหมาย
      const appts = appointments.filter(a => a.startDate === todayStr).map(a => ({ 
        ...a, type: 'นัดหมาย', subType: 'fixed', priority: 'High', time: a.startTime, iconType: 'calendar', typeLabel: 'นัดหมาย' 
      }));
      
      // 2. ดึงงานที่ต้องทำ (วิเคราะห์ Quick Win/Big Rock)
      const tdos = todos.map(t => {
        const isQuickWin = t.title.length < 15 || /ตอบ|ส่ง|เช็ค|จ่าย|โอน|ซื้อ|โทร/.test(t.title);
        return { 
          ...t, type: 'งานที่ต้องทำ', subType: isQuickWin ? 'quick_win' : 'big_rock', 
          priority: t.priority || 'Medium', iconType: isQuickWin ? 'rocket' : 'mountain',
          typeLabel: isQuickWin ? 'ทำได้ทันที' : 'งานสำคัญ'
        };
      });

      // 3. ดึงงานโครงการ
      const projs = projects.flatMap(p => (p.tasks || []).map(t => ({ 
        ...t, title: `${t.title} (${p.name})`, type: 'โครงการ', subType: 'big_rock', 
        priority: 'Medium', iconType: 'briefcase', typeLabel: 'งานโครงการ'
      })));
      
      const all = [...appts, ...tdos, ...projs];
      if (all.length === 0) { setIsAiProcessing(false); return notify("ยังไม่มีงานวันนี้จ๊ะ", "info"); }

      const sorted = all.sort((a, b) => {
        if (a.subType === 'fixed' && b.subType !== 'fixed') return -1;
        if (a.subType !== 'fixed' && b.subType === 'fixed') return 1;
        if (a.subType === 'fixed') return a.time.localeCompare(b.time);
        if (a.subType === 'quick_win' && b.subType !== 'quick_win') return -1;
        if (a.subType !== 'quick_win' && b.subType === 'quick_win') return 1;
        const pMap = { High: 1, Medium: 2, Low: 3 };
        return (pMap[a.priority] || 3) - (pMap[b.priority] || 3);
      });

      setAiSortedTasks(sorted);
      setIsAiProcessing(false);
      notify("เรียงลำดับแผนงานให้แล้วจ๊ะ");
    }, 1500);
  };

  const handleSave = async (coll, data, close) => {
    const id = Date.now().toString();
    await set(ref(db, `artifacts/${appId}/users/${user.uid}/${coll}/${id}`), { ...data, id });
    close();
    notify("บันทึกสำเร็จจ๊ะ");
  };

  const handleDelete = async (coll, id) => {
    if (window.confirm("ลบรายการนี้ใช่ไหมจ๊ะ?")) {
        await dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/${coll}/${id}`));
        notify("ลบแล้วจ๊ะ");
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white gap-4">
      <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      <p className="text-xs font-black text-slate-400 tracking-[0.3em]">พี่พร้อมแพลนเนอร์</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-slate-900 pb-36 text-left overflow-y-auto">
      {notification && <Notification item={notification} />}
      
      {/* 1. Header */}
      <header className="bg-white px-6 pt-12 pb-8 rounded-b-[3.5rem] shadow-sm border-b border-slate-100 mb-6 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-2">
          <div className="text-left">
            <h1 className="text-2xl font-black text-slate-800">งานของคุณ</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Strategic Workspace</p>
          </div>
          <div className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100 shadow-sm flex items-center gap-1">
            <ShieldCheck size={12} /> {userStatus}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="space-y-12 pb-20">
            
            {/* AI Sorting Card */}
            <div className="bg-gradient-to-br from-[#1e1b4b] to-[#4338ca] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 text-left">
                    <h2 className="text-lg font-bold mb-1 opacity-95 flex items-center gap-2">
                        <BrainCircuit size={20} className="text-amber-400" /> แผนการจัดการวันนี้
                    </h2>
                    <p className="text-xs opacity-60 mb-6 leading-relaxed font-light">วิเคราะห์งานโครงการ นัดหมาย และสิ่งที่ต้องทำให้อัตโนมัติจ๊ะ</p>
                    <button 
                        onClick={handleAiSort} 
                        disabled={isAiProcessing} 
                        className="w-full sm:w-auto px-12 bg-white text-indigo-900 py-4 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                    >
                        {isAiProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <><BrainCircuit size={14} className="text-indigo-600" /> พี่พร้อมช่วยเรียง</>}
                    </button>
                </div>
                <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl transition-all"></div>
            </div>

            {/* AI Results */}
            {aiSortedTasks && (
                <div className="bg-white border-2 border-indigo-100 rounded-[2.5rem] p-6 sm:p-8 animate-in zoom-in duration-500 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-8 text-indigo-600">
                        <Sparkles size={18} />
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] italic">ลำดับงานแนะนำโดยพี่พร้อม</p>
                    </div>
                    <div className="space-y-4">
                        {aiSortedTasks.map((t, idx) => (
                            <div key={idx} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all ${t.subType === 'quick_win' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : t.subType === 'fixed' ? 'bg-indigo-50 border-indigo-100 shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                                <span className={`w-7 h-7 text-white text-[11px] font-black rounded-xl flex items-center justify-center shrink-0 shadow-lg ${t.subType === 'quick_win' ? 'bg-emerald-500' : 'bg-indigo-900'}`}>{idx+1}</span>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-black text-slate-800 truncate mb-1">{t.title}</p>
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center gap-1 text-[8px] font-black text-slate-500 bg-white/60 px-2 py-0.5 rounded-lg border border-slate-100 uppercase">
                                            {renderStrategyIcon(t.iconType)} {t.typeLabel}
                                        </span>
                                        {t.subType === 'fixed' && <span className="text-[8px] font-black text-indigo-500">{t.time} น.</span>}
                                    </div>
                                </div>
                                {t.priority === 'High' && <Flag size={14} className="text-red-500 fill-red-500 animate-pulse" />}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setAiSortedTasks(null)} className="w-full text-[10px] text-slate-300 font-black mt-8 hover:text-indigo-600 uppercase tracking-widest text-center">ย่อแผนงาน</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Mini Calendar */}
                <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-full text-left">
                    <div className="flex justify-between items-center mb-6 px-1">
                        <span className="font-black text-sm text-slate-700 flex items-center gap-2 font-serif text-left">
                            <CalendarIcon size={16} className="text-indigo-400" />
                            {new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' }).format(new Date(cYear, cMonth))}
                        </span>
                        <div className="flex gap-1 text-left">
                            <button onClick={() => setCMonth(m => m - 1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft size={16} /></button>
                            <button onClick={() => setCMonth(m => m + 1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-4 opacity-40 uppercase text-[9px] font-black">
                        {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => <span key={d}>{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {Array(firstD).fill(null).map((_, i) => <div key={i} />)}
                        {Array.from({ length: daysInM }, (_, i) => i + 1).map(day => (
                            <div key={day} className={`relative h-10 flex items-center justify-center text-xs font-black rounded-2xl transition-all ${day === new Date().getDate() && cMonth === new Date().getMonth() ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}>
                                {day}
                                {appointments.some(a => a.startDate === `${cYear}-${(cMonth+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`) && <div className="absolute bottom-1.5 w-1 h-1 bg-red-500 rounded-full" />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center px-1 text-left">
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">เพิ่มนัดหมายใหม่</span>
                        <button onClick={() => setShowApptModal(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all hover:bg-indigo-700">
                            <Plus size={22} />
                        </button>
                    </div>
                </div>

                {/* Tasks List */}
                <section className="text-left">
                    <div className="flex justify-between items-center mb-6 px-2">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <ListTodo className="text-indigo-600" size={24} /> งานที่ต้องทำ
                        </h2>
                        <button onClick={() => setShowTodoModal(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all hover:bg-indigo-700">
                            <Plus size={22} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {todos.length === 0 ? (
                            <div className="py-12 bg-white rounded-[2.5rem] border border-slate-100 text-center flex flex-col items-center justify-center opacity-40">
                                <Rocket size={32} className="mb-3" /><p className="text-[10px] font-black uppercase tracking-widest">ว่างงานจ๊ะ</p>
                            </div>
                        ) : (
                            todos.slice(0, 5).map(t => (
                                <div key={t.id} className="bg-white p-5 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-all hover:translate-x-1 group text-left">
                                    <div className="w-7 h-7 rounded-xl border-2 border-slate-100 flex items-center justify-center bg-white"><CheckCircle size={16} className="text-slate-100 group-hover:text-indigo-500" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-black text-slate-800 truncate mb-1 leading-tight">{t.title}</h4>
                                        <span className="text-[8px] text-slate-300 font-bold italic tracking-wider uppercase">กำหนดส่ง: {t.deadline}</span>
                                    </div>
                                    <button onClick={() => handleDelete('todos', t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all"><Trash2 size={14}/></button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            {/* Projects Section */}
            <section className="text-left">
                <div className="flex justify-between items-center mb-8 px-2">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Briefcase className="text-indigo-600" size={24} /> โครงการ
                    </h2>
                    <button onClick={() => setShowProjectModal(true)} className="flex items-center gap-2 text-[11px] font-black text-white bg-indigo-600 px-6 py-2.5 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all shadow-indigo-100">
                        <Plus size={16} /> เริ่มโครงการใหม่
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projects.map(proj => (
                        <div key={proj.id} className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden hover:border-indigo-100 transition-all group text-left">
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="flex gap-1.5">{proj.quarters?.map(q => <span key={q} className="text-[9px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-lg uppercase tracking-tighter border border-slate-100 shadow-sm">{q}</span>)}</div>
                            </div>
                            <h4 className="text-base font-black text-slate-800 mb-2 leading-tight">{proj.name}</h4>
                            <p className="text-[11px] text-slate-400 line-clamp-2 mb-6 italic opacity-80 border-l-2 border-indigo-50 pl-3">เป้าหมาย: {proj.goal}</p>
                            <div className="flex justify-between items-center pt-5 border-t border-slate-50/80">
                                <div className="flex items-center gap-1.5 text-indigo-700 font-black">
                                    <span className="text-xs italic text-indigo-300">฿</span>
                                    <span className="text-sm tracking-tight">{new Intl.NumberFormat('th-TH').format(proj.budget)} บาท</span>
                                </div>
                                <button className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl hover:bg-amber-100 transition-all border border-amber-100 shadow-sm">
                                    <Zap size={14} fill="currentColor" /> พี่พร้อมช่วยคิด
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </main>

      {/* 6. Modals Section */}
      
      {/* Appointment Modal */}
      {showApptModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto text-left font-sans">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative animate-in zoom-in duration-300 shadow-2xl my-auto text-left font-sans">
            <button onClick={() => setShowApptModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-indigo-200 decoration-8 text-left font-serif font-sans">บันทึกนัดหมายใหม่</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('appointments', { 
                  title: fd.get('title'), startDate: fd.get('startDate'), startTime: fd.get('startTime'), 
                  endDate: fd.get('endDate'), endTime: fd.get('endTime'), location: fd.get('location'), 
                  repeat: fd.get('repeat'), reminder: Number(fd.get('reminder')) 
                }, () => setShowApptModal(false));
            }} className="space-y-6 text-left font-sans">
                <input name="title" required placeholder="พิมพ์หัวข้อนัดหมาย..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner font-bold" />
                <div className="grid grid-cols-2 gap-4 text-left font-sans"><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">เริ่ม</label><input name="startDate" type="date" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold shadow-inner" /></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">เวลา</label><input name="startTime" type="time" required className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold shadow-inner" /></div></div>
                <div className="grid grid-cols-2 gap-4 text-left font-sans"><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">สิ้นสุด</label><input name="endDate" type="date" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold shadow-inner" /></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">เวลา</label><input name="endTime" type="time" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold shadow-inner" /></div></div>
                <div className="space-y-1 text-left font-sans"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase tracking-widest"><MapPin size={10} className="inline mr-1"/> สถานที่</label><input name="location" placeholder="พิมพ์สถานที่ หรือ ระบุพิกัดเองจ๊ะ..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm shadow-inner font-bold outline-none" /></div>
                <div className="grid grid-cols-2 gap-4 text-left font-sans"><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">ทำซ้ำ</label><select name="repeat" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-sm font-black shadow-inner outline-none"><option value="none">ไม่ทำซ้ำ</option><option value="daily">ทุกวัน</option><option value="weekly">ทุกสัปดาห์</option></select></div><div className="space-y-1 text-left"><label className="text-[10px] font-black text-slate-400 ml-3 uppercase">แจ้งล่วงหน้า (นาที)</label><input name="reminder" type="number" defaultValue="15" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-sm font-black shadow-inner outline-none" /></div></div>
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[2rem] text-center font-bold text-indigo-700 text-[10px] italic leading-relaxed">
                   * พี่พร้อมจะส่งนัดหมายนี้ไปที่ Google Calendar ให้ท่านอัตโนมัติจ๊ะ
                </div>
                <button type="submit" className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl mt-4 active:scale-95 shadow-indigo-900/30">ยืนยันนัดหมายจ๊ะ</button>
            </form>
          </div>
        </div>
      )}

      {/* Todo Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative animate-in zoom-in duration-300 shadow-2xl my-auto text-left">
            <button onClick={() => setShowTodoModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 bg-slate-50 p-2 rounded-full"><X size={22} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-8 underline decoration-indigo-200 decoration-8 text-left font-serif">จดงานใหม่</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('todos', { title: fd.get('title'), priority: fd.get('priority'), deadline: fd.get('deadline'), completed: false }, () => setShowTodoModal(false));
            }} className="space-y-8 text-left">
                <input name="title" required placeholder="พิมพ์รายการงานที่นี่..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner font-bold" />
                <div className="grid grid-cols-2 gap-4 text-left"><input name="deadline" type="date" required className="bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-xs font-bold shadow-inner" /><select name="priority" className="bg-slate-50 border-none rounded-[1.5rem] px-6 py-5 text-sm font-black text-slate-700 shadow-inner outline-none"><option value="Low">ปกติ</option><option value="Medium">ปานกลาง</option><option value="High">ด่วนที่สุด</option></select></div>
                <button type="submit" className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.2rem] shadow-2xl hover:bg-indigo-800 mt-4 active:scale-95">บันทึกรายการงานจ๊ะ</button>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[4rem] p-10 sm:p-14 relative animate-in zoom-in duration-300 shadow-2xl my-auto text-left">
            <button onClick={() => setShowProjectModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-slate-600 p-2 rounded-full transition-colors"><X size={24} /></button>
            <h2 className="text-2xl font-black text-slate-800 mb-10 underline decoration-indigo-200 decoration-8 text-left">เริ่มต้นโครงการใหม่</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                handleSave('projects', { name: fd.get('name'), goal: fd.get('goal'), budget: Number(fd.get('budget')), quarters: Array.from(fd.getAll('quarters')), tasks: [] }, () => setShowProjectModal(false));
            }} className="space-y-8 text-left">
                <div className="space-y-2 text-left"><label className="text-[10px] font-black text-slate-400 ml-5 uppercase tracking-widest text-left">ชื่อโครงการ</label><input name="name" required placeholder="ระบุชื่อโครงการ..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm focus:ring-2 focus:ring-indigo-100 outline-none shadow-inner font-black" /></div>
                <div className="space-y-2 text-left"><label className="text-[10px] font-black text-slate-400 ml-5 uppercase tracking-widest text-left">เป้าหมายสูงสุด</label><textarea name="goal" rows="2" placeholder="โครงการนี้ทำไปเพื่ออะไรจ๊ะ..." className="w-full bg-slate-50 border-none rounded-[1.8rem] px-8 py-5 text-sm outline-none focus:ring-2 focus:ring-indigo-100 shadow-inner font-medium"></textarea></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left"><div className="space-y-2 text-left"><label className="text-[10px] font-black text-slate-400 ml-5 uppercase">งบประมาณ (บาท)</label><input name="budget" type="number" required placeholder="0" className="w-full bg-slate-50 border-none rounded-[1.5rem] px-8 py-5 text-sm font-black outline-none shadow-inner" /></div><div className="space-y-2 text-left"><label className="text-[10px] font-black text-slate-400 ml-5 uppercase text-left">ไตรมาส</label><div className="grid grid-cols-4 gap-1.5 px-1">{['Q1','Q2','Q3','Q4'].map(q=>(<label key={q} className="cursor-pointer text-left"><input type="checkbox" name="quarters" value={q} className="hidden peer"/><span className="flex items-center justify-center py-4 rounded-2xl bg-slate-50 text-[10px] font-black text-slate-400 peer-checked:bg-indigo-600 peer-checked:text-white transition-all shadow-sm border border-transparent peer-checked:border-indigo-500">{q}</span></label>))}</div></div></div>
                <button type="submit" className="w-full bg-indigo-900 text-white font-black py-6 rounded-[2.5rem] shadow-2xl hover:bg-indigo-800 transition-all mt-6 active:scale-95 shadow-indigo-900/40">อนุมัติการเริ่มโครงการจ๊ะ</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
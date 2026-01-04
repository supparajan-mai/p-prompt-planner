import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CheckSquare, Activity, Smile, Plus, Droplets, Moon, Coffee, Briefcase, Mail, Bell, LogOut, MapPin, Users, FileText, Wallet, TrendingUp, TrendingDown, Heart, X, Clock, Save, Map, Navigation, StickyNote, PenTool, Search, MoreVertical, Target, ChevronRight, Trash2, PieChart, Info, DollarSign, Sparkles, MessageCircle, Send, Footprints, Scale, BarChart2, Phone, User, MessageSquare, Laugh, AlertCircle, BellRing, Zap, CheckCircle2, Circle, ChevronDown, ListTodo
} from 'lucide-react';

// --- Configuration ---
const apiKey = ""; 
const GOOGLE_SHEET_ID = '1LC1mBr7ZtAFamAf9zpqT20Cp5g8ySTx5XY1n_14HDDU'; 

const AppLogo = ({ size = 80, className = "" }: { size?: number, className?: string }) => (
  <div style={{ width: size, height: size }} className={`bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl border-4 border-white/30 relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-white/10 rotate-45 translate-y-1/2"></div>
    <Users size={size * 0.55} className="drop-shadow-lg relative z-10" strokeWidth={2.5} />
    <Heart size={size * 0.18} className="absolute bottom-2.5 right-2.5 text-white/60 fill-current animate-pulse" />
  </div>
);

// --- Types ---
interface Todo { id: number; text: string; priority: 'ด่วนมาก' | 'ด่วน' | 'ปกติ'; completed: boolean; deadline?: string; notified?: boolean; }
interface ProjectTask { id: number; text: string; completed: boolean; }
interface Project { id: number; name: string; targetArea?: string; quarter?: string; budget?: number; note?: string; tasks: ProjectTask[]; }
interface CalendarEvent { id: number; title: string; startTime: string; endTime?: string; date: string; location?: string; notified?: boolean; }
interface Transaction { id: number; title: string; amount: number; type: 'income' | 'expense'; date: string; }
interface Memo { id: number; title: string; content: string; color: string; date: string; }

const DEFAULT_QUOTES = ["รอยยิ้มชาวบ้าน คือพลังของพวกเรา", "เป็นพัฒนากร ต้องอดทนสิบล้อชนต้องไม่ตาย", "เพื่อนคู่คิด ไปไหนไปกัน"];

const App = () => {
  const [activeTab, setActiveTab] = useState<'work' | 'memo' | 'finance' | 'health'>('work');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('p_prompt_login') === 'true');

  // --- States ---
  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('p_todos') || '[]'));
  const [projects, setProjects] = useState<Project[]>(() => JSON.parse(localStorage.getItem('p_projects') || '[]'));
  const [memos, setMemos] = useState<Memo[]>(() => JSON.parse(localStorage.getItem('p_memos') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('p_trans') || '[]'));
  const [events, setEvents] = useState<CalendarEvent[]>(() => JSON.parse(localStorage.getItem('p_events') || '[]'));
  
  // Health
  const [waterIntake, setWaterIntake] = useState(() => Number(localStorage.getItem('p_water') || 0));
  const [steps, setSteps] = useState(() => Number(localStorage.getItem('p_steps') || 0));
  const [sleepHours, setSleepHours] = useState(() => Number(localStorage.getItem('p_sleep') || 7));
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('p_weight') || 65));
  const [height, setHeight] = useState(() => Number(localStorage.getItem('p_height') || 170));
  
  // UI States
  const [mood, setMood] = useState<number | null>(null);
  const [healthStory, setHealthStory] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWelcomeQuote, setShowWelcomeQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');
  const [notifPermission, setNotifPermission] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [activeAlerts, setActiveAlerts] = useState<CalendarEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'event' | 'task' | 'project' | 'memo' | 'transaction'>('event');
  const [formData, setFormData] = useState<any>({ color: 'bg-yellow-100', priority: 'ปกติ', quarter: '1' });
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  // State สำหรับจัดการงานย่อย (Task Manager Modal)
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<Project | null>(null);
  const [newTaskInput, setNewTaskInput] = useState("");

  // --- Auto-Save ---
  useEffect(() => {
    const data = { p_todos: todos, p_projects: projects, p_memos: memos, p_trans: transactions, p_events: events, p_water: waterIntake, p_steps: steps, p_sleep: sleepHours, p_weight: weight, p_height: height, p_prompt_login: isLoggedIn };
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
  }, [todos, projects, memos, transactions, events, waterIntake, steps, sleepHours, weight, height, isLoggedIn]);

  // --- Notification Logic ---
  const sendNotification = (title: string, body: string) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png',
          badge: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png',
          tag: 'p-prompt-alert',
          renotify: true,
          vibrate: [200, 100, 200]
        });
      });
    } else if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const handleRequestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') sendNotification("พี่พร้อม สแตนด์บาย!", "ระบบแจ้งเตือนเริ่มทำงานแล้วครับพี่");
    }
  };

  // --- 15 Mins Heartbeat ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nowMin = now.getHours() * 60 + now.getMinutes();

      const updated = events.map(e => {
        if (e.date === today && !e.notified) {
          const [h, m] = e.startTime.split(':').map(Number);
          const diff = (h * 60 + m) - nowMin;
          if (diff <= 15 && diff >= 0) {
            sendNotification(`นัดหมายสำคัญ!`, `${e.title} (เริ่ม ${e.startTime} น.)`);
            setActiveAlerts(prev => prev.find(a => a.id === e.id) ? prev : [...prev, e]);
            return { ...e, notified: true };
          }
        }
        return e;
      });
      if (JSON.stringify(updated) !== JSON.stringify(events)) setEvents(updated);
    }, 30000);
    return () => clearInterval(timer);
  }, [events]);

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/1`)
        .then(res => res.json())
        .then(data => {
          const quotes = data.map((i: any) => i.text || i.quote || Object.values(i)[0]).filter(Boolean);
          setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)] || DEFAULT_QUOTES[0]);
          setShowWelcomeQuote(true);
        }).catch(() => { setRandomQuote(DEFAULT_QUOTES[0]); setShowWelcomeQuote(true); });
    }
  }, [isLoggedIn]);

  const calculateBMIValue = () => {
    const h = height / 100;
    return h > 0 ? (weight / (h * h)).toFixed(1) : '0';
  };

  const getBMIStatusInfo = (bmi: number) => {
    if (bmi < 18.5) return { text: 'ผอมไปนิด', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (bmi < 23) return { text: 'หุ่นดีมาก', color: 'text-green-500', bg: 'bg-green-100' };
    if (bmi < 25) return { text: 'เริ่มท้วม', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'น้ำหนักเกิน', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const handleSaveItem = () => {
    const id = Date.now();
    if (addType === 'task' && formData.title) {
      setTodos([...todos, { id, text: formData.title, priority: formData.priority, completed: false, deadline: formData.date }]);
    } else if (addType === 'project' && formData.title) {
      setProjects([...projects, { id, name: formData.title, targetArea: formData.location, quarter: formData.quarter, budget: Number(formData.amount), note: formData.note, tasks: [] }]);
    } else if (addType === 'transaction' && formData.amount) {
      setTransactions([...transactions, { id, title: formData.title || (transactionType === 'income' ? 'รายรับ' : 'รายจ่าย'), amount: Number(formData.amount), type: transactionType, date: new Date().toLocaleDateString('th-TH') }]);
    } else if (addType === 'memo' && formData.title) {
      setMemos([...memos, { id, title: formData.title, content: formData.content || '', color: formData.color, date: new Date().toLocaleDateString('th-TH') }]);
    } else if (addType === 'event' && formData.title) {
      setEvents([...events, { id, title: formData.title, startTime: formData.startTime || '09:00', endTime: formData.endTime, date: formData.date || new Date().toISOString().split('T')[0], location: formData.location, notified: false }]);
    }
    setFormData({ color: 'bg-yellow-100', priority: 'ปกติ', quarter: '1' });
    setShowAddModal(false);
  };

  const deleteItem = (type: string, id: number) => {
    if (type === 'todo') setTodos(todos.filter(t => t.id !== id));
    if (type === 'project') {
        setProjects(projects.filter(p => p.id !== id));
        if (selectedProjectForTasks?.id === id) setSelectedProjectForTasks(null);
    }
    if (type === 'trans') setTransactions(transactions.filter(t => t.id !== id));
    if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
    if (type === 'event') setEvents(events.filter(e => e.id !== id));
  };

  // --- ระบบจัดการ Task ในโครงการ (Inside View) ---
  const addSubTask = () => {
    if (!selectedProjectForTasks || !newTaskInput) return;
    const newTask = { id: Date.now(), text: newTaskInput, completed: false };
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectForTasks.id) {
        const updatedTasks = [...p.tasks, newTask];
        const updatedP = { ...p, tasks: updatedTasks };
        setSelectedProjectForTasks(updatedP); // อัปเดตตัวที่กำลังเปิดอยู่ด้วย
        return updatedP;
      }
      return p;
    });
    
    setProjects(updatedProjects);
    setNewTaskInput("");
  };

  const toggleSubTask = (taskId: number) => {
    if (!selectedProjectForTasks) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectForTasks.id) {
        const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const updatedP = { ...p, tasks: updatedTasks };
        setSelectedProjectForTasks(updatedP);
        return updatedP;
      }
      return p;
    });
    
    setProjects(updatedProjects);
  };

  const deleteSubTask = (taskId: number) => {
    if (!selectedProjectForTasks) return;
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectForTasks.id) {
        const updatedTasks = p.tasks.filter(t => t.id !== taskId);
        const updatedP = { ...p, tasks: updatedTasks };
        setSelectedProjectForTasks(updatedP);
        return updatedP;
      }
      return p;
    });
    
    setProjects(updatedProjects);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-600 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="mb-8 transform hover:scale-110 transition-transform duration-500"><AppLogo size={140} /></div>
        <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">พี่พร้อม</h1>
        <p className="mb-12 opacity-90 font-medium text-lg text-orange-100 italic">"เพื่อนคู่คิด ไปไหนไปกัน"</p>
        <button onClick={() => setIsLoggedIn(true)} className="bg-black text-white px-12 py-5 rounded-[2.5rem] font-black w-full max-w-xs shadow-2xl active:scale-95 transition-all text-xl uppercase tracking-widest border-b-4 border-gray-800">เริ่มใช้งาน</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen max-w-md mx-auto relative shadow-2xl border-x border-gray-100 font-sans text-gray-900 overflow-hidden">
      
      {/* Banner Alerts */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-20 left-0 right-0 z-[100] px-4 pointer-events-none">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="bg-orange-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-slide-up pointer-events-auto mb-2 border-2 border-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl animate-pulse"><Bell size={20}/></div>
                <div><p className="text-[10px] font-black uppercase opacity-80 mb-1">นัดหมายสำคัญ!</p><p className="text-sm font-bold tracking-tight">{alert.title}</p></div>
              </div>
              <button onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))} className="p-2 hover:bg-white/10 rounded-full"><X size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <AppLogo size={50} className="rounded-2xl shadow-md" />
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-gray-900 leading-tight uppercase">พี่พร้อม</h2>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest leading-none">P'Prompt Surat</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => sendNotification("พี่พร้อม", "ยังสแตนด์บายช่วยพี่อยู่นะครับ! 😊")} className={`p-2 rounded-full transition-all ${notifPermission === 'granted' ? 'text-orange-500 bg-orange-50' : 'text-gray-300'}`}><BellRing size={22} /></button>
            <button onClick={() => setIsLoggedIn(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-1"><LogOut size={22} /></button>
        </div>
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar pb-32">
        {activeTab === 'work' && (
          <div className="p-4 space-y-6 animate-fade-in">
            
            {/* แถบสีน้ำเงิน */}
            {notifPermission !== 'granted' && (
               <div className="p-6 bg-indigo-600 text-white rounded-[2.5rem] flex items-start gap-4 shadow-xl relative overflow-hidden animate-slide-up">
                  <div className="absolute right-[-10px] top-[-10px] opacity-10"><BellRing size={80} /></div>
                  <AlertCircle className="shrink-0 mt-1" size={24} />
                  <div className="flex-1 relative z-10">
                      <p className="text-sm font-black mb-1 uppercase tracking-tight leading-none">เปิดแจ้งเตือนไหมครับ?</p>
                      <p className="text-[10px] opacity-80 mt-2 mb-4 font-medium leading-relaxed">ผมจะคอยสะกิดเตือนเวลามีนัดล่วงหน้า 15 นาที ไม่ให้พี่พลาดงานสำคัญครับ</p>
                      <button onClick={handleRequestPermission} className="bg-white text-indigo-600 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">เปิดเลยครับพี่</button>
                  </div>
               </div>
            )}

            {/* นัดหมาย */}
            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><Calendar size={18} className="text-orange-500"/> นัดหมายวันนี้</h3>
              <div className="space-y-2">
                {events.length === 0 ? <p className="text-center text-gray-400 text-sm py-8 italic border-2 border-dashed border-gray-100 rounded-2xl">ไม่มีนัดหมายใหม่</p> : 
                  events.map(e => (
                    <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm border-l-4 border-l-orange-500 active:scale-[0.98] transition-all">
                      <div className="flex-1"><p className="font-bold text-sm text-gray-800 leading-tight">{e.title}</p><p className="text-[10px] text-gray-500 font-black uppercase mt-1 flex items-center gap-1"><Clock size={10}/> {e.startTime} {e.endTime ? `- ${e.endTime}` : ''} | {e.date}</p></div>
                      <button onClick={() => deleteItem('event', e.id)} className="text-gray-200 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                    </div>
                  ))
                }
              </div>
            </section>

            {/* โครงการ (กดเพื่อเข้าไปเพิ่ม Task) */}
            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><Briefcase size={18} className="text-orange-500"/> โครงการ</h3>
              <div className="grid grid-cols-1 gap-3">
                {projects.map(p => {
                    const completed = p.tasks?.filter(t => t.completed).length || 0;
                    const total = p.tasks?.length || 0;
                    const progress = total > 0 ? (completed / total) * 100 : 0;

                    return (
                      <button 
                        key={p.id} 
                        onClick={() => setSelectedProjectForTasks(p)}
                        className="bg-gray-900 text-white p-5 rounded-[2rem] text-left relative shadow-xl overflow-hidden group active:scale-95 transition-all"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <span className="text-[9px] bg-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mb-1 inline-block">ไตรมาส {p.quarter || '-'}</span>
                                <h4 className="font-bold text-lg leading-none tracking-tight">{p.name}</h4>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold mt-2 uppercase tracking-widest"><MapPin size={10}/> {p.targetArea || 'ลงพื้นที่'}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl"><ListTodo size={20} className="text-orange-500" /></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-1.5 px-0.5">
                                <p className="text-[9px] text-gray-500 font-black uppercase">Progress: {completed}/{total}</p>
                                <p className="text-[12px] font-black text-orange-500">{Math.round(progress)}%</p>
                            </div>
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange-500 h-full transition-all duration-700 shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <p className="text-[9px] text-gray-500 mt-4 text-center font-black uppercase tracking-widest opacity-40">คลิกเพื่อจัดการงานย่อย</p>
                      </button>
                    );
                })}
                <button 
                    onClick={() => { setAddType('project'); setShowAddModal(true); }} 
                    className="border-2 border-dashed border-gray-200 rounded-[2.5rem] py-10 flex flex-col items-center justify-center text-gray-400 bg-white hover:border-orange-300 transition-all shadow-sm"
                >
                    <Plus size={32}/><span className="text-[10px] font-black mt-1 uppercase tracking-widest">สร้างโครงการใหม่</span>
                </button>
              </div>
            </section>

            {/* งานต้องทำทั่วไป */}
            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><CheckSquare size={18} className="text-orange-500"/> งานทั่วไป</h3>
              <div className="space-y-2">
                {todos.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm group">
                    <input type="checkbox" checked={t.completed} onChange={() => setTodos(todos.map(item => item.id === t.id ? {...item, completed: !item.completed} : item))} className="w-6 h-6 accent-orange-500 rounded-md cursor-pointer"/>
                    <div className="flex-1"><span className={`text-sm block ${t.completed ? 'line-through text-gray-300' : 'text-gray-800 font-bold'}`}>{t.text}</span><div className="flex gap-2 mt-1"><span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${t.priority === 'ด่วนมาก' ? 'bg-red-50 text-red-600 border-red-100' : t.priority === 'ด่วน' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{t.priority}</span></div></div>
                    <button onClick={() => deleteItem('todo', t.id)} className="text-gray-200 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab อื่นๆ ยังคงเดิมตามเวอร์ชัน Master */}
        {activeTab === 'memo' && (
          <div className="p-4 grid grid-cols-2 gap-3 animate-fade-in">
            {memos.map(m => (
              <div key={m.id} className={`${m.color} p-5 rounded-[2.5rem] relative shadow-sm border border-black/5 min-h-[180px] flex flex-col hover:rotate-2 transition-transform`}>
                <button onClick={() => deleteItem('memo', m.id)} className="absolute top-3 right-3 text-black/10 hover:text-black/30"><X size={16}/></button>
                <h4 className="font-bold text-sm mb-2 text-gray-800 leading-tight font-bold">{m.title}</h4>
                <p className="text-[11px] text-gray-600 line-clamp-6 leading-relaxed font-medium flex-1">{m.content}</p>
                <p className="text-[8px] font-black text-black/20 mt-2 uppercase tracking-tighter text-right">{m.date}</p>
              </div>
            ))}
            <button onClick={() => { setAddType('memo'); setShowAddModal(true); }} className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-4 flex flex-col items-center justify-center text-gray-400 bg-white h-[180px] hover:border-orange-200 transition-all shadow-sm"><Plus size={32}/><span className="text-[10px] font-black mt-1 uppercase tracking-widest">โน้ตใหม่</span></button>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="p-4 space-y-6 animate-fade-in">
            <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl text-orange-500"></div>
              <p className="text-[10px] text-gray-400 mb-2 uppercase font-black tracking-widest">Account Balance</p>
              <h2 className="text-4xl font-black tracking-tighter">฿ {transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}</h2>
              <div className="flex gap-3 mt-8 relative z-10">
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm text-center"><p className="text-[10px] font-black text-green-400 uppercase mb-1">รายรับรวม</p><p className="text-sm font-black tracking-tight">฿ {transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0).toLocaleString()}</p></div>
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm text-center"><p className="text-[10px] font-black text-red-400 uppercase mb-1">รายจ่ายรวม</p><p className="text-sm font-black tracking-tight">฿ {transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0).toLocaleString()}</p></div>
              </div>
            </div>
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}><TrendingUp size={18}/></div>
                    <div><p className="font-bold text-sm text-gray-800 tracking-tight">{t.title}</p><p className="text-[10px] text-gray-400 font-bold uppercase">{t.date}</p></div>
                  </div>
                  <p className={`font-black text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="p-4 space-y-6 animate-fade-in pb-32">
            <section className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <Smile size={48} className="mx-auto text-orange-500 mb-6 shadow-inner" />
              <h3 className="font-black text-gray-800 tracking-tight uppercase">วันนี้รู้สึกอย่างไรบ้าง?</h3>
              <div className="flex justify-center gap-3 mt-6">
                {[1,2,3,4,5].map(lv => (
                  <button key={lv} onClick={() => setMood(lv)} className={`text-4xl p-3 rounded-2xl transition-all ${mood === lv ? 'bg-orange-50 scale-125 shadow-md border-2 border-orange-200' : 'grayscale opacity-30'}`}>
                    {lv === 1 ? '😫' : lv === 2 ? '😕' : lv === 3 ? '😐' : lv === 4 ? '🙂' : '🤩'}
                  </button>
                ))}
              </div>
              <textarea value={healthStory} onChange={e => setHealthStory(e.target.value)} placeholder="ระบายความในใจให้พี่พร้อมฟังได้นะ..." className="w-full mt-6 p-5 bg-gray-50 rounded-[2rem] border-none focus:ring-2 focus:ring-orange-200 text-sm h-32 resize-none shadow-inner font-medium"></textarea>
              <button onClick={handleHealthSubmit} disabled={isAnalyzing} className="w-full mt-4 bg-black text-white py-5 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest leading-none">
                {isAnalyzing ? <><Sparkles className="animate-spin" size={20}/> พี่พร้อมกำลังฟัง...</> : <><Send size={20}/> ส่งให้พี่พร้อม</>}
              </button>
            </section>
            {aiResponse && (<div className="bg-indigo-600 text-white p-7 rounded-[2.5rem] shadow-2xl animate-slide-up relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><MessageCircle size={100}/></div><h4 className="font-black text-[10px] mb-2 uppercase opacity-80 flex items-center gap-1 tracking-widest font-bold"><Sparkles size={12}/> Message from P'Prompt</h4><p className="text-sm font-bold leading-relaxed">"{aiResponse}"</p></div>)}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden"><p className="text-[10px] font-black mb-1 opacity-80 uppercase">ดื่มน้ำ</p><div className="flex items-end gap-1"><span className="text-4xl font-black">{waterIntake}</span><span className="text-[10px] font-black opacity-60">/ 8 แก้ว</span></div><div className="flex gap-2 mt-4 relative z-10"><button onClick={() => setWaterIntake(w => Math.max(0, w - 1))} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-xs font-black">-</button><button onClick={() => setWaterIntake(w => Math.min(12, w + 1))} className="flex-1 bg-white/40 hover:bg-white/50 text-white py-2 rounded-xl text-xs font-black">+</button></div></div>
              <div className="bg-stone-900 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden"><p className="text-[10px] font-black mb-1 opacity-80 uppercase">การนอน</p><div className="flex items-end gap-1"><span className="text-4xl font-black">{sleepHours}</span><span className="text-[10px] font-black opacity-60">ชั่วโมง</span></div><div className="flex gap-2 mt-4 relative z-10"><button onClick={() => setSleepHours(s => Math.max(0, s - 0.5))} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-xs font-black">-</button><button onClick={() => setSleepHours(s => Math.min(12, s + 0.5))} className="flex-1 bg-white/40 hover:bg-white/50 text-white py-2 rounded-xl text-xs font-black">+</button></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm col-span-2 text-center"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ก้าวเดินวันนี้</p><span className="text-3xl font-black text-gray-800 tracking-tighter">{steps.toLocaleString()}</span><input type="range" min="0" max="15000" step="500" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full mt-4 accent-orange-500 h-1.5 bg-gray-100 rounded-full appearance-none"/></div>
              <div className="bg-emerald-900 text-white p-7 rounded-[2.5rem] shadow-xl col-span-2 relative overflow-hidden group text-center">
                 <Scale className="absolute right-[-20px] top-[-20px] opacity-10" size={120}/>
                 <p className="text-[10px] text-emerald-300 font-black mb-1 uppercase tracking-widest leading-none">BMI INDEX</p>
                 <p className={`text-5xl font-black tracking-tighter`}>{calculateBMIValue()}</p>
                 <div className={`mt-2 inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getBMIStatusInfo(parseFloat(calculateBMIValue())).bg} ${getBMIStatusInfo(parseFloat(calculateBMIValue())).color}`}>{getBMIStatusInfo(parseFloat(calculateBMIValue())).text}</div>
                 <div className="flex gap-4 mt-8 relative z-10 justify-center"><div className="flex flex-col items-center"><p className="text-[9px] text-emerald-300 font-black uppercase mb-1">น้ำหนัก</p><div className="flex items-center gap-2"><button onClick={() => setWeight(w => w - 1)} className="w-8 h-8 bg-white/10 rounded-lg font-black">-</button><span className="font-black text-lg w-8 text-center">{weight}</span><button onClick={() => setWeight(w => w + 1)} className="w-8 h-8 bg-white/10 rounded-lg font-black">+</button></div></div><div className="flex flex-col items-center"><p className="text-[9px] text-emerald-300 font-black uppercase mb-1">ส่วนสูง</p><div className="flex items-center gap-2"><button onClick={() => setHeight(h => h - 1)} className="w-8 h-8 bg-white/10 rounded-lg font-black">-</button><span className="font-black text-lg w-8 text-center">{height}</span><button onClick={() => setHeight(h => h + 1)} className="w-8 h-8 bg-white/10 rounded-lg font-black">+</button></div></div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Task Manager Modal (Inside View) --- */}
      {selectedProjectForTasks && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-end animate-fade-in" onClick={() => setSelectedProjectForTasks(null)}>
            <div className="bg-white w-full max-w-md mx-auto p-8 rounded-t-[3.5rem] animate-slide-up shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-black text-2xl uppercase tracking-tighter text-gray-900 leading-none">{selectedProjectForTasks.name}</h3>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-2 flex items-center gap-1"><Target size={12}/> จัดการงานย่อยในโครงการ</p>
                    </div>
                    <button onClick={() => setSelectedProjectForTasks(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
                </div>

                {/* Input สำหรับเพิ่ม Task ใหม่ */}
                <div className="flex gap-2 mb-6">
                    <input 
                        type="text" 
                        placeholder="พิมพ์ชื่อกิจกรรม/งานย่อย..." 
                        value={newTaskInput}
                        onChange={(e) => setNewTaskInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSubTask()}
                        className="flex-1 p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"
                    />
                    <button 
                        onClick={addSubTask}
                        className="bg-black text-white p-5 rounded-2xl active:scale-95 transition-all shadow-xl"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* รายการ Task ทั้งหมด */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-10">
                    {selectedProjectForTasks.tasks.length === 0 ? (
                        <div className="text-center py-10 opacity-30 italic">
                            <ListTodo size={48} className="mx-auto mb-2" />
                            <p className="text-sm">ยังไม่มีงานย่อย เพิ่มได้เลยด้านบนครับพี่</p>
                        </div>
                    ) : (
                        selectedProjectForTasks.tasks.map(task => (
                            <div key={task.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100 group">
                                <button 
                                    onClick={() => toggleSubTask(task.id)}
                                    className={`transition-all ${task.completed ? 'text-green-500 scale-110' : 'text-gray-300'}`}
                                >
                                    {task.completed ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                                </button>
                                <span className={`flex-1 text-sm font-bold ${task.completed ? 'line-through text-gray-400 italic font-medium' : 'text-gray-800'}`}>
                                    {task.text}
                                </span>
                                <button 
                                    onClick={() => deleteSubTask(task.id)}
                                    className="text-gray-200 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
                
                <button 
                    onClick={() => setSelectedProjectForTasks(null)}
                    className="w-full bg-orange-600 text-white py-5 rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all uppercase tracking-widest"
                >
                    ปิดหน้าต่างนี้
                </button>
            </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t flex justify-between items-center h-[85px] rounded-t-[2.5rem] px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50">
        <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'work' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Briefcase size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">งาน</span></button>
        <button onClick={() => setActiveTab('memo')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'memo' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><StickyNote size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">โน้ต</span></button>
        <button onClick={() => { setAddType('event'); setShowAddModal(true); }} className="bg-black text-white p-4 rounded-2xl shadow-2xl relative -top-6 hover:scale-110 active:scale-90 transition-all border-4 border-gray-50 shadow-orange-500/20"><Plus size={32}/></button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'finance' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Wallet size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">บัญชี</span></button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'health' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Activity size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">สุขภาพ</span></button>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-end animate-fade-in p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md mx-auto p-8 rounded-[3.5rem] animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 px-2"><h3 className="font-black text-xl uppercase tracking-tighter uppercase">เพิ่มรายการใหม่</h3><button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button></div>
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide gap-1">{['event', 'task', 'project', 'memo', 'transaction'].map((t: any) => (<button key={t} onClick={() => setAddType(t)} className={`flex-1 py-4 px-2 text-[14px] font-black rounded-xl transition-all whitespace-nowrap uppercase ${addType === t ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}>{t === 'event' ? 'นัด' : t === 'task' ? 'งาน' : t === 'project' ? 'โครงการ' : t === 'memo' ? 'โน้ต' : 'บัญชี'}</button>))}</div>
              <div className="space-y-4">
                <input type="text" placeholder="หัวข้อเรื่อง / รายการ" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-lg shadow-inner outline-none"/>
                {addType === 'transaction' && (<div className="flex gap-2"><button onClick={() => setTransactionType('income')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'income' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายรับ</button><button onClick={() => setTransactionType('expense')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'expense' ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายจ่าย</button></div>)}
                {(addType === 'project' || addType === 'transaction') && (<input type="number" placeholder="จำนวนเงิน / งบประมาณ (฿)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-black text-xl shadow-inner outline-none"/>)}
                {(addType === 'event' || addType === 'task') && (<div className="flex gap-2"><div className="flex-1"><p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">วันที่</p><input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/></div>{addType === 'event' && (<><div className="w-24"><p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">เริ่ม</p><input type="time" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/></div><div className="w-24"><p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">สิ้นสุด</p><input type="time" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/></div></>)}</div>)}
                {addType === 'project' && (<div className="flex gap-2"><div className="flex-1"><p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest leading-none">ไตรมาส</p><select value={formData.quarter || '1'} onChange={e => setFormData({...formData, quarter: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div><div className="flex-[2]"><p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest leading-none">พื้นที่เป้าหมาย</p><input type="text" placeholder="หมู่บ้าน/ตำบล" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/></div></div>)}
                {addType === 'task' && (<div className="space-y-2"><p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest leading-none">ระดับความสำคัญ</p><div className="flex gap-2">{['ด่วนมาก', 'ด่วน', 'ปกติ'].map(p => (<button key={p} onClick={() => setFormData({...formData, priority: p})} className={`flex-1 py-4 text-[12px] font-black rounded-xl border-2 transition-all ${formData.priority === p ? 'bg-black text-white shadow-lg' : 'border-gray-100 text-gray-400 bg-gray-50'}`}>{p}</button>))}</div></div>)}
                {addType === 'memo' && (<><textarea placeholder="จดรายละเอียดตรงนี้..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-5 bg-gray-50 rounded-[2.5rem] h-40 border-none resize-none focus:ring-2 focus:ring-orange-200 font-medium shadow-inner outline-none"></textarea><div className="space-y-2"><p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">เลือกสีโน้ต</p><div className="flex gap-3 px-2">{['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100'].map(c => ( <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-10 h-10 rounded-full ${c} border border-gray-200 shadow-sm ring-2 ${formData.color === c ? 'ring-orange-500 scale-110 shadow-md' : 'ring-transparent opacity-60'} active:scale-90 transition-all`}></button> ))}</div></div></>)}
              </div>
            </div>
            <button onClick={handleSaveItem} className="w-full bg-black text-white py-5 rounded-[2.5rem] font-black shadow-2xl mt-10 active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest leading-none"><Save size={20}/> บันทึกรายการ</button>
          </div>
        </div>
      )}

      {/* Welcome Quote Popup */}
      {showWelcomeQuote && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-8 animate-fade-in" onClick={() => setShowWelcomeQuote(false)}>
          <div className="bg-white p-10 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 shadow-inner"><Laugh size={44} /></div>
            <p className="text-xl italic font-bold text-gray-800 leading-relaxed tracking-tight">"{randomQuote}"</p>
            <button onClick={() => setShowWelcomeQuote(false)} className="mt-10 bg-black text-white px-10 py-5 rounded-[2rem] font-black w-full shadow-xl hover:scale-105 active:scale-95 transition-all uppercase leading-none">ลุยงานกันเลยครับ!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
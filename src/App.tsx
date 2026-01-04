import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, CheckSquare, Activity, Smile, Plus, Droplets, Moon, Coffee, Briefcase, Mail, Bell, LogOut, MapPin, Users, FileText, Wallet, TrendingUp, TrendingDown, Heart, X, Clock, Save, Map, Navigation, StickyNote, PenTool, Search, MoreVertical, Target, ChevronRight, Trash2, PieChart, Info, DollarSign, Sparkles, MessageCircle, Send, Footprints, Scale, BarChart2, Phone, User, MessageSquare, Laugh, AlertCircle, BellRing
} from 'lucide-react';

// --- การตั้งค่า (Configuration) ---
const apiKey = ""; 
const GOOGLE_SHEET_ID = '1LC1mBr7ZtAFamAf9zpqT20Cp5g8ySTx5XY1n_14HDDU'; 

// --- ส่วนประกอบโลโก้คนคู่ (App Logo Component) ---
const AppLogo = ({ size = 80, className = "" }: { size?: number, className?: string }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className={`bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-xl border-4 border-white/30 relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 bg-white/10 rotate-45 translate-y-1/2"></div>
      <div className="absolute -top-4 -left-4 w-full h-full bg-white/5 rounded-full blur-2xl"></div>
      <div className="relative z-10 flex flex-col items-center">
        <Users size={size * 0.55} className="drop-shadow-lg" strokeWidth={2.5} />
      </div>
      <Heart size={size * 0.18} className="absolute bottom-2.5 right-2.5 text-white/60 fill-current animate-pulse" />
    </div>
  );
};

// --- ประเภทข้อมูล (Types) ---
interface Todo { id: number; text: string; priority: 'ด่วนมาก' | 'ด่วน' | 'ปกติ'; completed: boolean; deadline?: string; notified?: boolean; }
interface ProjectTask { id: number; text: string; completed: boolean; }
interface Project { id: number; name: string; targetArea?: string; quarter?: string; budget?: number; note?: string; }
interface CalendarEvent { id: number; title: string; startTime: string; endTime?: string; date: string; location?: string; notified?: boolean; }
interface Transaction { id: number; title: string; amount: number; type: 'income' | 'expense'; date: string; }
interface Memo { id: number; title: string; content: string; color: string; date: string; }

const DEFAULT_QUOTES = ["รอยยิ้มชาวบ้าน คือพลังของพวกเรา", "เป็นพัฒนากร ต้องอดทนสิบล้อชนต้องไม่ตาย", "เพื่อนคู่คิด ไปไหนไปกัน"];

const App = () => {
  const [activeTab, setActiveTab] = useState<'work' | 'memo' | 'finance' | 'health'>('work');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('p_prompt_login') === 'true');

  // --- ข้อมูลในเครื่อง (Local Storage 100%) ---
  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('p_todos') || '[]'));
  const [projects, setProjects] = useState<Project[]>(() => JSON.parse(localStorage.getItem('p_projects') || '[]'));
  const [memos, setMemos] = useState<Memo[]>(() => JSON.parse(localStorage.getItem('p_memos') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('p_trans') || '[]'));
  const [events, setEvents] = useState<CalendarEvent[]>(() => JSON.parse(localStorage.getItem('p_events') || '[]'));

  // สุขภาพ
  const [waterIntake, setWaterIntake] = useState(() => Number(localStorage.getItem('p_water') || 0));
  const [steps, setSteps] = useState(() => Number(localStorage.getItem('p_steps') || 0));
  const [sleepHours, setSleepHours] = useState(() => Number(localStorage.getItem('p_sleep') || 7));
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('p_weight') || 65));
  const [height, setHeight] = useState(() => Number(localStorage.getItem('p_height') || 170));
  const [mood, setMood] = useState<number | null>(null);
  const [healthStory, setHealthStory] = useState('');
  
  // UI & Notification States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'event' | 'task' | 'project' | 'memo' | 'transaction'>('event');
  const [formData, setFormData] = useState<any>({ color: 'bg-yellow-100', priority: 'ปกติ', quarter: '1' });
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showWelcomeQuote, setShowWelcomeQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');
  const [notifPermission, setNotifPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [activeAlerts, setActiveAlerts] = useState<CalendarEvent[]>([]);

  // --- ระบบบันทึกอัตโนมัติ ---
  useEffect(() => {
    localStorage.setItem('p_todos', JSON.stringify(todos));
    localStorage.setItem('p_projects', JSON.stringify(projects));
    localStorage.setItem('p_memos', JSON.stringify(memos));
    localStorage.setItem('p_trans', JSON.stringify(transactions));
    localStorage.setItem('p_events', JSON.stringify(events));
    localStorage.setItem('p_water', String(waterIntake));
    localStorage.setItem('p_steps', String(steps));
    localStorage.setItem('p_sleep', String(sleepHours));
    localStorage.setItem('p_weight', String(weight));
    localStorage.setItem('p_height', String(height));
    localStorage.setItem('p_prompt_login', String(isLoggedIn));
  }, [todos, projects, memos, transactions, events, waterIntake, steps, sleepHours, weight, height, isLoggedIn]);

  // --- ระบบแจ้งเตือน 15 นาที ---
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      const updatedEvents = events.map(event => {
        if (event.date === today && !event.notified) {
          const [h, m] = event.startTime.split(':').map(Number);
          const eventMinutes = h * 60 + m;
          const diff = eventMinutes - nowMinutes;

          if (diff <= 15 && diff >= 0) {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`นัดหมายสำคัญ: ${event.title}`, {
                body: `จะเริ่มในอีก ${diff} นาที (${event.startTime} น.)`,
                icon: "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
              });
            }
            setActiveAlerts(prev => prev.find(a => a.id === event.id) ? prev : [...prev, event]);
            return { ...event, notified: true };
          }
        }
        return event;
      });

      if (JSON.stringify(updatedEvents) !== JSON.stringify(events)) setEvents(updatedEvents);
    }, 30000);
    return () => clearInterval(timer);
  }, [events]);

  const handleRequestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/1`)
        .then(res => res.json())
        .then(data => {
          const quotes = data.map((i: any) => i.text || i.quote || Object.values(i)[0]).filter(Boolean);
          setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)] || DEFAULT_QUOTES[0]);
          setShowWelcomeQuote(true);
        })
        .catch(() => {
          setRandomQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]);
          setShowWelcomeQuote(true);
        });
    }
  }, [isLoggedIn]);

  const calculateBMIValue = () => {
    const hInMeter = height / 100;
    return hInMeter > 0 ? (weight / (hInMeter * hInMeter)).toFixed(1) : '0';
  };

  const getBMIStatusInfo = (bmi: number) => {
    if (bmi < 18.5) return { text: 'ผอมไปนิด', color: 'text-blue-500', bg: 'bg-blue-100' };
    if (bmi < 23) return { text: 'หุ่นดีมากครับ', color: 'text-green-500', bg: 'bg-green-100' };
    if (bmi < 25) return { text: 'เริ่มท้วมแล้วนะ', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { text: 'น้ำหนักเกินครับ', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const handleSaveItem = () => {
    const id = Date.now();
    if (addType === 'task' && formData.title) {
      setTodos([...todos, { id, text: formData.title, priority: formData.priority, completed: false, deadline: formData.date }]);
    } else if (addType === 'project' && formData.title) {
      setProjects([...projects, { id, name: formData.title, targetArea: formData.location, quarter: formData.quarter, budget: Number(formData.amount), note: formData.note }]);
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
    if (type === 'project') setProjects(projects.filter(p => p.id !== id));
    if (type === 'trans') setTransactions(transactions.filter(t => t.id !== id));
    if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
    if (type === 'event') setEvents(events.filter(e => e.id !== id));
  };

  const handleHealthSubmit = async () => {
    if (!mood || !healthStory) return;
    setIsAnalyzing(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const prompt = `คุณคือ "พี่พร้อม" ผู้ช่วยรุ่นพี่พัฒนากรจังหวัดสุราษฎร์ธานี ใจดี อบอุ่น น้องระบายเรื่อง "${healthStory}" (อารมณ์ ${mood}/5) ช่วยตอบให้กำลังใจสั้นๆ 2 ประโยค ตบท้ายด้วย emoji`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const res = await response.json();
      setAiResponse(res.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch { setAiResponse("พี่พร้อมอยู่ข้างๆ เสมอนะครับ พักผ่อนบ้างนะพี่ สู้ๆ! ❤️"); }
    setIsAnalyzing(false);
    setHealthStory('');
    setMood(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-600 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="mb-8 transform hover:scale-110 transition-transform duration-500"><AppLogo size={140} /></div>
        <h1 className="text-4xl font-black mb-2 tracking-tighter drop-shadow-lg uppercase">พี่พร้อม</h1>
        <p className="mb-12 opacity-90 font-medium text-lg italic text-orange-100">"เพื่อนคู่คิด ไปไหนไปกัน"</p>
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
                <div>
                  <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">นัดหมายใกล้ถึงเวลา!</p>
                  <p className="text-sm font-bold tracking-tight">{alert.title}</p>
                </div>
              </div>
              <button onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))} className="p-2 hover:bg-white/10 rounded-full"><X size={18}/></button>
            </div>
          ))}
        </div>
      )}

      {/* Header with 2 People Logo */}
      <div className="bg-white/95 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <AppLogo size={50} className="rounded-2xl shadow-md" />
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-gray-900 leading-tight tracking-tight uppercase">พี่พร้อม</h2>
            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest leading-none">P'Prompt Surat</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={handleRequestPermission} className={`p-2 rounded-full transition-all ${notifPermission === 'granted' ? 'text-orange-500 bg-orange-50' : 'text-gray-300'}`}><BellRing size={22} /></button>
            <button onClick={() => setIsLoggedIn(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-1"><LogOut size={22} /></button>
        </div>
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar pb-32">
        {activeTab === 'work' && (
          <div className="p-4 space-y-6 animate-fade-in">
            {/* ปุ่ม Activate แจ้งเตือน (Indigo Card) */}
            {notifPermission !== 'granted' && (
               <div className="p-5 bg-indigo-600 text-white rounded-[2.5rem] flex items-start gap-4 shadow-xl relative overflow-hidden">
                  <div className="absolute right-[-10px] top-[-10px] opacity-10"><Bell size={80} /></div>
                  <AlertCircle className="shrink-0 mt-1" size={24} />
                  <div className="flex-1 relative z-10">
                      <p className="text-sm font-black mb-1 uppercase tracking-tight">เปิดแจ้งเตือนไหมครับ?</p>
                      <p className="text-[10px] opacity-80 mb-4 font-medium leading-relaxed">ผมจะคอยสะกิดเตือนเวลามีนัดล่วงหน้า 15 นาที ไม่ให้พี่พลาดงานสำคัญครับ</p>
                      <button onClick={handleRequestPermission} className="bg-white text-indigo-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">เปิดเลยครับ</button>
                  </div>
               </div>
            )}

            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><Calendar size={18} className="text-orange-500"/> นัดหมายวันนี้</h3>
              <div className="space-y-2">
                {events.length === 0 ? <p className="text-center text-gray-400 text-sm py-8 italic border-2 border-dashed border-gray-100 rounded-2xl">ไม่มีนัดหมายใหม่</p> : 
                  events.map(e => (
                    <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm border-l-4 border-l-orange-500 transition-all active:scale-[0.98]">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-800 leading-tight">{e.title}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase mt-1 flex items-center gap-1">
                          <Clock size={10}/> {e.startTime} {e.endTime ? `- ${e.endTime}` : ''} | {e.date}
                        </p>
                      </div>
                      <button onClick={() => deleteItem('event', e.id)} className="text-gray-200 hover:text-red-400 p-2"><Trash2 size={16}/></button>
                    </div>
                  ))
                }
              </div>
            </section>

            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><Briefcase size={18} className="text-orange-500"/> โครงการ</h3>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {projects.map(p => (
                  <div key={p.id} className="min-w-[240px] bg-gray-900 text-white p-5 rounded-[2rem] relative shadow-xl">
                    <button onClick={() => deleteItem('project', p.id)} className="absolute top-3 right-3 text-white/20 hover:text-red-400"><X size={14}/></button>
                    <span className="text-[9px] bg-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest mb-2 inline-block">ไตรมาส {p.quarter || '-'}</span>
                    <h4 className="font-bold text-sm truncate mb-1 tracking-tight">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 mb-4 flex items-center gap-1 font-bold"><MapPin size={10}/> {p.targetArea || 'ลงพื้นที่'}</p>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">งบ: ฿{p.budget?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-1/4 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div></div>
                  </div>
                ))}
                <button onClick={() => { setAddType('project'); setShowAddModal(true); }} className="min-w-[120px] border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-400 bg-white hover:border-orange-300 transition-all shadow-sm"><Plus size={32}/><span className="text-[10px] font-black mt-1 uppercase tracking-widest">เพิ่มโครงการ</span></button>
              </div>
            </section>

            <section>
              <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2 uppercase tracking-tight text-sm"><CheckSquare size={18} className="text-orange-500"/> งานต้องทำ</h3>
              <div className="space-y-2">
                {todos.map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm group">
                    <input type="checkbox" checked={t.completed} onChange={() => setTodos(todos.map(item => item.id === t.id ? {...item, completed: !item.completed} : item))} className="w-6 h-6 accent-orange-500 rounded-md cursor-pointer"/>
                    <div className="flex-1">
                      <span className={`text-sm block ${t.completed ? 'line-through text-gray-300' : 'text-gray-800 font-bold'}`}>{t.text}</span>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          t.priority === 'ด่วนมาก' ? 'bg-red-50 text-red-600 border-red-100' : 
                          t.priority === 'ด่วน' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                          'bg-green-50 text-green-600 border-green-100'
                        }`}>{t.priority}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteItem('todo', t.id)} className="text-gray-200 hover:text-red-500 p-1 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Tab อื่นๆ ยังคงเดิมตาม Master Version */}
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-widest font-black">Financial Summary</p>
              <h2 className="text-4xl font-black tracking-tighter">฿ {transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}</h2>
              <div className="flex gap-3 mt-8">
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                   <p className="text-[10px] font-black text-green-400 uppercase mb-1">รายรับรวม</p>
                   <p className="text-sm font-black tracking-tight">฿ {transactions.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0).toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-sm text-center">
                   <p className="text-[10px] font-black text-red-400 uppercase mb-1">รายจ่ายรวม</p>
                   <p className="text-sm font-black tracking-tight">฿ {transactions.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                    </div>
                    <div><p className="font-bold text-sm text-gray-800">{t.title}</p><p className="text-[10px] text-gray-400 uppercase">{t.date}</p></div>
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
              <Smile size={48} className="mx-auto text-orange-500 mb-6" />
              <h3 className="font-black text-gray-800 tracking-tight uppercase tracking-widest">วันนี้รู้สึกอย่างไรบ้าง?</h3>
              <div className="flex justify-center gap-3 mt-6">
                {[1,2,3,4,5].map(lv => (
                  <button key={lv} onClick={() => setMood(lv)} className={`text-4xl p-3 rounded-2xl transition-all ${mood === lv ? 'bg-orange-50 scale-125 shadow-md border-2 border-orange-200' : 'grayscale opacity-30'}`}>
                    {lv === 1 ? '😫' : lv === 2 ? '😕' : lv === 3 ? '😐' : lv === 4 ? '🙂' : '🤩'}
                  </button>
                ))}
              </div>
              <textarea value={healthStory} onChange={e => setHealthStory(e.target.value)} placeholder="ระบายความในใจให้พี่พร้อมฟังได้นะ..." className="w-full mt-6 p-5 bg-gray-50 rounded-[2rem] border-none focus:ring-2 focus:ring-orange-200 text-sm h-32 resize-none shadow-inner font-medium"></textarea>
              <button onClick={handleHealthSubmit} disabled={isAnalyzing} className="w-full mt-4 bg-black text-white py-5 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest">
                {isAnalyzing ? <><Sparkles className="animate-spin" size={20}/> พี่พร้อมกำลังฟัง...</> : <><Send size={20}/> ส่งให้พี่พร้อม</>}
              </button>
            </section>
            
            {aiResponse && (
              <div className="bg-indigo-600 text-white p-7 rounded-[2.5rem] shadow-2xl animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><MessageCircle size={100}/></div>
                <h4 className="font-black text-[10px] mb-2 uppercase opacity-80 flex items-center gap-1 tracking-widest font-bold"><Sparkles size={12}/> Message from P'Prompt</h4>
                <p className="text-sm font-bold leading-relaxed">"{aiResponse}"</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden">
                <Droplets className="absolute right-[-10px] bottom-[-10px] opacity-20" size={100}/>
                <p className="text-[10px] font-black mb-1 opacity-80 uppercase tracking-widest">ดื่มน้ำ</p>
                <div className="flex items-end gap-1"><span className="text-4xl font-black">{waterIntake}</span><span className="text-[10px] font-black opacity-60">/ 8 แก้ว</span></div>
                <div className="flex gap-2 mt-4 relative z-10">
                   <button onClick={() => setWaterIntake(w => Math.max(0, w - 1))} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-xs font-black">-</button>
                   <button onClick={() => setWaterIntake(w => Math.min(12, w + 1))} className="flex-1 bg-white/40 hover:bg-white/50 text-white py-2 rounded-xl text-xs font-black">+</button>
                </div>
              </div>
              <div className="bg-stone-900 text-white p-6 rounded-[2.5rem] shadow-lg relative overflow-hidden">
                <Moon className="absolute right-[-10px] bottom-[-10px] opacity-10" size={100}/>
                <p className="text-[10px] font-black mb-1 opacity-80 uppercase tracking-widest">การนอน</p>
                <div className="flex items-end gap-1"><span className="text-4xl font-black">{sleepHours}</span><span className="text-[10px] font-black opacity-60">ชั่วโมง</span></div>
                <div className="flex gap-2 mt-4 relative z-10">
                   <button onClick={() => setSleepHours(s => Math.max(0, s - 0.5))} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-xs font-black">-</button>
                   <button onClick={() => setSleepHours(s => Math.min(12, s + 0.5))} className="flex-1 bg-white/40 hover:bg-white/50 text-white py-2 rounded-xl text-xs font-black">+</button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm col-span-2">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ก้าวเดินวันนี้</p>
                   <Footprints size={16} className="text-orange-500" />
                </div>
                <div className="flex items-end gap-1"><span className="text-3xl font-black text-gray-800 tracking-tighter">{steps.toLocaleString()}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">/ 10k steps</span></div>
                <input type="range" min="0" max="15000" step="500" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full mt-4 accent-orange-500 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"/>
              </div>
              <div className="bg-emerald-900 text-white p-7 rounded-[2.5rem] shadow-xl col-span-2 relative overflow-hidden group">
                 <Scale className="absolute right-[-20px] top-[-20px] opacity-10" size={120}/>
                 <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 opacity-80 flex items-center gap-2 font-bold"><Scale size={14}/> Body & BMI Status</h4>
                 <div className="flex gap-6 relative z-10">
                    <div className="flex-1 space-y-4">
                        <div>
                            <p className="text-[9px] text-emerald-300 font-black mb-1 uppercase leading-none">น้ำหนัก (กก.)</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setWeight(w => w - 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black active:bg-white/20">-</button>
                                <span className="font-black text-2xl w-8 text-center tracking-tighter">{weight}</span>
                                <button onClick={() => setWeight(w => w + 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black active:bg-white/20">+</button>
                            </div>
                        </div>
                        <div>
                            <p className="text-[9px] text-emerald-300 font-black mb-1 uppercase leading-none">ส่วนสูง (ซม.)</p>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setHeight(h => h - 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black active:bg-white/20">-</button>
                                <span className="font-black text-2xl w-8 text-center tracking-tighter">{height}</span>
                                <button onClick={() => setHeight(h => h + 1)} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black active:bg-white/20">+</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2.5rem] p-5 text-center flex flex-col items-center justify-center shadow-inner border border-white/20">
                        <p className="text-[10px] text-gray-400 font-black mb-1 uppercase tracking-widest leading-none">BMI</p>
                        <p className={`text-5xl font-black tracking-tighter ${getBMIStatusInfo(parseFloat(calculateBMIValue())).color}`}>{calculateBMIValue()}</p>
                        <div className={`mt-2 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getBMIStatusInfo(parseFloat(calculateBMIValue())).bg} ${getBMIStatusInfo(parseFloat(calculateBMIValue())).color}`}>
                            {getBMIStatusInfo(parseFloat(calculateBMIValue())).text}
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t flex justify-between items-center h-[85px] rounded-t-[2.5rem] px-6 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50">
        <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'work' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Briefcase size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">งาน</span></button>
        <button onClick={() => setActiveTab('memo')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'memo' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><StickyNote size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">โน้ต</span></button>
        <button onClick={() => { setAddType('event'); setShowAddModal(true); }} className="bg-black text-white p-4 rounded-2xl shadow-2xl relative -top-6 hover:scale-110 active:scale-90 transition-all border-4 border-gray-50 shadow-orange-500/20"><Plus size={32}/></button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'finance' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Wallet size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">บัญชี</span></button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'health' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Activity size={24}/><span className="text-[9px] mt-1 font-black uppercase tracking-tight font-bold">สุขภาพ</span></button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-end animate-fade-in p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md mx-auto p-8 rounded-[3.5rem] animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 px-2">
              <h3 className="font-black text-xl uppercase tracking-widest tracking-tighter">เพิ่มรายการใหม่</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide gap-1">
                {['event', 'task', 'project', 'memo', 'transaction'].map((t: any) => (
                   <button key={t} onClick={() => setAddType(t)} className={`flex-1 py-4 px-2 text-[14px] font-black rounded-xl transition-all whitespace-nowrap uppercase ${addType === t ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}>
                     {t === 'event' ? 'นัด' : t === 'task' ? 'งาน' : t === 'project' ? 'โครงการ' : t === 'memo' ? 'โน้ต' : 'บัญชี'}
                   </button>
                ))}
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="หัวข้อเรื่อง / รายการ" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-lg shadow-inner outline-none"/>
                
                {addType === 'transaction' && (
                  <div className="flex gap-2">
                    <button onClick={() => setTransactionType('income')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'income' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายรับ</button>
                    <button onClick={() => setTransactionType('expense')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'expense' ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายจ่าย</button>
                  </div>
                )}

                {(addType === 'project' || addType === 'transaction') && (
                  <input type="number" placeholder="จำนวนเงิน / งบประมาณ (฿)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-black text-xl shadow-inner outline-none"/>
                )}

                {(addType === 'event' || addType === 'task') && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">วันที่</p>
                      <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/>
                    </div>
                    {addType === 'event' && (
                      <>
                        <div className="w-24">
                          <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">เริ่ม</p>
                          <input type="time" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/>
                        </div>
                        <div className="w-24">
                          <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest">สิ้นสุด</p>
                          <input type="time" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {addType === 'project' && (
                   <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest leading-none">ไตรมาส</p>
                        <select value={formData.quarter || '1'} onChange={e => setFormData({...formData, quarter: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none">
                          <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                        </select>
                      </div>
                      <div className="flex-[2]">
                        <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase tracking-widest leading-none">พื้นที่เป้าหมาย</p>
                        <input type="text" placeholder="หมู่บ้าน/ตำบล" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm shadow-inner outline-none"/>
                      </div>
                   </div>
                )}

                {addType === 'task' && (
                   <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest leading-none">ระดับความสำคัญ</p>
                    <div className="flex gap-2">
                      {['ด่วนมาก', 'ด่วน', 'ปกติ'].map(p => (
                        <button key={p} onClick={() => setFormData({...formData, priority: p})} className={`flex-1 py-4 text-[12px] font-black rounded-xl border-2 transition-all ${formData.priority === p ? 'bg-black text-white shadow-lg' : 'border-gray-100 text-gray-400 bg-gray-50'}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                )}

                {addType === 'memo' && (
                  <>
                    <textarea placeholder="จดรายละเอียดตรงนี้..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-5 bg-gray-50 rounded-[2.5rem] h-40 border-none resize-none focus:ring-2 focus:ring-orange-200 font-medium shadow-inner outline-none"></textarea>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-widest">เลือกสีโน้ต</p>
                      <div className="flex gap-3 px-2">
                          {['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100'].map(c => (
                              <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-10 h-10 rounded-full ${c} border border-gray-200 shadow-sm ring-2 ${formData.color === c ? 'ring-orange-500 scale-110 shadow-md' : 'ring-transparent opacity-60'} active:scale-90 transition-all`}></button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
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
            <button onClick={() => setShowWelcomeQuote(false)} className="mt-10 bg-black text-white px-10 py-5 rounded-[2rem] font-black w-full shadow-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest leading-none">ลุยงานกันเลยครับ!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
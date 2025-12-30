import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckSquare, Activity, Smile, Plus, Droplets, Moon, Coffee, Briefcase, Mail, Bell, LogOut, MapPin, Users, FileText, Wallet, TrendingUp, TrendingDown, Heart, X, Clock, Save, Map, Navigation, StickyNote, PenTool, Search, MoreVertical, Target, ChevronRight, Trash2, PieChart, Info, DollarSign, Sparkles, MessageCircle, Send, Footprints, Scale, BarChart2, Phone, User, MessageSquare, Laugh, AlertCircle
} from 'lucide-react';

// --- การตั้งค่าทั่วไป ---
const apiKey = ""; // ใส่ Gemini API Key เพื่อคุยกับ AI
const GOOGLE_SHEET_ID = '1LC1mBr7ZtAFamAf9zpqT20Cp5g8ySTx5XY1n_14HDDU'; 

// --- ประเภทข้อมูล ---
interface Todo { id: number; text: string; priority: 'ด่วนมาก' | 'ด่วน' | 'ปกติ'; completed: boolean; deadline?: string; }
interface ProjectTask { id: number; text: string; completed: boolean; }
interface Project { id: number; name: string; tasks: ProjectTask[]; targetArea?: string; quarter?: string; budget?: number; note?: string; }
interface CalendarEvent { id: number; title: string; startTime: string; endTime?: string; date: string; location?: string; }
interface Transaction { id: number; title: string; amount: number; type: 'income' | 'expense'; }
interface Memo { id: number; title: string; content: string; color: string; }

const DEFAULT_QUOTES = ["สู้ๆ นะครับพัฒนากร", "รอยยิ้มชาวบ้านคือความสุขของเรา", "ทำงานให้สนุกนะครับพี่!"];

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
  const [coffeeIntake, setCoffeeIntake] = useState(() => Number(localStorage.getItem('p_coffee') || 0));
  const [weight, setWeight] = useState(() => Number(localStorage.getItem('p_weight') || 60));
  const [height, setHeight] = useState(() => Number(localStorage.getItem('p_height') || 165));
  
  // สถานะ UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'event' | 'task' | 'project' | 'memo' | 'transaction'>('event');
  const [formData, setFormData] = useState<any>({ color: 'bg-yellow-100', priority: 'ปกติ' });
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [mood, setMood] = useState<number | null>(null);
  const [healthStory, setHealthStory] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHealthReport, setShowHealthReport] = useState(false);
  const [showWelcomeQuote, setShowWelcomeQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');

  // --- ระบบเซฟอัตโนมัติ ---
  useEffect(() => {
    localStorage.setItem('p_todos', JSON.stringify(todos));
    localStorage.setItem('p_projects', JSON.stringify(projects));
    localStorage.setItem('p_memos', JSON.stringify(memos));
    localStorage.setItem('p_trans', JSON.stringify(transactions));
    localStorage.setItem('p_events', JSON.stringify(events));
    localStorage.setItem('p_water', String(waterIntake));
    localStorage.setItem('p_steps', String(steps));
    localStorage.setItem('p_sleep', String(sleepHours));
    localStorage.setItem('p_coffee', String(coffeeIntake));
    localStorage.setItem('p_weight', String(weight));
    localStorage.setItem('p_height', String(height));
  }, [todos, projects, memos, transactions, events, waterIntake, steps, sleepHours, coffeeIntake, weight, height]);

  // --- คำคม Funny Quotes ---
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/1`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const quotes = data.map((item: any) => String(item.text || item.quote || Object.values(item)[0])).filter(Boolean);
            setRandomQuote(quotes[Math.floor(Math.random() * quotes.length)]);
          } else {
            setRandomQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]);
          }
          setShowWelcomeQuote(true);
        })
        .catch(() => {
          setRandomQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]);
          setShowWelcomeQuote(true);
        });
    }
  }, [isLoggedIn]);

  const calculateBMIValue = () => {
    const h = height / 100;
    return h > 0 ? (weight / (h * h)).toFixed(1) : '0';
  };

  const getBMIStatusInfo = (bmi: number) => {
    if (bmi < 18.5) return { text: 'ผอม', color: 'text-blue-500' };
    if (bmi < 23) return { text: 'ปกติ', color: 'text-green-500' };
    if (bmi < 25) return { text: 'ท้วม', color: 'text-yellow-500' };
    if (bmi < 30) return { text: 'อ้วน', color: 'text-orange-500' };
    return { text: 'อ้วนมาก', color: 'text-red-500' };
  };

  const handleHealthSubmit = async () => {
    if (!mood) return;
    setIsAnalyzing(true);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const prompt = `คุณคือ "พี่พร้อม" ผู้ช่วยรุ่นพี่พัฒนากร ใจดี อบอุ่น น้องบอกอารมณ์ ${mood}/5 และเจอเรื่องมาว่า "${healthStory}" ช่วยให้กำลังใจสั้นๆ 2 ประโยค ตบท้ายด้วย emoji`;
    try {
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const res = await response.json();
      setAiResponse(res.candidates?.[0]?.content?.parts?.[0]?.text || "พี่พร้อมอยู่ข้างๆ เสมอครับ!");
    } catch { setAiResponse("พี่พร้อมส่งใจให้นะครับพี่ สู้ๆ! ❤️"); }
    setIsAnalyzing(false);
    setHealthStory('');
    setMood(null);
  };

  const handleSaveItem = () => {
    const id = Date.now();
    if (addType === 'task' && formData.title) {
      setTodos([...todos, { id, text: String(formData.title), priority: formData.priority, completed: false, deadline: formData.date }]);
    } else if (addType === 'project' && formData.title) {
      setProjects([...projects, { id, name: String(formData.title), tasks: [], targetArea: formData.location, quarter: formData.quarter, budget: Number(formData.amount), note: formData.note }]);
    } else if (addType === 'transaction' && formData.amount) {
      setTransactions([...transactions, { id, title: formData.title || (transactionType === 'income' ? 'รายรับ' : 'รายจ่าย'), amount: Number(formData.amount), type: transactionType }]);
    } else if (addType === 'memo' && formData.title) {
      setMemos([...memos, { id, title: String(formData.title), content: String(formData.content || ''), color: formData.color }]);
    } else if (addType === 'event' && formData.title) {
      setEvents([...events, { id, title: String(formData.title), startTime: formData.startTime || '09:00', endTime: formData.endTime, date: formData.date || new Date().toISOString().split('T')[0], location: formData.location }]);
    }
    setFormData({ color: 'bg-yellow-100', priority: 'ปกติ' });
    setShowAddModal(false);
  };

  const deleteItem = (type: string, id: number) => {
    if (type === 'todo') setTodos(todos.filter(t => t.id !== id));
    if (type === 'project') setProjects(projects.filter(p => p.id !== id));
    if (type === 'trans') setTransactions(transactions.filter(t => t.id !== id));
    if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
    if (type === 'event') setEvents(events.filter(e => e.id !== id));
  };

  // --- View Renders ---
  const renderWorkView = () => (
    <div className="p-4 space-y-6 animate-fade-in pb-24">
      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Calendar size={18} className="text-orange-500"/> นัดหมาย</h3>
        <div className="space-y-2">
          {events.length === 0 ? <p className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-100 rounded-2xl italic">ไม่มีนัดหมายใหม่</p> : 
            events.map(e => (
              <div key={e.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm border-l-4 border-l-orange-500">
                <div className="flex-1">
                  <p className="font-bold text-sm text-gray-800">{e.title}</p>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 font-bold uppercase">
                    <Clock size={10}/> {e.startTime}{e.endTime ? ` - ${e.endTime}` : ''} | {e.date}
                  </p>
                </div>
                <button onClick={() => deleteItem('event', e.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={14}/></button>
              </div>
            ))
          }
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Briefcase size={18} className="text-orange-500"/> โครงการ</h3>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {projects.map(p => (
            <div key={p.id} className="min-w-[220px] bg-gray-900 text-white p-4 rounded-2xl relative shadow-lg group">
              <button onClick={() => deleteItem('project', p.id)} className="absolute top-2 right-2 text-white/20 hover:text-red-400 transition-colors"><X size={14}/></button>
              <span className="text-[9px] bg-orange-500 px-2 py-0.5 rounded-full font-bold">ไตรมาส {p.quarter || '-'}</span>
              <h4 className="font-bold text-sm truncate mt-1">{p.name}</h4>
              <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1"><MapPin size={10}/> {p.targetArea || 'ในพื้นที่'}</p>
              <div className="flex justify-between items-end mb-1">
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">งบ: ฿{p.budget?.toLocaleString()}</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-[0%]"></div></div>
            </div>
          ))}
          <button onClick={() => { setAddType('project'); setShowAddModal(true); }} className="min-w-[120px] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:bg-white transition-all bg-gray-50"><Plus size={24}/><span className="text-[10px] font-black mt-1 uppercase">เพิ่มโครงการ</span></button>
        </div>
      </section>

      <section>
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> งานต้องทำ</h3>
        <div className="space-y-2">
          {todos.map(t => (
            <div key={t.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <input type="checkbox" checked={t.completed} onChange={() => setTodos(todos.map(item => item.id === t.id ? {...item, completed: !item.completed} : item))} className="w-5 h-5 accent-orange-500 rounded-md cursor-pointer"/>
              <div className="flex-1">
                <span className={`text-sm block ${t.completed ? 'line-through text-gray-300' : 'text-gray-800 font-bold'}`}>{t.text}</span>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase ${t.priority === 'ด่วนมาก' ? 'bg-red-50 text-red-500' : t.priority === 'ด่วน' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'}`}>{t.priority}</span>
                   {t.deadline && <span className="text-[8px] text-gray-400 font-bold uppercase tracking-tight"><Clock size={8} className="inline mr-1"/>Due: {t.deadline}</span>}
                </div>
              </div>
              <button onClick={() => deleteItem('todo', t.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderMemoView = () => (
    <div className="p-4 grid grid-cols-2 gap-3 pb-24 animate-fade-in">
      <div className="col-span-2 mb-2">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight uppercase"><StickyNote className="text-yellow-500"/> สมุดจด</h2>
      </div>
      {memos.map(m => (
        <div key={m.id} className={`${m.color} p-4 rounded-3xl relative shadow-sm border border-black/5 hover:rotate-2 transition-transform h-48 flex flex-col`}>
          <button onClick={() => deleteItem('memo', m.id)} className="absolute top-3 right-3 text-black/20 hover:text-black/40"><X size={14}/></button>
          <h4 className="font-bold text-sm mb-2 text-gray-800 leading-tight line-clamp-2">{m.title}</h4>
          <p className="text-[11px] text-gray-700 line-clamp-6 leading-relaxed font-medium flex-1">{m.content}</p>
        </div>
      ))}
      <button onClick={() => { setAddType('memo'); setShowAddModal(true); }} className="border-2 border-dashed border-gray-200 rounded-3xl p-4 flex flex-col items-center justify-center text-gray-400 h-48 hover:bg-white transition-all bg-gray-50"><Plus size={32}/><span className="text-[10px] font-black mt-1 uppercase">โน้ตใหม่</span></button>
    </div>
  );

  const renderFinanceView = () => {
    const balance = transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0);
    return (
      <div className="p-4 space-y-6 pb-24 animate-fade-in">
        <div className="bg-gray-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-[0.2em] font-black tracking-widest">Community Wallet Balance</p>
          <h2 className="text-4xl font-black flex items-center gap-2 tracking-tighter">฿ {balance.toLocaleString()} <Wallet className="text-orange-500" size={24}/></h2>
          <div className="flex gap-4 mt-8">
             <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-green-400 font-black mb-1 uppercase tracking-widest">รายรับ</p>
                <p className="text-sm font-black tracking-tight">฿ {transactions.filter(t=>t.type==='income').reduce((a,c)=>a+c.amount,0).toLocaleString()}</p>
             </div>
             <div className="flex-1 bg-white/5 p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-red-400 font-black mb-1 uppercase tracking-widest">รายจ่าย</p>
                <p className="text-sm font-black tracking-tight">฿ {transactions.filter(t=>t.type==='expense').reduce((a,c)=>a+c.amount,0).toLocaleString()}</p>
             </div>
          </div>
        </div>
        <div className="space-y-2">
          {transactions.map(t => (
            <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                </div>
                <div><p className="font-bold text-sm text-gray-800 tracking-tight">{t.title}</p></div>
              </div>
              <div className="text-right">
                <p className={`font-black text-sm tracking-tight ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</p>
                <button onClick={() => deleteItem('trans', t.id)} className="text-[10px] text-gray-300 font-black hover:text-red-500 uppercase tracking-tighter transition-colors">ลบออก</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHealthView = () => {
    const bmi = parseFloat(calculateBMIValue());
    const bmiInfo = getBMIStatusInfo(bmi);
    return (
      <div className="p-4 space-y-6 pb-24 animate-fade-in">
        <div className="flex justify-between items-end">
            <div><h2 className="text-xl font-black text-gray-800 flex items-center gap-2 tracking-tight uppercase"><Activity className="text-orange-500"/> Health</h2></div>
            <button onClick={() => setShowHealthReport(true)} className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black border border-orange-100 flex items-center gap-1 active:scale-95 transition-all"><BarChart2 size={12}/> สรุปรายสัปดาห์</button>
        </div>

        <section className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
          <Smile size={48} className="mx-auto text-orange-500 mb-4" />
          <h3 className="font-bold text-gray-800 tracking-tight uppercase">วันนี้เป็นยังไงบ้างครับ?</h3>
          <div className="flex justify-center gap-2 mt-4">
            {[1,2,3,4,5].map(lv => (
              <button key={lv} onClick={() => setMood(lv)} className={`text-3xl p-2 rounded-2xl transition-all ${mood === lv ? 'bg-orange-50 scale-125 shadow-sm' : 'grayscale opacity-30'}`}>
                {lv === 1 ? '😫' : lv === 2 ? '😕' : lv === 3 ? '😐' : lv === 4 ? '🙂' : '🤩'}
              </button>
            ))}
          </div>
          <textarea value={healthStory} onChange={e => setHealthStory(e.target.value)} placeholder="เล่าให้พี่พร้อมฟังได้นะ เจออะไรมาบ้าง..." className="w-full mt-6 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 text-sm h-28 resize-none shadow-inner font-medium"></textarea>
          <button onClick={handleHealthSubmit} disabled={isAnalyzing} className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest">
            {isAnalyzing ? <><Sparkles className="animate-spin" size={18}/> กำลังรับฟัง...</> : <><Send size={18}/> ส่งเรื่องราวให้พี่พร้อม</>}
          </button>
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-600 text-white p-5 rounded-[2.5rem] shadow-lg relative overflow-hidden group">
            <Droplets className="absolute right-[-10px] bottom-[-10px] opacity-20" size={100}/>
            <p className="text-[10px] font-black mb-1 opacity-80 uppercase tracking-widest">ดื่มน้ำ</p>
            <div className="flex items-end gap-1"><span className="text-4xl font-black">{waterIntake}</span><span className="text-[10px] font-black opacity-60">/ 8 แก้ว</span></div>
            <div className="flex gap-2 mt-4 relative z-10">
               <button onClick={() => setWaterIntake(w => Math.max(0, w-1))} className="flex-1 bg-white/20 py-2 rounded-xl text-xs font-black">-</button>
               <button onClick={() => setWaterIntake(w => Math.min(12, w+1))} className="flex-1 bg-white/40 py-2 rounded-xl text-xs font-black">+</button>
            </div>
          </div>
          <div className="bg-stone-900 text-white p-5 rounded-[2.5rem] shadow-lg relative overflow-hidden group">
             <Moon className="absolute right-[-10px] bottom-[-10px] opacity-10" size={100}/>
             <p className="text-[10px] font-black mb-1 opacity-80 uppercase tracking-widest">การนอน</p>
             <div className="flex items-end gap-1"><span className="text-4xl font-black">{sleepHours}</span><span className="text-[10px] font-black opacity-60">ชั่วโมง</span></div>
             <div className="flex gap-2 mt-4 relative z-10">
               <button onClick={() => setSleepHours(s => Math.max(0, s-0.5))} className="flex-1 bg-white/20 py-2 rounded-xl text-xs font-black">-</button>
               <button onClick={() => setSleepHours(s => Math.min(12, s+0.5))} className="flex-1 bg-white/40 py-2 rounded-xl text-xs font-black">+</button>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 col-span-2 shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">ก้าวเดินวันนี้</p>
                <Footprints className="text-orange-300" size={16}/>
             </div>
             <div className="flex items-end gap-1"><span className="text-3xl font-black text-gray-800 tracking-tighter">{steps.toLocaleString()}</span><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">/ 10k steps</span></div>
             <input type="range" min="0" max="15000" step="100" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full mt-4 accent-orange-500 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer"/>
          </div>
          <div className="bg-amber-100 p-6 rounded-[2.5rem] border border-amber-200 col-span-2 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">กาแฟ / ชาเย็น</p>
               <div className="flex items-end gap-1 mt-1"><span className="text-3xl font-black text-amber-900 tracking-tighter">{coffeeIntake}</span><span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">แก้วแล้ววันนี้</span></div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setCoffeeIntake(c => Math.max(0, c-1))} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-900 font-black shadow-sm active:scale-90 transition-all">-</button>
                <button onClick={() => setCoffeeIntake(c => c+1)} className="w-12 h-12 bg-amber-800 text-white rounded-2xl flex items-center justify-center font-black shadow-sm active:scale-90 transition-all">+</button>
            </div>
          </div>
        </div>

        {/* BMI Section */}
        <section className="bg-emerald-900 text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <Scale className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-110 transition-transform" size={120}/>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 opacity-80"><Scale size={14}/> Body & BMI Status</h4>
            <div className="flex gap-6 relative z-10">
                <div className="flex-1 space-y-4">
                    <div>
                        <p className="text-[10px] text-emerald-300 font-black mb-1 uppercase tracking-widest">น้ำหนัก (kg)</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setWeight(w => w-1)} className="w-8 h-8 bg-white/10 rounded-lg font-black active:bg-white/20 transition-all">-</button>
                            <span className="font-black text-xl w-8 text-center tracking-tighter">{weight}</span>
                            <button onClick={() => setWeight(w => w+1)} className="w-8 h-8 bg-white/10 rounded-lg font-black active:bg-white/20 transition-all">+</button>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-emerald-300 font-black mb-1 uppercase tracking-widest">ส่วนสูง (cm)</p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setHeight(h => h-1)} className="w-8 h-8 bg-white/10 rounded-lg font-black active:bg-white/20 transition-all">-</button>
                            <span className="font-black text-xl w-8 text-center tracking-tighter">{height}</span>
                            <button onClick={() => setHeight(h => h+1)} className="w-8 h-8 bg-white/10 rounded-lg font-black active:bg-white/20 transition-all">+</button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 bg-white rounded-[2rem] p-4 text-center flex flex-col items-center justify-center shadow-inner border border-white/20">
                    <p className="text-[9px] text-gray-400 font-black mb-1 uppercase tracking-widest">BMI INDEX</p>
                    <p className={`text-4xl font-black tracking-tighter ${bmiInfo.color}`}>{calculateBMIValue()}</p>
                    <p className={`text-[10px] font-black mt-1 px-3 py-1 rounded-full uppercase tracking-tighter ${bmiInfo.color} bg-opacity-10 bg-current`}>{bmiInfo.text}</p>
                </div>
            </div>
        </section>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-600 text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <Users size={80} className="mb-6 animate-bounce" />
        <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">พี่พร้อม</h1>
        <p className="mb-12 opacity-80 text-center font-medium">"เพื่อนคู่คิด ไปไหนไปกัน"</p>
        <button onClick={() => { setIsLoggedIn(true); localStorage.setItem('p_prompt_login', 'true'); }} className="bg-black text-white px-10 py-5 rounded-[2rem] font-black w-full max-w-xs shadow-2xl active:scale-95 transition-all text-lg tracking-tight mt-12">เข้าสู่ระบบพี่พร้อม</button>
        
        {/* Footer Text */}
        <p className="absolute bottom-10 text-[10px] opacity-60 font-medium tracking-tight">Version 1.0 ของขวัญปีใหม่แด่ชาว พช.สุราษฎร์</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen max-w-md mx-auto relative shadow-2xl border-x border-gray-100 font-sans text-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm ring-2 ring-orange-100">
            <Users size={28} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-gray-900 leading-tight tracking-tight uppercase">พี่พร้อม (P'Prompt)</h2>
            <p className="text-[10px] text-orange-600 font-black tracking-tight mt-0.5 uppercase tracking-widest">เพื่อนคู่คิด ไปไหนไปกัน</p>
          </div>
        </div>
        <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('p_prompt_login'); }} className="p-2 text-gray-400 hover:text-black transition-colors"><LogOut size={22} /></button>
      </div>

      <div className="h-full overflow-y-auto custom-scrollbar">
        {activeTab === 'work' && renderWorkView()}
        {activeTab === 'memo' && renderMemoView()}
        {activeTab === 'finance' && renderFinanceView()}
        {activeTab === 'health' && renderHealthView()}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t flex justify-between items-center h-[85px] rounded-t-[2.5rem] px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50">
        <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'work' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Briefcase size={22}/><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-bold tracking-tight">งาน</span></button>
        <button onClick={() => setActiveTab('memo')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'memo' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><StickyNote size={22}/><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-bold tracking-tight">โน้ต</span></button>
        <button onClick={() => { setAddType('event'); setShowAddModal(true); }} className="bg-black text-white p-4 rounded-2xl shadow-2xl relative -top-6 hover:scale-110 active:scale-90 transition-all border-4 border-gray-50"><Plus size={28}/></button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'finance' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Wallet size={22}/><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-bold tracking-tight">บัญชี</span></button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'health' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Activity size={22}/><span className="text-[9px] mt-1 font-black uppercase tracking-widest font-bold tracking-tight">สุขภาพ</span></button>
      </div>

      {/* Add Modal - แก้ไขเรื่องวันที่ในฟอร์มป้อนข้อมูล */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/70 z-[100] flex items-end animate-fade-in p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md mx-auto p-8 rounded-[3rem] animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-xl uppercase tracking-widest tracking-tighter uppercase">เพิ่ม {
                addType === 'event' ? 'นัด' : addType === 'task' ? 'งาน' : addType === 'project' ? 'โครงการ' : addType === 'memo' ? 'โน้ต' : 'บัญชี'
              }</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-all"><X size={20}/></button>
            </div>
            
            <div className="space-y-6">
              {/* ปุ่มเมนูสีส้มตัวใหญ่ */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide gap-1">
                {['event', 'task', 'project', 'memo', 'transaction'].map((t: any) => (
                   <button 
                     key={t} 
                     onClick={() => setAddType(t)} 
                     className={`flex-1 py-4 px-2 text-[16px] font-black rounded-xl transition-all whitespace-nowrap uppercase ${addType === t ? 'bg-orange-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                   >
                     {t === 'event' ? 'นัด' : t === 'task' ? 'งาน' : t === 'project' ? 'โครงการ' : t === 'memo' ? 'โน้ต' : 'บัญชี'}
                   </button>
                ))}
              </div>

              <div className="space-y-5">
                <input type="text" placeholder="หัวข้อเรื่อง / รายการ" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold"/>
                
                {addType === 'transaction' && (
                  <div className="flex gap-2">
                    <button onClick={() => setTransactionType('income')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'income' ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายรับ</button>
                    <button onClick={() => setTransactionType('expense')} className={`flex-1 py-4 rounded-2xl border-2 font-black transition-all ${transactionType === 'expense' ? 'bg-orange-600 border-orange-600 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>รายจ่าย</button>
                  </div>
                )}

                {(addType === 'project' || addType === 'transaction') && (
                  <input type="number" placeholder="จำนวนเงิน / งบประมาณ (฿)" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold"/>
                )}

                {addType === 'project' && (
                  <div className="flex gap-2">
                    <select value={formData.quarter || ''} onChange={e=>setFormData({...formData, quarter:e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-orange-200"><option value="">ไตรมาส</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select>
                    <input type="text" placeholder="พื้นที่เป้าหมาย" value={formData.location || ''} onChange={e=>setFormData({...formData, location:e.target.value})} className="flex-[2] p-4 bg-gray-50 rounded-2xl font-bold outline-none border-none focus:ring-2 focus:ring-orange-200"/>
                  </div>
                )}

                {addType === 'task' && (
                  <div className="flex gap-2">
                    {['ด่วนมาก', 'ด่วน', 'ปกติ'].map(p => (
                      <button key={p} onClick={() => setFormData({...formData, priority: p})} className={`flex-1 py-2 text-[10px] font-black rounded-xl border-2 transition-all ${formData.priority === p ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'border-gray-100 text-gray-400'}`}>{p}</button>
                    ))}
                  </div>
                )}

                {/* --- กำจัดวันที่: โชว์แค่ตอนเป็น 'นัด' หรือ 'งาน' เท่านั้น --- */}
                {(addType === 'event' || addType === 'task') && (
                  <div className="flex gap-2">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase">วันที่</p>
                        <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm"/>
                    </div>
                    {addType === 'event' && (
                      <>
                          <div className="w-24">
                            <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase">เริ่ม</p>
                            <input type="time" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm"/>
                          </div>
                          <div className="w-24">
                            <p className="text-[10px] font-black text-gray-400 mb-1 ml-2 uppercase">สิ้นสุด</p>
                            <input type="time" value={formData.endTime || ''} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold text-sm"/>
                          </div>
                      </>
                    )}
                  </div>
                )}

                {addType === 'memo' && (
                  <>
                    <textarea placeholder="จดรายละเอียดที่นี่..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl h-32 border-none resize-none focus:ring-2 focus:ring-orange-200 font-medium"></textarea>
                    <div className="flex gap-3 px-2">
                        {['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-purple-100'].map(c => (
                            <button key={c} onClick={() => setFormData({...formData, color: c})} className={`w-10 h-10 rounded-full ${c} border border-gray-200 ring-2 ${formData.color === c ? 'ring-orange-500 shadow-lg' : 'ring-transparent'} active:scale-90 transition-all`}></button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button onClick={handleSaveItem} className="w-full bg-black text-white py-4 rounded-[2rem] font-black shadow-xl mt-10 active:scale-95 transition-all uppercase tracking-widest"><Save size={18}/> บันทึกข้อมูล</button>
          </div>
        </div>
      )}

      {showWelcomeQuote && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 animate-fade-in" onClick={() => setShowWelcomeQuote(false)}>
          <div className="bg-white p-10 rounded-[3.5rem] text-center shadow-2xl relative overflow-hidden max-w-sm w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500"><Laugh size={44} /></div>
            <p className="text-xl italic font-bold text-gray-800 leading-relaxed tracking-tight">"{randomQuote}"</p>
            <button onClick={() => setShowWelcomeQuote(false)} className="mt-10 bg-black text-white px-10 py-4 rounded-2xl font-black w-full shadow-xl hover:scale-105 active:scale-95 transition-all">ลุยงานกันเลย!</button>
          </div>
        </div>
      )}

      {/* Health Report Modal */}
      {showHealthReport && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={() => setShowHealthReport(false)}>
              <div className="bg-white w-full max-w-md h-[80vh] sm:h-auto sm:rounded-[3rem] rounded-t-[3rem] p-8 shadow-2xl animate-slide-up relative flex flex-col overflow-hidden text-center" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-widest"><BarChart2 className="text-orange-500"/> รายงานสุขภาพ</h3>
                      <button onClick={() => setShowHealthReport(false)} className="p-2 bg-gray-50 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-6">
                      <div className="bg-gradient-to-br from-orange-500 to-pink-500 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-lg relative overflow-hidden">
                          <Smile size={80} className="absolute right-[-10px] bottom-[-10px] opacity-20" />
                          <div className="relative z-10 text-left">
                              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1 tracking-widest">Score สัปดาห์นี้</p>
                              <h2 className="text-5xl font-black tracking-tighter">88<span className="text-lg opacity-60">/100</span></h2>
                          </div>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 text-center">
                         <p className="font-black text-sm text-gray-800 uppercase mb-2">You are doing great!</p>
                         <p className="text-xs text-gray-500">รักษาระดับการดื่มน้ำและก้าวเดินไว้นะครับพี่ รอยยิ้มของพี่คือพลังของชาวบ้าน!</p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
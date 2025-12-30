import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckSquare, Activity, Smile, Plus, Droplets, Moon, Coffee, Briefcase, Mail, Bell, LogOut, MapPin, Users, FileText, Wallet, TrendingUp, TrendingDown, Heart, X, Clock, Save, Map, Navigation, StickyNote, PenTool, Search, MoreVertical, Target, ChevronRight, Trash2, PieChart, Info, DollarSign, Sparkles, MessageCircle, Send, Footprints, Scale, BarChart2, Phone, User, MessageSquare, Laugh, AlertCircle
} from 'lucide-react';

// --- Configuration ---
const apiKey = ""; 

// --- Types ---
interface Todo { id: number; text: string; priority: string; completed: boolean; deadline?: string; }
interface ProjectTask { id: number; text: string; completed: boolean; }
interface Project { id: number; name: string; deadline: string; tasks: ProjectTask[]; targetArea?: string; budget?: number; note?: string; }
interface CalendarEvent { id: number; title: string; startTime: string; type: string; location?: string; date: string; notified?: boolean; }
interface Transaction { id: number; title: string; amount: number; type: 'income' | 'expense'; date: string; }
interface Memo { id: number; title: string; content: string; color: string; tag: string; date: string; }

const DEFAULT_QUOTES = [
  "งานหลวงไม่ขาด งานราษฎร์ไม่เสีย งานเมียสั่งต้องเป๊ะ!",
  "สู้ชีวิตแต่ชีวิตสู้กลับ... แต่เราคือนักสู้ชุมชน ยอมไม่ได้!",
  "กาแฟยังไม่หมดแก้ว งานเข้าแล้วสามกอง",
  "ยิ้มเข้าไว้ เดี๋ยวผู้ใหญ่ก็ใจอ่อน (มั้ง)",
  "เป็นพัฒนากร ต้องอดทน สิบล้อชนต้องไม่ตาย"
];

const App = () => {
  const [activeTab, setActiveTab] = useState<'work' | 'memo' | 'finance' | 'health'>('work');
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('p_prompt_login') === 'true');

  // --- Persistent State ---
  const [todos, setTodos] = useState<Todo[]>(() => JSON.parse(localStorage.getItem('p_todos') || '[]'));
  const [projects, setProjects] = useState<Project[]>(() => JSON.parse(localStorage.getItem('p_projects') || '[]'));
  const [memos, setMemos] = useState<Memo[]>(() => JSON.parse(localStorage.getItem('p_memos') || '[]'));
  const [transactions, setTransactions] = useState<Transaction[]>(() => JSON.parse(localStorage.getItem('p_trans') || '[]'));
  const [events, setEvents] = useState<CalendarEvent[]>(() => JSON.parse(localStorage.getItem('p_events') || '[]'));
  const [waterIntake, setWaterIntake] = useState(() => Number(localStorage.getItem('p_water') || 0));
  const [steps, setSteps] = useState(() => Number(localStorage.getItem('p_steps') || 0));

  // AI & Mood States
  const [mood, setMood] = useState<number | null>(null);
  const [healthStory, setHealthStory] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // UI States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<'event' | 'task' | 'memo' | 'project' | 'transaction'>('event');
  const [formData, setFormData] = useState<any>({});
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [randomQuote, setRandomQuote] = useState('');
  const [showWelcomeQuote, setShowWelcomeQuote] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // --- Auto-Save ---
  useEffect(() => {
    localStorage.setItem('p_todos', JSON.stringify(todos));
    localStorage.setItem('p_projects', JSON.stringify(projects));
    localStorage.setItem('p_memos', JSON.stringify(memos));
    localStorage.setItem('p_trans', JSON.stringify(transactions));
    localStorage.setItem('p_events', JSON.stringify(events));
    localStorage.setItem('p_water', waterIntake.toString());
    localStorage.setItem('p_steps', steps.toString());
  }, [todos, projects, memos, transactions, events, waterIntake, steps]);

  // --- Notification System ---
  useEffect(() => {
    // ขออนุญาตส่งการแจ้งเตือนบนเบราว์เซอร์
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const checkSchedule = setInterval(() => {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
      const currentDate = now.toISOString().split('T')[0];

      events.forEach(event => {
        if (event.date === currentDate && event.startTime === currentTime && !event.notified) {
          // แจ้งเตือนในแอป
          setNotifications(prev => [...prev, `ถึงเวลานัด: ${event.title}`]);
          
          // แจ้งเตือนผ่านเบราว์เซอร์
          if (Notification.permission === "granted") {
            new Notification("พี่พร้อมแจ้งเตือนนัดหมาย", {
              body: `ขณะนี้เวลา ${event.startTime} น. มีนัด: ${event.title}`,
              icon: "https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
            });
          }

          // ทำเครื่องหมายว่าแจ้งเตือนแล้ว
          setEvents(prev => prev.map(e => e.id === event.id ? {...e, notified: true} : e));
        }
      });
    }, 30000); // เช็คทุกๆ 30 วินาที

    return () => clearInterval(checkSchedule);
  }, [events]);

  useEffect(() => {
    if (isLoggedIn) {
      setRandomQuote(DEFAULT_QUOTES[Math.floor(Math.random() * DEFAULT_QUOTES.length)]);
      setShowWelcomeQuote(true);
    }
  }, [isLoggedIn]);

  // --- Gemini AI ---
  const callGeminiAI = async (moodLevel: number, story: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const prompt = `คุณคือ "พี่พร้อม" ผู้ช่วยรุ่นพี่พัฒนากรจังหวัดสุราษฎร์ธานี ใจดี อบอุ่น น้องพัฒนากรบอกว่าวันนี้เขามีอารมณ์ระดับ ${moodLevel}/5 และเจอเรื่องนี้มา: "${story}" ช่วยตอบให้กำลังใจสั้นๆ ไม่เกิน 3 ประโยค ตบท้ายด้วย emoji`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "พี่พร้อมอยู่ข้างๆ เสมอนะครับ สู้ๆ!";
    } catch (err) {
      return "ช่วงนี้สัญญาณใจขัดข้องนิดหน่อย แต่พี่พร้อมส่งกำลังใจให้นะครับ! ❤️";
    }
  };

  const handleHealthSubmit = async () => {
    if (!mood) return alert("เลือกอารมณ์ก่อนนะครับพี่");
    setIsAnalyzing(true);
    const result = await callGeminiAI(mood, healthStory);
    setAiResponse(result);
    setIsAnalyzing(false);
    setHealthStory('');
    setMood(null);
  };

  const handleSaveItem = () => {
    const id = Date.now();
    if (addType === 'task' && formData.title) {
      setTodos([...todos, { id, text: formData.title, priority: formData.priority || 'ปกติ', completed: false, deadline: formData.date }]);
    } else if (addType === 'project' && formData.title) {
      setProjects([...projects, { id, name: formData.title, deadline: formData.date || '-', tasks: [], targetArea: formData.location, budget: Number(formData.amount) }]);
    } else if (addType === 'transaction' && formData.amount) {
      setTransactions([...transactions, { id, title: formData.title || (transactionType === 'income' ? 'รายรับ' : 'รายจ่าย'), amount: Number(formData.amount), type: transactionType, date: formData.date || new Date().toISOString().split('T')[0] }]);
    } else if (addType === 'memo' && formData.title) {
      setMemos([...memos, { id, title: formData.title, content: formData.content || '', color: formData.color || 'bg-yellow-100', tag: 'ทั่วไป', date: new Date().toLocaleDateString('th-TH') }]);
    } else if (addType === 'event' && formData.title) {
      setEvents([...events, { id, title: formData.title, startTime: formData.startTime || '09:00', type: 'meeting', location: formData.location, date: formData.date || new Date().toISOString().split('T')[0], notified: false }]);
    }
    setFormData({});
    setShowAddModal(false);
  };

  const deleteItem = (type: string, id: number) => {
    if (type === 'todo') setTodos(todos.filter(t => t.id !== id));
    if (type === 'project') setProjects(projects.filter(p => p.id !== id));
    if (type === 'trans') setTransactions(transactions.filter(t => t.id !== id));
    if (type === 'memo') setMemos(memos.filter(m => m.id !== id));
    if (type === 'event') setEvents(events.filter(e => e.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-orange-600 text-white p-6">
        <Users size={80} className="mb-6 animate-bounce" />
        <h1 className="text-4xl font-bold mb-2">พี่พร้อม</h1>
        <p className="mb-12 opacity-80 text-center">"ทำงานได้ทุกที่ พร้อมระบบแจ้งเตือนตารางงาน"</p>
        <button onClick={() => { setIsLoggedIn(true); localStorage.setItem('p_prompt_login', 'true'); }} className="bg-black text-white px-10 py-4 rounded-2xl font-bold w-full max-w-xs shadow-xl active:scale-95 transition-all">เริ่มใช้งาน</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen max-w-md mx-auto relative pb-24 shadow-2xl border-x border-gray-200">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm">พ</div>
          <div><h2 className="text-sm font-bold">พี่พร้อม</h2><p className="text-[10px] text-orange-600 font-bold">พช.สุราษฎร์ฯ</p></div>
        </div>
        <div className="flex items-center gap-1">
            <div className="relative">
                <Bell size={20} className="text-gray-400" />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>}
            </div>
            <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('p_prompt_login'); }} className="p-2 text-gray-400 hover:text-black transition-colors"><LogOut size={20} /></button>
        </div>
      </div>

      {/* Notification Banner */}
      {notifications.length > 0 && (
        <div className="bg-orange-500 text-white p-3 flex items-center justify-between animate-slide-up sticky top-[73px] z-30 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} />
                {notifications[notifications.length - 1]}
            </div>
            <button onClick={() => setNotifications([])} className="p-1 hover:bg-white/20 rounded"><X size={14}/></button>
        </div>
      )}

      <div className="p-4 space-y-6">
        {activeTab === 'work' && (
          <div className="space-y-6 animate-fade-in">
            <section>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-orange-500"/> นัดหมาย</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Today</p>
              </div>
              <div className="space-y-2">
                {events.length === 0 && <p className="text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-100 rounded-2xl italic">ยังไม่มีนัดหมายใหม่</p>}
                {events.map(e => {
                  const isToday = e.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={e.id} className={`bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm transition-all ${isToday ? 'border-l-4 border-l-orange-500' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isToday ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                           <Clock size={16}/>
                        </div>
                        <div>
                           <p className={`font-bold text-sm ${isToday ? 'text-gray-900' : 'text-gray-500'}`}>{e.title}</p>
                           <p className="text-[10px] text-gray-400">{e.startTime} น. | {e.location || 'ลงพื้นที่'} | {e.date}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteItem('event', e.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Briefcase size={18} className="text-orange-500"/> โครงการ (Project)</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {projects.map(p => (
                  <div key={p.id} className="min-w-[200px] bg-gray-900 text-white p-4 rounded-2xl relative shadow-lg group">
                    <button onClick={() => deleteItem('project', p.id)} className="absolute top-2 right-2 text-white/30 hover:text-red-400"><X size={14}/></button>
                    <h4 className="font-bold text-sm truncate mb-1">{p.name}</h4>
                    <p className="text-[10px] text-gray-400 mb-3">ส่ง: {p.deadline}</p>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden"><div className="bg-orange-500 h-full w-1/3"></div></div>
                  </div>
                ))}
                <button onClick={() => { setAddType('project'); setShowAddModal(true); }} className="min-w-[120px] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-all"><Plus/><span className="text-[10px] font-bold mt-1">เพิ่มโครงการ</span></button>
              </div>
            </section>

            <section>
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><CheckSquare size={18} className="text-orange-500"/> รายการต้องทำ</h3>
              <div className="space-y-2">
                {todos.map(t => (
                  <div key={t.id} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm group">
                    <input type="checkbox" checked={t.completed} onChange={() => setTodos(todos.map(item => item.id === t.id ? {...item, completed: !item.completed} : item))} className="w-5 h-5 accent-orange-500 rounded-md cursor-pointer"/>
                    <span className={`text-sm flex-1 ${t.completed ? 'line-through text-gray-300' : ''}`}>{t.text}</span>
                    <button onClick={() => deleteItem('todo', t.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* --- Tab อื่นๆ (Memo, Finance, Health) ใช้โค้ดเดิมที่พี่มีได้เลยครับ --- */}
        {activeTab === 'memo' && (
          <div className="grid grid-cols-2 gap-3 animate-fade-in">
            {memos.map(m => (
              <div key={m.id} className={`${m.color} p-4 rounded-2xl relative shadow-sm border border-black/5`}>
                <button onClick={() => deleteItem('memo', m.id)} className="absolute top-2 right-2 text-black/20"><X size={14}/></button>
                <h4 className="font-bold text-sm mb-1">{m.title}</h4>
                <p className="text-xs text-gray-700 line-clamp-4 leading-relaxed">{m.content}</p>
              </div>
            ))}
            <button onClick={() => { setAddType('memo'); setShowAddModal(true); }} className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 min-h-[120px] hover:bg-white transition-all"><Plus/></button>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16"></div>
              <p className="text-xs text-gray-400 mb-2">ยอดเงินคงเหลือปัจจุบัน</p>
              <h2 className="text-4xl font-extrabold">฿ {transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}</h2>
            </div>
            <div className="space-y-2">
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{t.type === 'income' ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}</div>
                    <div><p className="font-bold text-sm">{t.title}</p><p className="text-[10px] text-gray-400">{t.date}</p></div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</p>
                    <button onClick={() => deleteItem('trans', t.id)} className="text-[10px] text-gray-300">ลบ</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-6 animate-fade-in">
            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500"><Smile size={32} /></div>
              <h3 className="font-bold text-gray-800">วันนี้เป็นยังไงบ้างครับ?</h3>
              <div className="flex justify-center gap-3 mt-4">
                {[1,2,3,4,5].map(lv => (
                  <button key={lv} onClick={() => setMood(lv)} className={`text-3xl p-2 rounded-2xl transition-all ${mood === lv ? 'bg-orange-100 scale-125 shadow-sm' : 'grayscale opacity-40'}`}>
                    {lv === 1 ? '😫' : lv === 2 ? '😕' : lv === 3 ? '😐' : lv === 4 ? '🙂' : '🤩'}
                  </button>
                ))}
              </div>
              <textarea value={healthStory} onChange={e => setHealthStory(e.target.value)} placeholder="เล่าให้พี่พร้อมฟังได้นะ เจออะไรมาบ้าง..." className="w-full mt-6 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 text-sm h-28 resize-none shadow-inner"></textarea>
              <button onClick={handleHealthSubmit} disabled={isAnalyzing} className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 transition-all">
                {isAnalyzing ? <><Sparkles className="animate-spin"/> พี่พร้อมกำลังคิด...</> : <><Send size={18}/> ส่งเรื่องราว</>}
              </button>
            </section>
            {aiResponse && (
              <div className="bg-indigo-600 text-white p-6 rounded-[2rem] shadow-xl animate-slide-up relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10"><MessageCircle size={80}/></div>
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><Sparkles size={16}/> พี่พร้อมบอกว่า:</h4>
                <p className="text-sm leading-relaxed font-medium">"{aiResponse}"</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-600 text-white p-5 rounded-[2rem] shadow-lg relative overflow-hidden">
                <Droplets className="absolute right-[-10px] bottom-[-10px] opacity-20" size={80}/>
                <p className="text-xs font-bold mb-1 opacity-80">ดื่มน้ำ</p>
                <div className="flex items-end gap-1"><span className="text-4xl font-black">{waterIntake}</span><span className="text-[10px] font-bold opacity-60">/ 8 แก้ว</span></div>
                <button onClick={() => setWaterIntake(w => Math.min(8, w + 1))} className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-xl text-xs font-bold transition-all">+</button>
              </div>
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                <p className="text-xs font-bold mb-1 text-gray-400">ก้าวเดิน</p>
                <div className="flex items-end gap-1"><span className="text-3xl font-black text-gray-800">{steps.toLocaleString()}</span><span className="text-[10px] font-bold text-gray-400">ก้าว</span></div>
                <input type="range" min="0" max="15000" step="500" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className="w-full mt-4 accent-orange-500 h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer"/>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 flex justify-between items-center h-[80px] rounded-t-[2.5rem] px-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] max-w-md mx-auto z-50">
        <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'work' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Briefcase size={22}/><span className="text-[9px] mt-1">งาน</span></button>
        <button onClick={() => setActiveTab('memo')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'memo' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><StickyNote size={22}/><span className="text-[9px] mt-1">โน้ต</span></button>
        <button onClick={() => { setAddType('event'); setShowAddModal(true); }} className="bg-black text-white p-4 rounded-2xl shadow-2xl relative -top-6 hover:scale-110 active:scale-90 transition-all border-4 border-gray-50"><Plus size={28}/></button>
        <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'finance' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Wallet size={22}/><span className="text-[9px] mt-1">เงิน</span></button>
        <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center flex-1 transition-all ${activeTab === 'health' ? 'text-orange-600 scale-110 font-bold' : 'text-gray-300'}`}><Activity size={22}/><span className="text-[9px] mt-1">สุขภาพ</span></button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-end animate-fade-in p-4">
          <div className="bg-white w-full max-w-md mx-auto p-8 rounded-[2.5rem] animate-slide-up shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="font-bold text-xl">เพิ่ม{addType === 'event' ? 'นัดหมาย' : addType === 'task' ? 'งาน' : addType === 'project' ? 'โครงการ' : addType === 'memo' ? 'บันทึก' : 'รายการเงิน'}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X/></button>
            </div>
            
            <div className="space-y-5">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
                {['event', 'task', 'project', 'memo', 'transaction'].map((t: any) => (
                   <button key={t} onClick={() => setAddType(t)} className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${addType === t ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>
                     {t === 'event' ? 'นัด' : t === 'task' ? 'งาน' : t === 'project' ? 'โครงการ' : t === 'memo' ? 'โน้ต' : 'เงิน'}
                   </button>
                ))}
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="หัวข้อ / รายการ" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-medium"/>
                {(addType === 'project' || addType === 'transaction') && (
                  <input type="number" placeholder="จำนวนเงิน" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-medium"/>
                )}
                <div className="flex gap-2">
                    <input type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-medium text-sm"/>
                    {addType === 'event' && <input type="time" value={formData.startTime || ''} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-32 p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-medium text-sm"/>}
                </div>
                {addType === 'memo' && <textarea placeholder="จดรายละเอียด..." value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl h-32 border-none focus:ring-2 focus:ring-orange-200 resize-none"></textarea>}
              </div>
            </div>

            <button onClick={handleSaveItem} className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-xl mt-8 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={18}/> บันทึกข้อมูล</button>
          </div>
        </div>
      )}

      {/* Welcome Quote Popup */}
      {showWelcomeQuote && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 animate-fade-in" onClick={() => setShowWelcomeQuote(false)}>
          <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 to-orange-600"></div>
            <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500"><Smile size={40} /></div>
            <p className="text-xl italic font-bold text-gray-800 leading-relaxed">"{randomQuote}"</p>
            <button onClick={() => setShowWelcomeQuote(false)} className="mt-10 bg-black text-white px-10 py-4 rounded-2xl font-bold w-full shadow-xl hover:scale-105 active:scale-95 transition-all">ลุยงานกันเลยครับ!</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
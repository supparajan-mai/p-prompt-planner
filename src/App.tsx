import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  CheckSquare, 
  Activity, 
  Smile, 
  Plus, 
  Droplets, 
  Moon, 
  Coffee,
  Briefcase,
  Mail,
  Bell,
  LogOut,
  MapPin,
  Users,
  FileText,
  Wallet,
  TrendingUp,
  TrendingDown,
  Heart,
  X,
  Clock,
  Save,
  Map,
  Navigation,
  StickyNote,
  PenTool,
  Search,
  MoreVertical,
  Target,
  ChevronRight,
  Trash2,
  PieChart,
  Info,
  DollarSign,
  Sparkles,
  MessageCircle,
  Send,
  Footprints,
  Scale,
  BarChart2,
  Phone,
  User,
  MessageSquare,
  Laugh
} from 'lucide-react';

// --- Types ---
interface Todo {
  id: number;
  text: string;
  priority: 'ด่วนมาก' | 'ด่วน' | 'ปกติ';
  completed: boolean;
  deadline?: string;
}

interface ProjectTask {
  id: number;
  text: string;
  completed: boolean;
}

interface Project {
  id: number;
  name: string;
  deadline: string;
  tasks: ProjectTask[]; 
  targetArea?: string;
  quarter?: string;
  budget?: number;
  note?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  startTime: string; 
  endTime?: string;  
  type: 'meeting' | 'field' | 'personal';
  location?: string;
  coordinates?: string;
}

interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
}

interface Memo {
  id: number;
  title: string;
  content: string;
  color: string; 
  tag: string;
  date: string;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  village: string; 
  phone: string;
  lineId: string; 
  avatarColor: string;
}

// --- Mock Data (Empty for Production) ---
const MOCK_EVENTS: CalendarEvent[] = [];
const MOCK_PROJECTS: Project[] = [];
const MOCK_MEMOS: Memo[] = [];
const MOCK_CONTACTS: Contact[] = [];

// --- Configuration: Google Sheets Integration ---
const GOOGLE_SHEET_ID = '1LC1mBr7ZtAFamAf9zpqT20Cp5g8ySTx5XY1n_14HDDU'; 

const DEFAULT_QUOTES = [
  "งานหลวงไม่ขาด งานราษฎร์ไม่เสีย งานเมียสั่งต้องเป๊ะ!",
  "สู้ชีวิตแต่ชีวิตสู้กลับ... แต่เราคือนักสู้ชุมชน ยอมไม่ได้!",
  "กาแฟยังไม่หมดแก้ว งานเข้าแล้วสามกอง",
  "ปิดทองหลังพระ จนพระจะกลายเป็นทองคำแท่งแล้วจ้า",
  "ยิ้มเข้าไว้ เดี๋ยวผู้ใหญ่ก็ใจอ่อน (มั้ง)",
  "เงินเดือนหลักหมื่น งานหลักแสน แฟนหลักลอย",
  "ลงพื้นที่แดดร้อนไม่กลัว กลัวชาวบ้านจำชื่อไม่ได้",
  "ทำงานให้สนุก... แม้ในใจจะอยากลุกไปนอน",
  "ความพยายามอยู่ที่ไหน ความสำเร็จ... อาจจะอยู่ที่เดิมถ้าเน็ตช้า",
  "ประชุมเช้า ลงพื้นที่บ่าย เย็นสบาย... (เหรอ?)",
  "เป็นพัฒนากร ต้องอดทน สิบล้อชนต้องไม่ตาย (แค่เจ็บ)",
  "วันนี้วันศุกร์ (ในจินตนาการ)"
];

const App = () => {
  const [activeTab, setActiveTab] = useState<'work' | 'memo' | 'finance' | 'health'>('work');
  
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem('p_prompt_login');
    return saved === 'true';
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState<number | null>(null);
  const [showHealthReport, setShowHealthReport] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showWelcomeQuote, setShowWelcomeQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState('');
  
  const [quotesList, setQuotesList] = useState<string[]>(DEFAULT_QUOTES);
  
  const [addType, setAddType] = useState<'event' | 'task' | 'memo' | 'project' | 'transaction'>('event');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  // Global Input States (Moved here to fix re-render focus issues)
  const [projectTaskText, setProjectTaskText] = useState('');
  const [contactView, setContactView] = useState<'list' | 'add'>('list');
  const [newContactData, setNewContactData] = useState<Partial<Contact>>({ avatarColor: 'bg-gray-400' });

  // Tasks State
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // Health & AI States
  const [waterIntake, setWaterIntake] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [sleepHours, setSleepHours] = useState(0);
  const [healthStory, setHealthStory] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // New Health States
  const [steps, setSteps] = useState(0);
  const [weight, setWeight] = useState(0);
  const [height, setHeight] = useState(0);
  const [coffeeIntake, setCoffeeIntake] = useState(0);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Other Data States
  const [memos, setMemos] = useState<Memo[]>([]); 
  const [projects, setProjects] = useState<Project[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]); 

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch Quotes and Check LocalStorage on Mount
  useEffect(() => {
    if (GOOGLE_SHEET_ID) {
      fetch(`https://opensheet.elk.sh/${GOOGLE_SHEET_ID}/1`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const cleanData = data.map((item: any) => {
               return item.text || item.quote || item.content || Object.values(item)[0];
            }).filter(Boolean);
            
            if (cleanData.length > 0) setQuotesList(cleanData);
          }
        })
        .catch(err => console.log('Using default quotes due to fetch error:', err));
    }

    const savedLogin = localStorage.getItem('p_prompt_login');
    if (savedLogin === 'true') {
      setIsLoggedIn(true);
      const quote = quotesList[Math.floor(Math.random() * quotesList.length)];
      setRandomQuote(quote);
      setShowWelcomeQuote(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('p_prompt_login', 'true');
    const quote = quotesList[Math.floor(Math.random() * quotesList.length)];
    setRandomQuote(quote);
    setShowWelcomeQuote(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('p_prompt_login');
  };

  const openMap = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  const calculateProgress = (tasks: ProjectTask[]) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const toggleProjectTask = (projectId: number, taskId: number) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        };
      }
      return p;
    }));
  };

  const addProjectTask = (projectId: number, taskText: string) => {
    if (!taskText.trim()) return;
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: [...p.tasks, { id: Date.now(), text: taskText, completed: false }]
        };
      }
      return p;
    }));
  };

  // --- AI Logic Integration ---
  const callGeminiAI = async (moodLevel: number, story: string) => {
    const apiKey = ""; // API Key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    
    const prompt = `
      คุณคือ "พี่พร้อม" (P'Prompt) ผู้ช่วยรุ่นพี่ของนักพัฒนาชุมชน (พัฒนากร) ในจังหวัดสุราษฎร์ธานี
      บุคลิก: ใจดี, อบอุ่น, ขี้เล่นนิดๆ, ใช้ภาษาไทยที่เป็นกันเองเหมือนพี่คุยกับน้อง, ให้กำลังใจเก่ง
      
      ข้อมูลผู้ใช้งานวันนี้:
      - คะแนนอารมณ์: ${moodLevel}/5 (1=แย่มาก, 5=ดีมาก)
      - เรื่องราวที่เจอมา: "${story}"

      ภารกิจ:
      เขียนข้อความตอบกลับสั้นๆ (ไม่เกิน 3 ประโยค) เพื่อให้กำลังใจ หรือแสดงความยินดีตามบริบท
      ถ้าคะแนนอารมณ์น้อย ให้ปลอบใจและให้พลังบวก
      ถ้าคะแนนอารมณ์เยอะ ให้ร่วมยินดีและชื่นชม
      ถ้ามีเรื่องราว ให้พูดถึงเรื่องราวนั้นด้วยให้เขารู้สึกว่าเราใส่ใจจริงๆ
      ตบท้ายด้วยคำคมหรือ emoji น่ารักๆ
    `;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const maxRetries = 5;
    let delay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "พี่พร้อมรับทราบครับ! วันนี้คุณเก่งมากแล้ว พักผ่อนเยอะๆ นะครับ 🧡";

      } catch (error) {
        console.error(`Attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) return "พี่พร้อมส่งกำลังใจให้นะครับ! (ตอนนี้สัญญาณใจขัดข้องนิดหน่อย แต่ความห่วงใยเต็มเปี่ยม!) 📡❤️";
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  const handleHealthSubmit = async () => {
    if (!mood) {
        alert("กรุณาเลือกอารมณ์ก่อนนะครับ");
        return;
    }
    setIsAnalyzing(true);
    setAiResponse(null);
    
    // เรียกใช้ AI จริงๆ
    const response = await callGeminiAI(mood, healthStory);
    
    setAiResponse(response);
    setIsAnalyzing(false);
    
    // เคลียร์เรื่องเล่าและอารมณ์เพื่อให้เขียนใหม่ได้ง่าย
    setHealthStory(''); 
    setMood(null);
  };

  // BMI Helpers
  const calculateBMI = () => {
    const hInMeters = height / 100;
    const bmi = weight / (hInMeters * hInMeters);
    return isNaN(bmi) ? 0 : bmi.toFixed(1);
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { text: 'ผอม', color: 'text-blue-500' };
    if (bmi < 23) return { text: 'ปกติ', color: 'text-green-500' };
    if (bmi < 25) return { text: 'ท้วม', color: 'text-yellow-500' };
    if (bmi < 30) return { text: 'อ้วน', color: 'text-orange-500' };
    return { text: 'อ้วนมาก', color: 'text-red-500' };
  };

  // --- Components as Functions to avoid Remounting ---

  const LoginScreen = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-orange-500 to-orange-700 text-white p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
      <div className="mb-6 relative">
        <div className="p-6 bg-white rounded-full shadow-2xl border-4 border-black/80 relative z-10">
           <div className="flex -space-x-4 items-end">
              <Users size={64} className="text-orange-600" />
           </div>
           <div className="absolute -bottom-2 -right-2 bg-black text-white p-1.5 rounded-full border-2 border-white">
             <Heart size={16} fill="currentColor" />
           </div>
        </div>
      </div>
      <h1 className="text-4xl font-extrabold mb-1 text-center tracking-tight text-white drop-shadow-md">
        พี่พร้อม <span className="text-black font-serif italic text-2xl opacity-80">P'Prompt</span>
      </h1>
      <div className="text-white/90 mb-12 text-center space-y-1">
        <p className="text-lg font-medium">"เพื่อนคู่คิด ไปไหนไปกัน"</p>
        <div className="w-16 h-1 bg-black/20 mx-auto rounded-full my-3"></div>
      </div>
      <button 
        onClick={handleLogin}
        className="group relative flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all font-bold w-full max-w-xs justify-center overflow-hidden ring-4 ring-white/20"
      >
        <span className="relative z-10 flex items-center gap-2">
          เริ่มใช้งานพี่พร้อม
          <Briefcase size={18} className="text-orange-500" />
        </span>
      </button>
    </div>
  );

  const WelcomeQuoteModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-fade-in" onClick={() => setShowWelcomeQuote(false)}>
        <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-scale-in text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-pink-500"></div>
            <div className="mb-4 text-orange-500 flex justify-center">
                <Laugh size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">สวัสดีครับ!</h3>
            <p className="text-lg text-gray-600 font-medium italic leading-relaxed mb-8">
                "{randomQuote}"
            </p>
            <button 
                onClick={() => setShowWelcomeQuote(false)}
                className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
                ลุยงานกันเลย!
            </button>
        </div>
    </div>
  );

  const ContactModal = () => {
    const filteredContacts = contacts.filter(c => 
      c.name.includes(searchTerm) || 
      c.role.includes(searchTerm) || 
      c.village.includes(searchTerm)
    );

    const handleAddContact = () => {
        if (!newContactData.name || !newContactData.phone) return;
        const contact: Contact = {
            id: Date.now(),
            name: newContactData.name,
            role: newContactData.role || 'ทั่วไป',
            village: newContactData.village || '-',
            phone: newContactData.phone,
            lineId: newContactData.lineId || '-',
            avatarColor: ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 5)]
        };
        setContacts([...contacts, contact]);
        setContactView('list');
        setNewContactData({});
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-slide-up relative flex flex-col overflow-hidden">
           {contactView === 'list' ? (
               <>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Users size={24} className="text-blue-500" />
                            ทำเนียบเครือข่าย
                        </h3>
                        <p className="text-gray-500 text-xs">ค้นหาและติดต่อผู้นำชุมชน</p>
                    </div>
                    <button onClick={() => setShowContacts(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input type="text" placeholder="ค้นหาชื่อ, ตำแหน่ง หรือหมู่บ้าน..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {filteredContacts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">ไม่พบรายชื่อ</div>
                    ) : (
                    filteredContacts.map(contact => (
                        <div key={contact.id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-full ${contact.avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>{contact.name.charAt(0)}</div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{contact.name}</h4>
                                <p className="text-xs text-blue-600 font-medium">{contact.role}</p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {contact.village}</p>
                                {contact.lineId && <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5 font-bold"><span className="bg-green-100 px-1 rounded text-[9px]">LINE</span> {contact.lineId}</p>}
                            </div>
                            <button onClick={() => { const url = `https://line.me/ti/p/~${contact.lineId}`; window.open(url, '_blank'); }} className="p-2.5 bg-[#06C755] text-white rounded-full hover:bg-[#05b34c] transition-colors shadow-sm" title="โทรไลน์"><Phone size={18} /></button>
                        </div>
                    ))
                    )}
                </div>
                <button className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors" onClick={() => setContactView('add')}>
                    <Plus size={18} /> เพิ่มรายชื่อใหม่
                </button>
               </>
           ) : (
               <>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">เพิ่มรายชื่อใหม่</h3>
                    <button onClick={() => setContactView('list')} className="text-sm text-gray-500 hover:text-gray-800">ยกเลิก</button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ชื่อ - นามสกุล</label>
                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="เช่น ผู้ใหญ่สมชาย ใจดี" value={newContactData.name || ''} onChange={e => setNewContactData({...newContactData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">ตำแหน่ง</label>
                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="เช่น ผู้ใหญ่บ้าน, ประธานกลุ่ม" value={newContactData.role || ''} onChange={e => setNewContactData({...newContactData, role: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">หมู่บ้าน / สังกัด</label>
                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="เช่น ม.1 ต.บางใบไม้" value={newContactData.village || ''} onChange={e => setNewContactData({...newContactData, village: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">เบอร์โทรศัพท์</label>
                        <input type="tel" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="08x-xxx-xxxx" value={newContactData.phone || ''} onChange={e => setNewContactData({...newContactData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">LINE ID</label>
                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="ไอดีไลน์ (ถ้ามี)" value={newContactData.lineId || ''} onChange={e => setNewContactData({...newContactData, lineId: e.target.value})} />
                    </div>
                </div>
                <button onClick={handleAddContact} className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors">
                    บันทึกรายชื่อ
                </button>
               </>
           )}
        </div>
      </div>
    );
  };

  const HealthReportModal = () => {
    const weeklyMoods = [3, 4, 2, 5, 4, 3, mood || 3]; 
    const healthScore = Math.min(100, Math.round(((waterIntake/8 + sleepHours/7.5 + steps/10000) / 3) * 100));
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md h-[85vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-slide-up relative flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={24} className="text-orange-500" />
                            สรุปสุขภาพรายสัปดาห์
                        </h3>
                        <p className="text-gray-500 text-xs">ข้อมูลวิเคราะห์จากพี่พร้อม</p>
                    </div>
                    <button onClick={() => setShowHealthReport(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-6">
                    <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-5 text-white flex justify-between items-center relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4"><Heart size={120} /></div>
                        <div>
                            <p className="text-orange-100 text-sm font-medium mb-1">คะแนนสุขภาพรวม</p>
                            <h2 className="text-4xl font-extrabold">{healthScore}/100</h2>
                            <p className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">{healthScore > 80 ? 'ยอดเยี่ยม!' : healthScore > 50 ? 'ดีพอใช้' : 'ต้องดูแลตัวเองเพิ่มนะ'}</p>
                        </div>
                        <div className="w-20 h-20 relative">
                             <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-white/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-white drop-shadow-md" strokeDasharray={`${healthScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                             </svg>
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2"><Smile size={16} /> กราฟอารมณ์ 7 วันล่าสุด</h4>
                        <div className="flex items-end justify-between h-32 px-2">
                            {weeklyMoods.map((m, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 w-full">
                                    <div className={`w-3 sm:w-4 rounded-t-lg transition-all duration-1000 ${m >= 4 ? 'bg-green-400' : m === 3 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ height: `${m * 20}%` }}></div>
                                    <span className="text-[10px] text-gray-400">{['อา','จ','อ','พ','พฤ','ศ','ส'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                        <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2"><Sparkles size={16} /> คำแนะนำจากพี่พร้อม</h4>
                        <ul className="space-y-2 text-xs text-blue-700">
                            {coffeeIntake > 2 && <li className="flex gap-2 items-start"><div className="min-w-[4px] h-[4px] bg-blue-400 rounded-full mt-1.5"></div><span>ช่วงนี้ดื่มกาแฟ/ชาเย็นหนักไปนิด ลองลดลงหรือดื่มน้ำเปล่าสลับบ้างนะครับ</span></li>}
                            {sleepHours < 6 && <li className="flex gap-2 items-start"><div className="min-w-[4px] h-[4px] bg-blue-400 rounded-full mt-1.5"></div><span>การนอนน้อยกว่า 6 ชม. อาจทำให้หงุดหงิดง่าย หาเวลางีบพักสายตาสัก 15 นาทีช่วยได้ครับ</span></li>}
                            {steps < 5000 && <li className="flex gap-2 items-start"><div className="min-w-[4px] h-[4px] bg-blue-400 rounded-full mt-1.5"></div><span>ขยับตัวอีกนิด! ลองเดินไปคุยงานแทนการโทร หรือเดินรอบศาลากลางสักรอบครับ</span></li>}
                            <li className="flex gap-2 items-start"><div className="min-w-[4px] h-[4px] bg-blue-400 rounded-full mt-1.5"></div><span>โดยรวมแล้ว คุณทำหน้าที่ได้ดีมาก อย่าลืมดูแลใจตัวเองด้วยนะครับ</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const ProjectDetailModal = () => {
    const project = projects.find(p => p.id === showProjectDetail);

    if (!project) return null;

    const progress = calculateProgress(project.tasks);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
        <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-slide-up relative flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <Briefcase size={24} className="text-emerald-600" />
                 รายละเอียดโครงการ
               </h3>
               <p className="text-gray-500 text-xs">ข้อมูลและการดำเนินงาน</p>
            </div>
            <button onClick={() => setShowProjectDetail(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500" /></button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-5 text-white mb-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <h2 className="text-lg font-bold mb-3">{project.name}</h2>
                <div className="grid grid-cols-2 gap-2 text-emerald-100 text-xs mb-4">
                  <div className="flex items-center gap-1.5"><Clock size={12} /> กำหนด: {project.deadline}</div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} /> {project.targetArea || '-'}</div>
                  <div className="flex items-center gap-1.5"><PieChart size={12} /> ไตรมาส: {project.quarter || '-'}</div>
                  <div className="flex items-center gap-1.5 font-bold"><span className="text-sm">฿</span> งบ: {project.budget ? `${project.budget.toLocaleString()}` : '-'}</div>
                </div>
                <div className="flex items-end justify-between mb-2">
                   <span className="text-sm font-medium">ความคืบหน้า</span>
                   <span className="text-2xl font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-3">
                  <div className="bg-emerald-300 h-3 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(110,231,183,0.5)]" style={{ width: `${progress}%` }}></div>
                </div>
             </div>
             {project.note && (
               <div className="mb-6 bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-xs text-yellow-800 flex gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <div><span className="font-bold block mb-0.5">หมายเหตุ:</span>{project.note}</div>
               </div>
             )}
             <div className="space-y-3 mb-6">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><CheckSquare size={16} /> กิจกรรมที่ต้องทำ</h4>
                {project.tasks.length === 0 && <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีกิจกรรม</p>}
                {project.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all cursor-pointer" onClick={() => toggleProjectTask(project.id, task.id)}>
                     <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>{task.completed && <CheckSquare size={12} />}</div>
                     <span className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{task.text}</span>
                  </div>
                ))}
             </div>
          </div>
          <div className="mt-auto pt-4 border-t border-gray-100">
             <div className="flex gap-2">
               <input type="text" value={projectTaskText} onChange={(e) => setProjectTaskText(e.target.value)} placeholder="เพิ่มกิจกรรมใหม่..." className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" onKeyPress={(e) => { if (e.key === 'Enter') { addProjectTask(project.id, projectTaskText); setProjectTaskText(''); } }} />
               <button onClick={() => { addProjectTask(project.id, projectTaskText); setProjectTaskText(''); }} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors"><Plus size={20} /></button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const AddModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up relative">
        <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500" /></button>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Plus size={24} className="text-orange-600" /> เพิ่มรายการใหม่</h3>
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto scrollbar-hide">
          <button onClick={() => setAddType('event')} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${addType === 'event' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'}`}>นัดหมาย</button>
          <button onClick={() => setAddType('task')} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${addType === 'task' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>งาน</button>
           <button onClick={() => setAddType('project')} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${addType === 'project' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>โครงการ</button>
          <button onClick={() => setAddType('memo')} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${addType === 'memo' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500'}`}>โน้ต</button>
          <button onClick={() => setAddType('transaction')} className={`flex-1 py-2 px-2 text-xs sm:text-sm font-bold rounded-lg transition-all whitespace-nowrap ${addType === 'transaction' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>บัญชี</button>
        </div>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
          {addType === 'transaction' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">ประเภท</label>
                <div className="flex gap-2">
                  <button onClick={() => setTransactionType('income')} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${transactionType === 'income' ? 'bg-green-100 border-green-200 text-green-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500'}`}><TrendingUp size={18} /> รายรับ</button>
                  <button onClick={() => setTransactionType('expense')} className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${transactionType === 'expense' ? 'bg-red-100 border-red-200 text-red-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500'}`}><TrendingDown size={18} /> รายจ่าย</button>
                </div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">รายการ</label><input type="text" placeholder={transactionType === 'income' ? "เช่น ยอดยกมา, เงินเดือน, เบี้ยเลี้ยง" : "เช่น ค่าอาหาร, เติมน้ำมัน"} className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" /></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">จำนวนเงิน (บาท)</label><input type="number" placeholder="0.00" className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" /></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">วันที่</label><input type="date" className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500" /></div></div>
            </>
          ) : addType === 'memo' ? (
            <>
               <div><label className="block text-xs font-bold text-gray-500 mb-1">หัวข้อเรื่อง</label><input type="text" placeholder="เช่น ไอเดียใหม่, กันลืม" className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500" /></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">เนื้อหา</label><textarea rows={4} placeholder="จดบันทึกรายละเอียด..." className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 resize-none"></textarea></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">สีโน้ต</label><div className="flex gap-3">{['bg-yellow-100', 'bg-blue-100', 'bg-pink-100', 'bg-green-100'].map(color => (<button key={color} className={`w-8 h-8 rounded-full ${color} border border-gray-200 shadow-sm hover:scale-110 transition-transform`}></button>))}</div></div>
            </>
          ) : addType === 'project' ? (
            <>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">ชื่อโครงการ</label><input type="text" placeholder="เช่น โคก หนอง นา โมเดล" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div>
              <div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">ไตรมาส</label><div className="flex bg-emerald-50 rounded-xl p-1 border border-emerald-200">{[1,2,3,4].map(q => (<button key={q} className="flex-1 py-2 text-xs font-bold text-emerald-700 hover:bg-white hover:shadow-sm rounded-lg transition-all">{q}</button>))}</div></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">กำหนดส่ง</label><input type="date" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500" /></div></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">พื้นที่เป้าหมาย</label><div className="relative"><MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" /><input type="text" placeholder="ระบุพื้นที่ดำเนินการ (หมู่/ตำบล)" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">งบประมาณ (บาท)</label><div className="relative"><span className="absolute left-3.5 top-3.5 text-gray-400 font-bold text-sm">฿</span><input type="number" placeholder="0.00" className="w-full bg-emerald-50 border border-emerald-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500" /></div></div>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">หมายเหตุ</label><textarea rows={2} placeholder="บันทึกจิปาถะ..." className="w-full bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 resize-none"></textarea></div>
               <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100"><p className="text-xs text-emerald-800 flex items-center gap-2"><CheckSquare size={14} /> สามารถเพิ่ม "กิจกรรมย่อย" ได้หลังจากสร้างโครงการเสร็จสิ้น</p></div>
            </>
          ) : (
            <>
              <div><label className="block text-xs font-bold text-gray-500 mb-1">หัวข้อ / ชื่องาน</label><input type="text" placeholder={addType === 'event' ? "เช่น ประชุมอำเภอ" : "เช่น ส่งรายงาน"} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
              {addType === 'event' && (
                <>
                  <div className="flex gap-3"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">เวลาเริ่ม</label><input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">เวลาสิ้นสุด</label><input type="time" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">วันที่</label><input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div>
                   <div><label className="block text-xs font-bold text-gray-500 mb-1">สถานที่ / พิกัด</label><div className="flex gap-2"><div className="relative flex-1"><MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" /><input type="text" placeholder="ค้นหาสถานที่" className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500" /></div><button className="bg-orange-100 text-orange-600 p-3 rounded-xl hover:bg-orange-200 transition-colors"><Map size={20} /></button></div></div>
                </>
              )}
               {addType === 'task' && (
                  <>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">ระดับความสำคัญ</label><div className="flex gap-2"><button className="flex-1 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">ด่วนมาก</button><button className="flex-1 py-2 rounded-lg border border-orange-200 text-orange-600 text-xs font-medium hover:bg-orange-50 transition-colors">ด่วน</button><button className="flex-1 py-2 rounded-lg border border-green-200 text-green-600 text-xs font-medium hover:bg-green-50 transition-colors">ปกติ</button></div></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">กำหนดส่ง (Deadline)</label><input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" /></div>
                  </>
               )}
            </>
          )}
          <button onClick={() => { setShowAddModal(false); alert('บันทึกข้อมูลเรียบร้อย!'); }} className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all ${ addType === 'memo' ? 'bg-yellow-500 shadow-yellow-500/20' : addType === 'project' ? 'bg-emerald-600 shadow-emerald-500/20' : addType === 'transaction' ? 'bg-blue-600 shadow-blue-500/20' : addType === 'event' ? 'bg-black shadow-orange-500/20' : 'bg-indigo-600 shadow-indigo-500/20' }`}>
            <Save size={18} /> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );

  const Header = () => (
    <div className="flex justify-between items-center p-4 bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white">พ</div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">พี่พร้อม (P'Prompt)</h2>
          <p className="text-[10px] text-orange-600 flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full w-fit font-medium"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>พช.สุราษฎร์ฯ</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setShowContacts(true)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 rounded-full relative transition-colors" title="สมุดรายชื่อ"><Users size={20} /></button>
        <button onClick={() => alert('ไม่มีการแจ้งเตือนใหม่')} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-orange-600 rounded-full relative transition-colors"><Bell size={20} /><span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span></button>
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:bg-black/5 hover:text-black rounded-full transition-colors" title="ออกจากระบบ"><LogOut size={20} /></button>
      </div>
    </div>
  );

  const WorkView = () => (
    <div className="space-y-6 pb-20 p-4 animate-fade-in">
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-orange-600" /> ตารางงาน</h3>
          <span className="text-xs text-orange-600 font-bold cursor-pointer bg-orange-50 px-3 py-1 rounded-full hover:bg-orange-100 border border-orange-100">ดูปฏิทิน Google</span>
        </div>
        <div className="space-y-3">
          {MOCK_EVENTS.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">ยังไม่มีนัดหมาย</p> : MOCK_EVENTS.map(event => (
            <div key={event.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center min-w-[60px] border-r border-gray-100 pr-3">
                  <span className="text-sm font-bold text-gray-800">{event.startTime}</span>
                  {event.endTime && <span className="text-[10px] text-gray-400 font-medium">{event.endTime}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-800 truncate">{event.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${event.type === 'meeting' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-black text-white border-black'}`}>{event.type === 'meeting' ? 'ประชุม' : 'ลงพื้นที่'}</span>
                      {event.location && <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full"><MapPin size={10} /><span className="truncate max-w-[150px]">{event.location}</span></div>}
                  </div>
                </div>
              </div>
              {event.location && <button onClick={() => openMap(event.location!)} className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"><Navigation size={14} /> นำทาง</button>}
            </div>
          ))}
        </div>
      </section>

      <section>
         <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Briefcase size={18} className="text-orange-600" /> โครงการ (Projects)</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 custom-scrollbar">
          {projects.map(project => {
            const progress = calculateProgress(project.tasks);
            return (
              <div key={project.id} onClick={() => setShowProjectDetail(project.id)} className="min-w-[240px] bg-gradient-to-br from-gray-900 to-black p-4 rounded-2xl shadow-md text-white relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                 <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/20 rounded-full -mr-6 -mt-6"></div>
                 <h4 className="font-bold text-sm mb-1 truncate pr-4">{project.name}</h4>
                 <p className="text-[10px] text-gray-400 mb-3">ส่ง {project.deadline}</p>
                 <div className="flex items-center gap-2"><div className="flex-1 bg-gray-700 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div></div><span className="text-xs font-bold text-orange-400">{progress}%</span></div>
                 <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-400"><CheckSquare size={10} /><span>{project.tasks.filter(t => t.completed).length}/{project.tasks.length} กิจกรรม</span></div>
              </div>
            );
          })}
           <button onClick={() => { setAddType('project'); setShowAddModal(true); }} className="min-w-[100px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all"><Plus size={24} className="mb-1" /><span className="text-[10px] font-bold">เพิ่ม</span></button>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><CheckSquare size={18} className="text-black" /> สิ่งที่ต้องทำ</h3>
        </div>
        <div className="space-y-2">
          {todos.length === 0 ? <p className="text-center text-gray-400 text-sm py-4">ไม่มีงานค้าง เยี่ยมมาก!</p> : todos.map(todo => (
            <div key={todo.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <button onClick={() => { const newTodos = todos.map(t => t.id === todo.id ? {...t, completed: !t.completed} : t); setTodos(newTodos); }} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${todo.completed ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200'}`}><CheckSquare size={14} strokeWidth={3} /></button>
                <div className="flex-1 min-w-0">
                    <span className={`text-sm block truncate ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{todo.text}</span>
                    <div className="flex items-center gap-2 mt-1"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${todo.priority === 'ด่วนมาก' ? 'bg-red-50 text-red-600 border border-red-100' : todo.priority === 'ด่วน' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>{todo.priority}</span>{todo.deadline && <span className="text-[10px] text-red-500 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full"><Clock size={10} /> ส่ง {new Date(todo.deadline).toLocaleDateString('th-TH', {day:'numeric', month:'short'})}</span>}</div>
                </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const MemoView = () => (
    <div className="space-y-6 pb-20 p-4 animate-fade-in">
       <div className="sticky top-0 bg-gray-50 pt-2 pb-4 z-10">
         <div className="flex justify-between items-end mb-4">
            <div><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><StickyNote className="text-yellow-500" /> สมุดจด</h2><p className="text-gray-500 text-xs">บันทึกช่วยจำ & ไอเดีย</p></div>
            <button onClick={() => { setAddType('memo'); setShowAddModal(true); }} className="bg-yellow-500 text-white p-2 rounded-xl shadow-lg shadow-yellow-200 hover:scale-105 transition-transform"><Plus size={24} /></button>
         </div>
         <div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input type="text" placeholder="ค้นหาบันทึก..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500" /></div>
       </div>
       <div className="grid grid-cols-2 gap-3">
         {memos.length === 0 ? <div className="col-span-2 text-center py-10 text-gray-400 text-sm">ยังไม่มีบันทึก</div> : memos.map(memo => (
           <div key={memo.id} className={`${memo.color} p-4 rounded-2xl shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow relative group cursor-pointer`}>
              <div className="flex justify-between items-start mb-2"><span className="text-[10px] font-bold opacity-60 bg-black/5 px-2 py-0.5 rounded-full">{memo.tag}</span><button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded-full"><MoreVertical size={14} /></button></div>
              <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight">{memo.title}</h3>
              <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed line-clamp-4">{memo.content}</p>
              <div className="mt-3 pt-3 border-t border-black/5 text-[10px] text-gray-500 font-medium">{memo.date}</div>
           </div>
         ))}
         <button onClick={() => { setAddType('memo'); setShowAddModal(true); }} className="border-2 border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-yellow-400 hover:text-yellow-500 hover:bg-yellow-50 transition-all min-h-[150px]"><Plus size={32} className="mb-2" /><span className="text-xs font-bold">สร้างโน้ตใหม่</span></button>
       </div>
    </div>
  );

  const FinanceView = () => (
    <div className="space-y-6 pb-20 p-4 animate-fade-in">
        <div className="bg-black rounded-3xl p-6 text-white shadow-xl shadow-gray-300 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full -mr-6 -mt-6 blur-2xl"></div>
           <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Wallet size={20} className="text-orange-500"/> กระเป๋าตังค์</h2>
           <div className="text-4xl font-extrabold mb-6">฿{transactions.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0).toLocaleString()}</div>
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800"><div className="text-xs text-green-400 mb-1 flex items-center gap-1"><TrendingUp size={12}/> รายรับ</div><div className="font-bold">฿{transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div></div>
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800"><div className="text-xs text-red-400 mb-1 flex items-center gap-1"><TrendingDown size={12}/> รายจ่าย</div><div className="font-bold">฿{transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</div></div>
           </div>
        </div>
        <div className="space-y-3">
            {transactions.length === 0 ? <div className="text-center py-8 text-gray-400 text-sm">ยังไม่มีรายการ กดปุ่ม + เพื่อบันทึกรายรับ/รายจ่าย</div> : transactions.map(t => (
              <div key={t.id} className="flex justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-3 items-center">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}</div>
                   <div><p className="text-sm font-bold text-gray-800">{t.title}</p><p className="text-[10px] text-gray-400">{t.date}</p></div>
                </div>
                <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}</span>
              </div>
            ))}
        </div>
    </div>
  );

  const HealthView = () => {
    const bmi = parseFloat(calculateBMI() as string);
    const bmiStatus = getBMIStatus(bmi);
    return (
      <div className="space-y-6 pb-20 p-4 animate-fade-in relative">
        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Activity className="text-orange-500" /> สุขภาพ</h2><button onClick={() => setShowHealthReport(true)} className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors border border-orange-100"><BarChart2 size={14} /> ดูสรุปภาพรวม</button></div>
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center relative overflow-hidden mb-4">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-pink-500"></div>
          <div className="flex flex-col items-center gap-2 mb-4"><div className="p-3 bg-orange-50 rounded-full text-orange-500"><Smile size={24} /></div><h3 className="font-bold text-gray-800">วันนี้ใจเป็นไงบ้าง?</h3></div>
          <div className="flex justify-between gap-2 max-w-xs mx-auto mb-6">{[1, 2, 3, 4, 5].map((level) => (<button key={level} onClick={() => setMood(level)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${mood === level ? 'bg-orange-100 border-2 border-orange-400 -translate-y-1 scale-110' : 'bg-gray-50 grayscale hover:grayscale-0'}`}>{level === 1 ? '😫' : level === 2 ? '😕' : level === 3 ? '😐' : level === 4 ? '🙂' : '🤩'}</button>))}</div>
          <div className="relative"><textarea value={healthStory} onChange={(e) => setHealthStory(e.target.value)} placeholder="วันนี้เจออะไรมาบ้าง เล่าสู่กันฟังได้นะ..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none h-24 mb-3 transition-all"></textarea><button onClick={handleHealthSubmit} disabled={isAnalyzing} className={`w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all ${isAnalyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg hover:shadow-orange-500/30 active:scale-95'}`}>{isAnalyzing ? <><Sparkles className="animate-spin" size={18} /> กำลังรับฟัง...</> : <><Send size={18} /> ส่งให้พี่พร้อม</>}</button></div>
        </section>
        {aiResponse && (<div className="animate-slide-up mb-6"><div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div><div className="flex items-start gap-4 relative z-10"><div className="p-3 bg-white/20 backdrop-blur-sm rounded-full shrink-0 border border-white/20"><MessageCircle size={24} className="text-white" /></div><div><h4 className="font-bold text-lg mb-1 flex items-center gap-2">จากพี่พร้อม<Heart size={14} className="text-pink-400 fill-current" /></h4><p className="text-indigo-100 text-sm leading-relaxed opacity-95">"{aiResponse}"</p></div></div></div></div>)}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-3xl p-5 border border-blue-100 relative overflow-hidden"><div className="flex items-center gap-2 text-blue-700 font-bold mb-3"><Droplets size={16} /> ดื่มน้ำ</div><div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-blue-900">{waterIntake}</span><span className="text-xs font-medium text-blue-600">/ 8</span></div><div className="flex gap-2"><button onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))} className="w-8 h-8 rounded-lg bg-white text-blue-500 font-bold">-</button><button onClick={() => setWaterIntake(Math.min(8, waterIntake + 1))} className="flex-1 rounded-lg bg-blue-500 text-white font-bold">+</button></div></div>
          <div className="bg-stone-100 rounded-3xl p-5 border border-stone-200 relative overflow-hidden"><div className="flex items-center gap-2 text-stone-700 font-bold mb-3"><Moon size={16} /> การนอน</div><div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-stone-900">{sleepHours}</span><span className="text-xs font-medium text-stone-600">ชม.</span></div><div className="flex gap-2"><button onClick={() => setSleepHours(s => Math.max(0, s - 0.5))} className="w-8 h-8 rounded-lg bg-white text-stone-600 font-bold">-</button><button onClick={() => setSleepHours(s => s + 0.5)} className="flex-1 rounded-lg bg-stone-700 text-white font-bold">+</button></div></div>
          <div className="bg-orange-50 rounded-3xl p-5 border border-orange-100 relative overflow-hidden"><div className="flex items-center gap-2 text-orange-700 font-bold mb-3"><Footprints size={16} /> นับก้าว</div><div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-orange-900">{steps.toLocaleString()}</span><span className="text-xs font-medium text-orange-600">ก้าว</span></div><input type="range" min="0" max="20000" step="100" value={steps} onChange={(e) => setSteps(parseInt(e.target.value))} className="w-full accent-orange-500 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer" /><div className="text-[10px] text-orange-500 mt-2 text-right">เป้าหมาย: 10,000</div></div>
           <div className="bg-amber-100 rounded-3xl p-5 border border-amber-200 relative overflow-hidden"><div className="flex items-center gap-2 text-amber-800 font-bold mb-3"><Coffee size={16} /> กาแฟ/ชาเย็น</div><div className="flex items-baseline gap-1 mb-4"><span className="text-3xl font-extrabold text-amber-900">{coffeeIntake}</span><span className="text-xs font-medium text-amber-700">แก้ว</span></div><div className="flex gap-2"><button onClick={() => setCoffeeIntake(c => Math.max(0, c - 1))} className="w-8 h-8 rounded-lg bg-white text-amber-700 font-bold shadow-sm">-</button><button onClick={() => setCoffeeIntake(c => c + 1)} className="flex-1 rounded-lg bg-amber-700 text-white font-bold shadow-sm">+</button></div></div>
        </section>
        <section className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100"><div className="flex items-center gap-2 text-emerald-700 font-bold mb-4"><Scale size={18} /> ร่างกาย & BMI</div><div className="flex gap-6"><div className="flex-1 space-y-3"><div><label className="text-xs text-emerald-600 block mb-1">น้ำหนัก (กก.)</label><div className="flex items-center gap-2"><button onClick={() => setWeight(w => Math.max(0, w - 0.5))} className="w-6 h-6 rounded bg-white text-emerald-600 shadow-sm font-bold">-</button><span className="font-bold text-lg w-12 text-center text-emerald-900">{weight}</span><button onClick={() => setWeight(w => w + 0.5)} className="w-6 h-6 rounded bg-white text-emerald-600 shadow-sm font-bold">+</button></div></div><div><label className="text-xs text-emerald-600 block mb-1">ส่วนสูง (ซม.)</label><div className="flex items-center gap-2"><button onClick={() => setHeight(h => Math.max(0, h - 1))} className="w-6 h-6 rounded bg-white text-emerald-600 shadow-sm font-bold">-</button><span className="font-bold text-lg w-12 text-center text-emerald-900">{height}</span><button onClick={() => setHeight(h => h + 1)} className="w-6 h-6 rounded bg-white text-emerald-600 shadow-sm font-bold">+</button></div></div></div><div className="flex-1 bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm text-center border border-emerald-100"><div className="text-xs text-gray-400 mb-1">BMI</div><div className={`text-3xl font-extrabold ${bmiStatus.color}`}>{bmi}</div><div className={`text-xs font-bold ${bmiStatus.color} mt-1 px-2 py-0.5 rounded-full bg-opacity-10 bg-current`}>{bmiStatus.text}</div></div></div></section>
      </div>
    );
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-2 flex justify-between items-center z-50 h-[70px] shadow-[0_-5px_20px_rgba(0,0,0,0.03)] rounded-t-3xl">
      <button onClick={() => setActiveTab('work')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'work' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><Briefcase size={22} strokeWidth={activeTab === 'work' ? 2.5 : 2} /><span className="text-[9px] font-bold">งาน</span></button>
      <button onClick={() => setActiveTab('memo')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'memo' ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}><StickyNote size={22} strokeWidth={activeTab === 'memo' ? 2.5 : 2} /><span className="text-[9px] font-bold">สมุดจด</span></button>
      <div className="relative -top-6"><button className="bg-black text-white p-3.5 rounded-2xl shadow-xl shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all border-4 border-gray-50 ring-2 ring-orange-500/10" onClick={() => { setAddType('event'); setShowAddModal(true); }}><Plus size={24} strokeWidth={3} /></button></div>
      <button onClick={() => setActiveTab('finance')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'finance' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><Wallet size={22} strokeWidth={activeTab === 'finance' ? 2.5 : 2} /><span className="text-[9px] font-bold">การเงิน</span></button>
      <button onClick={() => setActiveTab('health')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${activeTab === 'health' ? 'text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}><Activity size={22} strokeWidth={activeTab === 'health' ? 2.5 : 2} /><span className="text-[9px] font-bold">สุขภาพ</span></button>
    </div>
  );

  if (!isLoggedIn) return <LoginScreen />;

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900 pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      <Header />
      <div className="h-full overflow-y-auto custom-scrollbar">
        {activeTab === 'work' && WorkView()}
        {activeTab === 'memo' && MemoView()}
        {activeTab === 'finance' && FinanceView()}
        {activeTab === 'health' && HealthView()}
      </div>
      <BottomNav />
      {showAddModal && AddModal()}
      {showProjectDetail && ProjectDetailModal()}
      {showHealthReport && HealthReportModal()}
      {showContacts && ContactModal()}
      {showWelcomeQuote && WelcomeQuoteModal()}
    </div>
  );
};

export default App;
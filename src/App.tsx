import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, User } from "firebase/auth";
import { getDatabase, onValue, ref, set, remove as dbRemove } from "firebase/database";
import {
  X, Plus, Loader2, Heart, Sparkles, Trash2, Briefcase, Book, Wallet,
  ChevronRight, ChevronLeft, BarChart3, Target, Clock, ListTodo, BrainCircuit,
  PieChart, TrendingUp, CreditCard, CheckCircle2, Zap, Calendar as CalendarIcon
} from "lucide-react";

/* =========================
   1) Firebase Config
   ========================= */
const firebaseConfig =
  typeof (globalThis as any).__firebase_config !== "undefined"
    ? JSON.parse((globalThis as any).__firebase_config)
    : {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "YOUR_DB_URL",
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_BUCKET",
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
        appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
      };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const rawAppId =
  typeof (globalThis as any).__app_id !== "undefined" ? (globalThis as any).__app_id : "p-prompt-planner";
const appId = String(rawAppId).replace(/[.#$[\]]/g, "_");

/* =========================
   2) Gemini (optional)
   ========================= */
// ✅ ใส่แทน
const callOpenAI = async (prompt) => {
  try {
    const response = await fetch('/.netlify/functions/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!response.ok) throw new Error('Function call failed');
    const result = await response.json();
    return result.message || "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  } catch (error) {
    console.error('OpenAI Error:', error);
    return "พี่พร้อมขออภัย ระบบขัดข้องจ๊ะ";
  }
};
/* =========================
   3) Utils
   ========================= */
const ymd = (d: Date) => d.toISOString().split("T")[0];

function buildGCalUrl(p: any) {
  const fmt = (d: string, t: string) => `${d.replaceAll("-", "")}T${t.replaceAll(":", "")}00`;
  const start = fmt(p.startDate, p.startTime);
  const end = fmt(p.endDate || p.startDate, p.endTime);
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", p.title);
  url.searchParams.set("dates", `${start}/${end}`);
  if (p.location) url.searchParams.set("location", p.location);
  return url.toString();
}

/* =========================
   4) Types
   ========================= */
type TabKey = "work" | "memo" | "finance" | "health";
type AddMode =
  | "นัดหมาย"
  | "งาน"
  | "โครงการ"
  | "โน้ต"
  | "รายได้"
  | "หนี้สิน"
  | "รายจ่ายรายปี"
  | "สุขภาพ";

type Appointment = {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endTime: string;
  endDate?: string;
  location?: string;
  createdAt: number;
};

type Todo = {
  id: string;
  title: string;
  priority: "สูง" | "กลาง" | "ต่ำ";
  deadline: string;
  createdAt: number;
};

type ProjectTask = { title: string; subtasks: string[] };
type Project = {
  id: string;
  name: string;
  goal: string;
  budget: number;
  quarters: string[];
  tasks?: ProjectTask[];
  createdAt: number;
};

type Income = {
  id: string;
  name: string;
  amount: number;
  type: "regular" | "special";
  createdAt: number;
};

type DebtItem = {
  id: string;
  name: string;
  amount: number;
  interest: number;
  monthlyPay: number;
  createdAt: number;
};

type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  month: string;
  createdAt: number;
};

type Note = {
  id: string;
  title: string;
  content: string;
  color: "orange" | "sky" | "emerald" | "violet";
  createdAt: number;
};

type HealthEntry = {
  id: string;
  date: string;
  moodLevel: number; // 1-5
  story: string;
  aiResponse?: string;
  createdAt: number;
};

/* =========================
   5) UI Helpers
   ========================= */
const IntegratedStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;700&display=swap');
    :root { --font-sarabun: 'Sarabun', sans-serif; }
    body { font-family: var(--font-sarabun); -webkit-font-smoothing: antialiased; background-color: #FDFCFB; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156,163,175,0.35); border-radius: 20px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn .35s ease-out forwards; }
  `}</style>
);

const Header = ({ user }: { user: User }) => {
  const displayName = user?.displayName || "เพื่อน";
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 shadow-sm">
      <div className="max-w-5xl mx-auto flex justify-between items-center px-4">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0 text-left">
            <h1 className="font-black text-slate-800 text-sm sm:text-base truncate leading-none mb-1">พี่พร้อม</h1>
            <p className="text-[10px] text-slate-400 font-bold italic truncate leading-none">
              สวัสดีจ๊ะคุณ {displayName}
            </p>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm shrink-0 bg-slate-50 text-slate-400 border-slate-200">
          เพื่อน
        </div>
      </div>
    </header>
  );
};

const BottomNav = ({
  tab,
  setTab,
  onAdd,
}: {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  onAdd: () => void;
}) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
    <div className="max-w-4xl mx-auto grid grid-cols-5 h-20 items-center px-2">
      <button
        onClick={() => setTab("work")}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === "work" ? "text-indigo-600 scale-110" : "text-slate-300"
        }`}
      >
        <Briefcase size={20} />
        <span className="text-[9px] font-black uppercase tracking-tighter">งาน</span>
      </button>

      <button
        onClick={() => setTab("memo")}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === "memo" ? "text-indigo-600 scale-110" : "text-slate-300"
        }`}
      >
        <Book size={20} />
        <span className="text-[9px] font-black uppercase tracking-tighter">โน้ต</span>
      </button>

      <div className="flex justify-center">
        <button
          onClick={onAdd}
          className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl -translate-y-4 active:scale-90 transition-all border-4 border-white"
        >
          <Plus size={28} />
        </button>
      </div>

      <button
        onClick={() => setTab("finance")}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === "finance" ? "text-emerald-600 scale-110" : "text-slate-300"
        }`}
      >
        <Wallet size={20} />
        <span className="text-[9px] font-black uppercase tracking-tighter">เงิน</span>
      </button>

      <button
        onClick={() => setTab("health")}
        className={`flex flex-col items-center gap-1 transition-all ${
          tab === "health" ? "text-rose-500 scale-110" : "text-slate-300"
        }`}
      >
        <Heart size={20} />
        <span className="text-[9px] font-black uppercase tracking-tighter">ดูแลใจ</span>
      </button>
    </div>
  </nav>
);

/* =========================
   6) Tabs
   ========================= */
const WorkTab = ({ user, onOpenModal }: { user: User; onOpenModal: (m: AddMode) => void }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cMonth, setCMonth] = useState<number>(new Date().getMonth());
  const [cYear, setCYear] = useState<number>(new Date().getFullYear());
  const [isAiDrafting, setIsAiDrafting] = useState<string | null>(null);

  useEffect(() => {
    const p = `artifacts/${appId}/users/${user.uid}`;
    const unsub1 = onValue(ref(db, `${p}/appointments`), (s) => {
      const v = s.val();
      setAppointments(v ? (Object.values(v) as Appointment[]) : []);
    });
    const unsub2 = onValue(ref(db, `${p}/todos`), (s) => {
      const v = s.val();
      setTodos(v ? (Object.values(v) as Todo[]) : []);
    });
    const unsub3 = onValue(ref(db, `${p}/projects`), (s) => {
      const v = s.val();
      setProjects(v ? (Object.values(v) as Project[]) : []);
    });
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user.uid]);

  // month nav แบบไม่หลุดปี
  const goPrevMonth = () => {
    setCMonth((m) => {
      if (m === 0) {
        setCYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };
  const goNextMonth = () => {
    setCMonth((m) => {
      if (m === 11) {
        setCYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();
  const firstDay = new Date(cYear, cMonth, 1).getDay();

  const todayStr = ymd(new Date());
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.startDate === todayStr),
    [appointments, todayStr]
  );

  const handleAiDraftProject = async (pId: string, pName: string) => {
        setIsAiDrafting(pId);
    const prompt =
      `ช่วยร่างกิจกรรม (Task) และกิจกรรมย่อย (Sub-task) สำหรับโครงการชื่อ "${pName}" ` +
      `ขอ 3-4 กิจกรรมหลัก แต่ละกิจกรรมมี 2 กิจกรรมย่อย ตอบเป็น JSON เท่านั้น: ` +
      `[{ "title": "กิจกรรม", "subtasks": ["ย่อย1","ย่อย2"] }]`;
    const res = await callOpenAI(prompt);
    if (res) {
      try {
        const cleaned = res.replace(/```json|```/g, "").trim();
        const tasks = JSON.parse(cleaned) as ProjectTask[];
        await set(ref(db, `artifacts/${appId}/users/${user.uid}/projects/${pId}/tasks`), tasks);
      } catch {
        alert("พี่พร้อมร่างไม่สำเร็จจ๊ะ ลองใหม่นะจ๊ะ");
      }
    }
    setIsAiDrafting(null);
  };

  return (
    <div className="space-y-10 text-left animate-fade-in pb-20">
      {/* 1) แผนวันนี้ */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div className="text-left">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2 leading-none">
              <BrainCircuit size={20} className="text-amber-400" /> แผนจัดการวันนี้
            </h2>
            <p className="text-[10px] opacity-60 font-light">พี่พร้อมสรุปนัดหมายสำคัญให้จ๊ะ</p>
          </div>
          <button
            onClick={() => onOpenModal("นัดหมาย")}
            className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-3">
          {todayAppointments.map((a) => (
            <div
              key={a.id}
              className="bg-white/10 p-4 rounded-2xl border border-white/10 flex items-center gap-3"
            >
              <Clock size={14} className="text-amber-300" />
              <span className="text-xs font-bold">
                {a.title} ({a.startTime} น.)
              </span>
            </div>
          ))}
          {todayAppointments.length === 0 && (
            <p className="text-[10px] text-white/40 italic">
              วันนี้ยังไม่มีนัดหมายจ๊ะ เริ่มต้นวันใหม่ด้วยรอยยิ้มนะจ๊ะ
            </p>
          )}
        </div>
      </div>

      {/* 2) ปฏิทิน */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <span className="font-black text-sm text-slate-700 flex items-center gap-2">
            <CalendarIcon size={16} className="text-indigo-400" />
            {new Intl.DateTimeFormat("th-TH", { month: "long", year: "numeric" }).format(
              new Date(cYear, cMonth)
            )}
          </span>
          <div className="flex gap-2">
            <button onClick={goPrevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goNextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-4 opacity-40 uppercase text-[9px] font-black">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array(firstDay)
            .fill(null)
            .map((_, i) => (
              <div key={`e-${i}`} />
            ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dStr = `${cYear}-${String(cMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const hasAppt = appointments.some((a) => a.startDate === dStr);
            const isToday =
              day === new Date().getDate() && cMonth === new Date().getMonth() && cYear === new Date().getFullYear();
            return (
              <div
                key={day}
                className={`h-10 flex flex-col items-center justify-center text-xs font-black rounded-2xl relative transition-all ${
                  isToday ? "bg-indigo-600 text-white shadow-lg" : "hover:bg-slate-50 text-slate-500"
                }`}
              >
                {day}
                {hasAppt && (
                  <div
                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full shadow-sm ${
                      isToday ? "bg-white" : "bg-rose-400"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
          <div className="flex justify-between items-center px-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">นัดหมายล่าสุด</p>
            <button
              onClick={() => onOpenModal("นัดหมาย")}
              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors active:scale-90"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-2">
            {appointments
              .slice()
              .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
              .slice(0, 3)
              .map((a) => (
                <div key={a.id} className="flex justify-between items-center px-2 py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-600 truncate">{a.title}</span>
                  <span className="text-[10px] text-slate-400 italic shrink-0">{a.startDate}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 3) งาน */}
      <section className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <ListTodo className="text-indigo-600" size={24} /> งานที่ต้องทำ
          </h2>
          <button
            onClick={() => onOpenModal("งาน")}
            className="p-2 bg-indigo-600 text-white rounded-xl active:scale-90 shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {todos.map((t) => (
            <div
              key={t.id}
              className="bg-slate-50 p-5 rounded-[1.8rem] flex items-center gap-4 group hover:bg-white hover:shadow-md transition-all"
            >
              <CheckCircle2 size={18} className="text-slate-200 group-hover:text-indigo-400 shrink-0 transition-colors" />
              <div className="flex-1 min-w-0 text-left">
                <h4 className="text-sm font-black text-slate-800 truncate">{t.title}</h4>
                <div className="flex gap-2 mt-1">
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                      t.priority === "สูง" ? "bg-rose-100 text-rose-600" : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {t.priority}
                  </span>
                  <span className="text-[8px] font-black px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full uppercase">
                    {t.deadline}
                  </span>
                </div>
              </div>
              <Trash2
                size={16}
                onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/todos/${t.id}`))}
                className="text-slate-200 hover:text-red-400 cursor-pointer transition-colors"
              />
            </div>
          ))}
          {todos.length === 0 && <p className="text-center py-4 text-[10px] text-slate-300 italic">ยังไม่มีรายการงานที่ต้องทำจ๊ะ</p>}
        </div>
      </section>

      {/* 4) โครงการ */}
      <section>
        <div className="flex justify-between items-center mb-8 px-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
            <Briefcase className="text-indigo-600" size={24} /> โครงการ
          </h2>
          <button
            onClick={() => onOpenModal("โครงการ")}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
          >
            เริ่มโครงการใหม่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group text-left relative overflow-hidden transition-all hover:border-indigo-100"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <BarChart3 size={24} />
                </div>

                <button
                  onClick={() => handleAiDraftProject(p.id, p.name)}
                  disabled={isAiDrafting === p.id}
                  className="flex items-center gap-2 text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isAiDrafting === p.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} fill="currentColor" />}
                  พี่พร้อมช่วยคิด
                </button>
              </div>

              <h4 className="text-base font-black text-slate-800 mb-1 leading-tight">{p.name}</h4>
              <p className="text-[10px] text-slate-400 italic mb-6 truncate">เป้าหมาย: {p.goal}</p>

              <div className="space-y-4 mb-6">
                {(p.tasks || []).map((t, idx) => (
                  <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-black text-slate-700 flex items-center gap-2">
                      <Target size={12} /> {t.title}
                    </p>
                    <ul className="mt-2 space-y-1 pl-6">
                      {(t.subtasks || []).map((s, si) => (
                        <li key={si} className="text-[10px] text-slate-400 font-medium list-disc">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                <div className="font-black text-indigo-700 text-sm">฿{Number(p.budget || 0).toLocaleString()}</div>
                <div className="flex gap-1 flex-wrap justify-end max-w-[140px]">
                  {Array.isArray(p.quarters) ? p.quarters.map((q) => (
                    <span key={q} className="text-[9px] font-black text-slate-300 px-1">
                      {q}
                    </span>
                  )) : null}
                </div>
              </div>

              <button
                onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/projects/${p.id}`))}
                className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 p-2 text-slate-200 hover:text-rose-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const FinanceTab = ({ user, onOpenModal }: { user: User; onOpenModal: (m: AddMode) => void }) => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [debtItems, setDebtItems] = useState<DebtItem[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const p = `artifacts/${appId}/users/${user.uid}`;
    const u1 = onValue(ref(db, `${p}/incomes`), (s) => setIncomes(s.val() ? (Object.values(s.val()) as Income[]) : []));
    const u2 = onValue(ref(db, `${p}/debt_items`), (s) => setDebtItems(s.val() ? (Object.values(s.val()) as DebtItem[]) : []));
    const u3 = onValue(ref(db, `${p}/fixed_expenses`), (s) => setFixedExpenses(s.val() ? (Object.values(s.val()) as FixedExpense[]) : []));
    return () => {
      u1(); u2(); u3();
    };
  }, [user.uid]);

  const totalReg = useMemo(() => incomes.filter((i) => i.type === "regular").reduce((s, i) => s + Number(i.amount || 0), 0), [incomes]);
  const totalSpec = useMemo(() => incomes.filter((i) => i.type === "special").reduce((s, i) => s + Number(i.amount || 0), 0), [incomes]);
  const totalDebtMonthly = useMemo(() => debtItems.reduce((s, i) => s + Number(i.monthlyPay || 0), 0), [debtItems]);

  const handleAiFinance = async () => {
        setIsProcessing(true);
    const prompt =
      `ในฐานะที่ปรึกษาการเงินชื่อ "พี่พร้อม" ช่วยวิเคราะห์กลยุทธ์การเงินจากข้อมูล: ` +
      `รายได้ประจำ ฿${totalReg}, รายได้พิเศษ ฿${totalSpec}, ภาระหนี้ผ่อนต่อเดือน ฿${totalDebtMonthly}. ` +
      `ให้คำแนะนำเชิงกลยุทธ์สั้นๆ 3 ข้อ แบบจริงจังแต่อบอุ่น เป็นภาษาไทย`;
    const res = await callOpenAI(prompt);
    if (res) setAiAdvice(res);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 text-left animate-fade-in pb-20 px-2">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-4 flex items-center gap-2">
            <PieChart size={14} /> สถานะเงินภาพรวม
          </p>
          <h2 className="text-3xl sm:text-4xl font-black mb-10 italic tracking-tighter">
            ฿{(totalReg + totalSpec).toLocaleString()}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 p-5 rounded-3xl border border-white/10 flex justify-between items-center">
              <div className="text-left">
                <p className="text-[9px] opacity-60 font-black uppercase mb-1">รายได้ประจำ/เดือน</p>
                <p className="text-xl font-black text-emerald-400">฿{totalReg.toLocaleString()}</p>
              </div>
              <button onClick={() => onOpenModal("รายได้")} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-90">
                <Plus size={16} />
              </button>
            </div>

            <div className="bg-white/10 p-5 rounded-3xl border border-white/10 flex justify-between items-center">
              <div className="text-left">
                <p className="text-[9px] opacity-60 font-black uppercase mb-1">รายได้พิเศษ (ก้อน)</p>
                <p className="text-xl font-black text-amber-400">฿{totalSpec.toLocaleString()}</p>
              </div>
              <button onClick={() => onOpenModal("รายได้")} className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all active:scale-90">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={handleAiFinance}
            disabled={isProcessing}
            className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3 active:scale-95 shadow-indigo-900/20"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
            ปรึกษาพี่พร้อม (AI Advanced)
          </button>

          <div className="mt-6 text-[10px] opacity-60 font-bold">
            ภาระหนี้ผ่อน/เดือน: <span className="text-rose-300">฿{totalDebtMonthly.toLocaleString()}</span>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl transition-all group-hover:scale-110" />
      </div>

      {aiAdvice && (
        <div className="bg-white border-2 border-indigo-100 rounded-[3rem] p-8 shadow-xl animate-fade-in border-l-8 border-l-indigo-600 text-left relative overflow-hidden mx-2">
          <div className="flex items-center gap-3 mb-6 text-indigo-600">
            <Zap size={20} fill="currentColor" />
            <p className="text-[11px] font-black uppercase tracking-widest italic">กลยุทธ์การเงินจากพี่พร้อมจ๊ะ</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-bold italic whitespace-pre-wrap">{aiAdvice}</p>
          <button onClick={() => setAiAdvice(null)} className="w-full text-[10px] text-slate-300 font-black mt-8 hover:text-indigo-600 uppercase tracking-widest text-center transition-colors">
            พับเก็บแผนงาน
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:border-emerald-100 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-500" /> รายได้
            </h3>
            <button onClick={() => onOpenModal("รายได้")} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 shadow-sm">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {incomes.map((i) => (
              <div key={i.id} className="flex justify-between items-center pb-4 border-b border-slate-50 group">
                <div className="text-left">
                  <p className="text-xs font-black text-slate-700 leading-none mb-1">{i.name}</p>
                  <p className="text-[9px] text-slate-300 uppercase leading-none">{i.type === "regular" ? "รายเดือน" : "เงินก้อน"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-emerald-600">฿{Number(i.amount || 0).toLocaleString()}</p>
                  <Trash2
                    size={12}
                    onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/incomes/${i.id}`))}
                    className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                  />
                </div>
              </div>
            ))}
            {incomes.length === 0 && <p className="text-[10px] text-slate-300 italic">ยังไม่มีรายได้จ๊ะ</p>}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:border-rose-100 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <CreditCard size={20} className="text-rose-500" /> หนี้สิน
            </h3>
            <button onClick={() => onOpenModal("หนี้สิน")} className="p-2 bg-rose-50 text-rose-600 rounded-xl active:scale-90 shadow-sm">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {debtItems.map((d) => (
              <div key={d.id} className="flex justify-between items-center pb-4 border-b border-slate-50 group">
                <div className="text-left">
                  <p className="text-xs font-black text-slate-700 mb-1 leading-none">{d.name}</p>
                  <p className="text-[9px] text-slate-300 uppercase leading-none">ดบ. {Number(d.interest || 0)}%</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-rose-600">ผ่อน ฿{Number(d.monthlyPay || 0).toLocaleString()}</p>
                  <Trash2
                    size={12}
                    onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/debt_items/${d.id}`))}
                    className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                  />
                </div>
              </div>
            ))}
            {debtItems.length === 0 && <p className="text-[10px] text-slate-300 italic">ยังไม่มีหนี้จ๊ะ</p>}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col hover:border-blue-100 transition-all">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Target size={20} className="text-blue-500" /> รายจ่ายรายปี
            </h3>
            <button onClick={() => onOpenModal("รายจ่ายรายปี")} className="p-2 bg-blue-50 text-blue-600 rounded-xl active:scale-90 shadow-sm">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {fixedExpenses.map((f) => (
              <div key={f.id} className="flex justify-between items-center pb-4 border-b border-slate-50 group">
                <div className="text-left">
                  <p className="text-xs font-black text-slate-700 mb-1 leading-none">{f.name}</p>
                  <p className="text-[9px] text-slate-300 uppercase leading-none">กำหนดจ่าย {f.month}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs font-black text-blue-600">฿{Number(f.amount || 0).toLocaleString()}</p>
                  <Trash2
                    size={12}
                    onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/fixed_expenses/${f.id}`))}
                    className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-all"
                  />
                </div>
              </div>
            ))}
            {fixedExpenses.length === 0 && <p className="text-[10px] text-slate-300 italic">ยังไม่มีรายการจ่ายรายปีจ๊ะ</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

const MemoTabContent = ({ user }: { user: User }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const colors = [
    { key: "orange", bg: "bg-orange-50", border: "border-orange-100", dot: "bg-orange-400" },
    { key: "sky", bg: "bg-sky-50", border: "border-sky-100", dot: "bg-sky-400" },
    { key: "emerald", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-400" },
    { key: "violet", bg: "bg-violet-50", border: "border-violet-100", dot: "bg-violet-400" },
  ] as const;

  useEffect(() => {
    const unsub = onValue(ref(db, `artifacts/${appId}/users/${user.uid}/notes`), (s) => {
      const v = s.val();
      const arr = v ? (Object.values(v) as Note[]) : [];
      setNotes(arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsub();
  }, [user.uid]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left animate-fade-in px-2">
      {notes.map((n) => {
        const c = (colors.find((x) => x.key === n.color) || colors[0]) as any;
        return (
          <div
            key={n.id}
            className={`${c.bg} ${c.border} border-2 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-2xl transition-all relative overflow-hidden min-h-[150px] flex flex-col`}
          >
            <div className="flex justify-between items-start mb-6 shrink-0 text-left">
              <div className={`w-3.5 h-3.5 rounded-full ${c.dot} shadow-sm`} />
              <Trash2
                size={16}
                onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/notes/${n.id}`))}
                className="text-slate-300 hover:text-rose-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
              />
            </div>
            <h3 className="font-black text-slate-800 text-sm mb-3 leading-tight">{n.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap italic opacity-80 line-clamp-6">
              {n.content}
            </p>
          </div>
        );
      })}
      {notes.length === 0 && (
        <div className="col-span-full py-20 text-center text-slate-300 italic border-2 border-dashed border-slate-100 rounded-[3rem]">
          ยังไม่มีโน้ตจ๊ะ...
        </div>
      )}
    </div>
  );
};

const HealthTab = ({ user, onOpenModal }: { user: User; onOpenModal: (m: AddMode) => void }) => {
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = `artifacts/${appId}/users/${user.uid}/health`;
    const unsub = onValue(ref(db, p), (s) => {
      const v = s.val();
      const data = v ? (Object.values(v) as HealthEntry[]) : [];
      setHealthEntries(data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    });
    return () => unsub();
  }, [user.uid]);

  useEffect(() => {
    const checkWeeklySummary = async () => {
        if (now.getDay() === 0 && now.getHours() >= 19 && healthEntries.length > 0) {
        const storageKey = `${appId}:sunday_sum:${user.uid}:${now.toLocaleDateString()}`;
        if (!localStorage.getItem(storageKey)) {
          const stories = healthEntries.slice(0, 7).map((e) => e.story).join(" | ");
          const prompt =
            `ผู้ใช้งานบันทึกเรื่องราวในใจสัปดาห์นี้ว่า: "${stories}". ` +
            `ในฐานะ "พี่พร้อม" ช่วยสรุปสุขภาพใจประจำสัปดาห์ (4-5 ประโยค) แบบอบอุ่น ไม่ตัดสิน เป็นภาษาไทย`;
          const res = await callOpenAI(prompt);
          if (res) {
            setWeeklySummary(res);
            localStorage.setItem(storageKey, "done");
          }
        }
      }
    };
    if (!loading) checkWeeklySummary();
  }, [loading, healthEntries, user.uid]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>;

  return (
    <div className="space-y-10 text-left animate-fade-in pb-20 px-2">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-xl font-black text-slate-800">เรื่องราวในใจคุณ</h2>
        <button
          onClick={() => onOpenModal("สุขภาพ")}
          className="p-3 bg-rose-500 text-white rounded-[1.5rem] shadow-lg shadow-rose-100 active:scale-90 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      {weeklySummary && (
        <div className="bg-rose-50 border-2 border-rose-100 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden mx-4 animate-fade-in">
          <div className="relative z-10 text-left">
            <div className="flex items-center gap-3 mb-6 text-rose-500">
              <Sparkles size={24} />
              <p className="text-xs font-black uppercase tracking-widest italic">สรุปหัวใจประจำสัปดาห์จากพี่พร้อมจ๊ะ</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed font-bold italic whitespace-pre-wrap">{weeklySummary}</p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-200/20 rounded-full blur-2xl" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
        {healthEntries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-rose-100 transition-all"
          >
            <div className="flex justify-between items-start text-left">
              <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl shadow-inner">
                {entry.moodLevel >= 5 ? "🤩" : entry.moodLevel === 4 ? "😊" : entry.moodLevel === 3 ? "🙂" : entry.moodLevel === 2 ? "🥱" : "😣"}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-black text-slate-300 mb-2">{entry.date}</p>
                <Trash2
                  size={14}
                  onClick={() => dbRemove(ref(db, `artifacts/${appId}/users/${user.uid}/health/${entry.id}`))}
                  className="text-slate-200 hover:text-rose-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-all ml-auto"
                />
              </div>
            </div>

            <p className="text-sm text-slate-700 font-bold leading-relaxed italic text-left">"{entry.story}"</p>

            {entry.aiResponse && (
              <div className="mt-auto p-5 bg-indigo-50/50 rounded-[2rem] border border-dashed border-indigo-100 text-left">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <Sparkles size={14} />
                  <p className="text-[10px] font-black uppercase tracking-widest italic leading-none">พี่พร้อมดูแลใจคุณจ๊ะ...</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">{entry.aiResponse}</p>
              </div>
            )}
          </div>
        ))}

        {healthEntries.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300 italic border-2 border-dashed border-slate-100 rounded-[3rem]">
            วันนี้ยังไม่มีบันทึกใจนะจ๊ะ กดปุ่ม + เพื่อเล่าให้พี่พร้อมฟังได้นะ
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================
   7) Main App
   ========================= */
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<TabKey>("work");
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("นัดหมาย");
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState(null);
  // ✅ AUTH: อยู่ที่ App ที่เดียว
  // ✅ แทนที่ด้วยโค้ดนี้
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth Error:', error);
        setAuthError(error.message);
        setLoading(false);
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

  const openModal = (mode: AddMode) => {
    setAddMode(mode);
    setAddOpen(true);
  };

  const handleCentralAdd = () => {
    const mapping: Record<TabKey, AddMode> = {
      work: "นัดหมาย",
      memo: "โน้ต",
      finance: "รายได้",
      health: "สุขภาพ",
    };
    openModal(mapping[tab]);
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);

    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as any;
    const id = Date.now().toString();

    const base = {
      ...data,
      id,
      createdAt: Date.now(),
      date: new Date().toLocaleDateString("th-TH"),
    };

    let coll = "";
    let finalData: any = { ...base };

    switch (addMode) {
      case "นัดหมาย":
        coll = "appointments";
        if (data.gcal === "true") window.open(buildGCalUrl(data), "_blank");
        break;

      case "งาน":
        coll = "todos";
        break;

      case "โครงการ":
        coll = "projects";
        finalData.quarters = fd.getAll("quarters");
        finalData.budget = Number(data.budget || 0);
        break;

      case "โน้ต":
        coll = "notes";
        break;

      case "รายได้":
        coll = "incomes";
        finalData.amount = Number(data.amount || 0);
        break;

      case "หนี้สิน":
        coll = "debt_items";
        finalData.amount = Number(data.amount || 0);
        finalData.interest = Number(data.interest || 0);
        finalData.monthlyPay = Number(data.monthlyPay || 0);
        break;

      case "รายจ่ายรายปี":
        coll = "fixed_expenses";
        finalData.amount = Number(data.amount || 0);
        break;

      case "สุขภาพ": {
        coll = "health";
        finalData.moodLevel = Number(data.moodLevel || 3);

        const prompt =
          `ผู้ใช้งานเล่าว่า: "${data.story}" และเลือกอารมณ์ระดับ ${finalData.moodLevel}/5. ` +
          `ในฐานะ "พี่พร้อม" ช่วยตอบสั้นๆ 3-4 ประโยค แบบเห็นใจ ไม่ตัดสิน เป็นภาษาไทย`;
        finalData.aiResponse =
          (await callOpenAI(prompt)) || "พี่พร้อมรับฟังเสมอจ๊ะ คุณเก่งมากแล้วจ๊ะ";
        break;
      }
    }

    try {
      await set(ref(db, `artifacts/${appId}/users/${user.uid}/${coll}/${id}`), finalData);
      setAddOpen(false);
      (e.target as HTMLFormElement).reset();
    } catch {
      alert("บันทึกไม่สำเร็จจ๊ะ ลองใหม่นะจ๊ะ");
    }

    setIsSaving(false);
  };
  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFCFB] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-rose-100 text-center">
          <IntegratedStyles />
          <h2 className="text-xl font-black text-slate-800 mb-4">⚠️ ระบบขัดข้องจ๊ะ</h2>
          <p className="text-sm text-slate-600 mb-6">{authError}</p>
          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 text-left mb-4">
            <p className="font-bold mb-2">💡 วิธีแก้ไข:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>เปิด Anonymous Authentication ใน Firebase Console</li>
              <li>ไปที่: console.firebase.google.com/project/p-prompt/authentication</li>
              <li>เปิด "Anonymous" provider</li>
              <li>Refresh หน้านี้ (F5)</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#FDFCFB]">
        <IntegratedStyles />
        <Loader2 className="animate-spin text-indigo-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-left pb-32">
      <IntegratedStyles />
      <Header user={user} />

      <main className="max-w-5xl mx-auto px-6 pt-8">
        <div className="mb-10 text-left animate-fade-in">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1 italic">
            P'Prompt Orchestrator
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 underline decoration-indigo-200 decoration-8">
            {tab === "work" ? "จัดการงานจ๊ะ" : tab === "memo" ? "สมุดโน้ตจ๊ะ" : tab === "finance" ? "วางแผนเงินจ๊ะ" : "ดูแลหัวใจจ๊ะ"}
          </h2>
        </div>

        {tab === "work" && <WorkTab user={user} onOpenModal={openModal} />}

        {tab === "memo" && (
          <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-xl font-black text-slate-800">โน้ตทั้งหมด</h2>
              <button
                onClick={() => openModal("โน้ต")}
                className="p-2.5 bg-indigo-600 text-white rounded-xl active:scale-90 shadow-lg shadow-indigo-100 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>
            <MemoTabContent user={user} />
          </div>
        )}

        {tab === "finance" && <FinanceTab user={user} onOpenModal={openModal} />}

        {tab === "health" && <HealthTab user={user} onOpenModal={openModal} />}
      </main>

      <BottomNav tab={tab} setTab={setTab} onAdd={handleCentralAdd} />

      {/* Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 relative shadow-2xl my-auto animate-fade-in max-h-[90vh] overflow-y-auto font-sans text-left custom-scrollbar">
            <button onClick={() => setAddOpen(false)} className="absolute top-10 right-10 text-slate-300 hover:text-indigo-600 p-2">
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-slate-800 mb-8 italic underline decoration-indigo-100 decoration-8">
              บันทึก{addMode}
            </h3>

            {/* Mode Switch */}
            <div className="flex flex-wrap gap-2 mb-8">
              {tab === "finance" ? (
                (["รายได้", "หนี้สิน", "รายจ่ายรายปี"] as AddMode[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setAddMode(m)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                      addMode === m ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))
              ) : tab === "work" ? (
                (["นัดหมาย", "งาน", "โครงการ"] as AddMode[]).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setAddMode(m)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${
                      addMode === m ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {m}
                  </button>
                ))
              ) : (
                <button type="button" disabled className="px-4 py-1.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-lg">
                  {addMode}
                </button>
              )}
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-8">
              {/* นัดหมาย */}
              {addMode === "นัดหมาย" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">หัวข้อนัดจ๊ะ</label>
                    <input
                      name="title"
                      required
                      placeholder="นัดเรื่องอะไรจ๊ะ..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4">วันที่เริ่ม</label>
                      <input name="startDate" type="date" required className="bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold w-full outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4">เวลาเริ่ม</label>
                      <input name="startTime" type="time" required className="bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold w-full outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4">เวลาสิ้นสุด</label>
                      <input name="endTime" type="time" required className="bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold w-full outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">สถานที่</label>
                      <input name="location" placeholder="ที่ไหนจ๊ะ..." className="bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold w-full outline-none" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-xs font-bold text-slate-600 select-none px-2 cursor-pointer">
                    <input type="checkbox" name="gcal" value="true" className="w-4 h-4 rounded-lg accent-indigo-600" /> ส่งเข้า Google Calendar นะจ๊ะ
                  </label>
                </>
              )}

              {/* งาน */}
              {addMode === "งาน" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4">หัวข้องานจ๊ะ</label>
                    <input
                      name="title"
                      required
                      placeholder="ต้องทำอะไรจ๊ะ..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">ความสำคัญ</label>
                      <select name="priority" defaultValue="กลาง" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold shadow-inner outline-none">
                        <option value="สูง">ด่วนมาก (High)</option>
                        <option value="กลาง">ปกติ (Medium)</option>
                        <option value="ต่ำ">รอได้ (Low)</option>
                      </select>
                    </div>

                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">เดดไลน์</label>
                      <input name="deadline" type="date" required className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-xs font-bold shadow-inner outline-none" />
                    </div>
                  </div>
                </>
              )}

              {/* โครงการ */}
              {addMode === "โครงการ" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4">ชื่อโครงการจ๊ะ</label>
                    <input
                      name="name"
                      required
                      placeholder="ชื่อโครงการ..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4">งบประมาณ (บาท)</label>
                      <input name="budget" type="number" required placeholder="0" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4">เป้าหมาย</label>
                      <input name="goal" required placeholder="ทำเพื่ออะไรจ๊ะ..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2 px-2 text-left">
                    <label className="text-[10px] font-black text-slate-400">ไตรมาสดำเนินการ (เลือกได้มากกว่า 1)</label>
                    <div className="flex gap-4">
                      {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                        <label key={q} className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer">
                          <input type="checkbox" name="quarters" value={q} className="accent-indigo-600" /> {q}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* รายได้ */}
              {addMode === "รายได้" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4">ชื่อรายการรายได้</label>
                    <input name="name" required placeholder="เงินเดือน / ปันผล..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">จำนวนเงิน (บาท)</label>
                      <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none" />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">ประเภทรายได้</label>
                      <select name="type" defaultValue="regular" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold shadow-inner outline-none">
                        <option value="regular">รายได้ประจำ</option>
                        <option value="special">รายได้พิเศษ (ก้อน)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* หนี้สิน */}
              {addMode === "หนี้สิน" && (
                <>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 ml-4">ชื่อหนี้สิน</label>
                    <input name="name" required placeholder="บัตรเครดิต / ผ่อนรถ..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4">ดอกเบี้ย (%)</label>
                      <input name="interest" type="number" step="0.1" required className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">ผ่อน/เดือน</label>
                      <input name="monthlyPay" type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-4 py-4 text-sm font-bold shadow-inner outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 ml-4">ยอดคงเหลือรวม</label>
                    <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none" />
                  </div>
                </>
              )}

              {/* รายจ่ายรายปี */}
              {addMode === "รายจ่ายรายปี" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4">ชื่อรายการจ่ายรายปี</label>
                    <input name="name" required placeholder="ค่าประกัน / ภาษี..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4">ยอดรวมปีนี้</label>
                      <input name="amount" type="number" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black shadow-inner outline-none" />
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black text-slate-400 ml-4 text-left">เดือนที่จ่าย</label>
                      <select name="month" defaultValue="มกราคม" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold shadow-inner outline-none">
                        {["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* โน้ต */}
              {addMode === "โน้ต" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 ml-4">หัวข้อโน้ตจ๊ะ</label>
                    <input name="title" required placeholder="โน้ตสั้นๆ..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold shadow-inner outline-none" />
                  </div>

                  <textarea
                    name="content"
                    rows={5}
                    placeholder="จดสิ่งที่อยากจำจ๊ะ..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium shadow-inner outline-none h-32"
                  />

                  <div className="flex gap-4 justify-center">
                    {(["orange", "sky", "emerald", "violet"] as const).map((c) => (
                      <label key={c} className="cursor-pointer">
                        <input type="radio" name="color" value={c} defaultChecked={c === "orange"} className="hidden peer" />
                        <div
                          className={`w-11 h-11 rounded-full shadow-lg transition-all peer-checked:ring-4 peer-checked:ring-indigo-100 ${
                            c === "orange"
                              ? "bg-orange-400"
                              : c === "sky"
                              ? "bg-sky-400"
                              : c === "emerald"
                              ? "bg-emerald-400"
                              : "bg-violet-400"
                          }`}
                        />
                      </label>
                    ))}
                  </div>
                </>
              )}

              {/* สุขภาพ */}
              {addMode === "สุขภาพ" && (
                <div className="space-y-8">
                  <div className="flex justify-between px-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <label key={v} className="cursor-pointer text-center">
                        <input type="radio" name="moodLevel" value={v} defaultChecked={v === 3} className="hidden peer" />
                        <span className="text-3xl grayscale peer-checked:grayscale-0 peer-checked:scale-125 transition-all block">
                          {v === 5 ? "🤩" : v === 4 ? "😊" : v === 3 ? "🙂" : v === 2 ? "🥱" : "😣"}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-2 text-right">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
                      เล่าเรื่องวันนี้ให้พี่พร้อมฟังนะจ๊ะ (500 ตัวอักษร)
                    </label>
                    <textarea
                      name="story"
                      required
                      maxLength={500}
                      rows={6}
                      placeholder="เล่าเรื่องในใจให้พี่พร้อมฟังได้เสมอนะครับ..."
                      className="w-full bg-slate-50 border-none rounded-[2rem] px-8 py-6 text-sm font-medium shadow-inner outline-none focus:ring-2 focus:ring-rose-100 leading-relaxed transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-black active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : "ยืนยันการบันทึกจ๊ะ"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

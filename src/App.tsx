import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  FolderKanban,
  StickyNote,
  Wallet,
  HeartPulse,
  Plus,
  X,
  CheckCircle2,
  Trash2,
  Bell,
  MapPin,
} from "lucide-react";

/**
 * P-PROMPT ("พี่พร้อม")
 * - Single-file App.tsx (works on Vite/Netlify)
 * - LocalStorage persistence
 * - Quote popup on every app open
 * - Greeting (3 questions) on first open of the day
 * - Calendar: can generate Google Calendar event template link (with location)
 */

type TabId = "work" | "memo" | "finance" | "health";

type Appointment = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  note: string;
  createdAt: number;
};

type Task = {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  priority: "ต่ำ" | "กลาง" | "สูง";
  done: boolean;
  createdAt: number;
};

type Project = {
  id: string;
  name: string;
  budget: number;
  quarters: ("Q1" | "Q2" | "Q3" | "Q4")[];
  target: string;
  tasks: { id: string; title: string; done: boolean }[];
  createdAt: number;
};

type NoteItem = {
  id: string;
  title: string;
  content: string;
  color: string; // tailwind bg class
  createdAt: number;
};

type FinanceItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: "รายรับ" | "รายจ่าย";
  amount: number;
  category: string;
  necessity: "จำเป็น" | "ฟุ่มเฟือย";
  note: string;
  createdAt: number;
};

type HealthEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  waterGlasses: number;
  teaCoffeeGlasses: number;
  sleepHours: number;
  moodLevel: 1 | 2 | 3 | 4 | 5; // 1 sad -> 5 happy
  detail: string;
  createdAt: number;
};

const APP_ID = "p-prompt-surat";

// ----------------- helpers -----------------
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toGCalDateTime(dateYMD: string, timeHM: string) {
  // Google Calendar template wants: YYYYMMDDTHHMMSSZ OR local without Z
  // We'll send local time without timezone Z to keep it simple.
  const [y, m, d] = dateYMD.split("-");
  const [hh, mm] = timeHM.split(":");
  return `${y}${m}${d}T${hh}${mm}00`;
}

function buildGCalTemplateUrl(args: {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  details?: string;
  location?: string;
}) {
  const dates = `${toGCalDateTime(args.date, args.startTime)}/${toGCalDateTime(
    args.date,
    args.endTime
  )}`;
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", args.title || "นัดหมาย");
  url.searchParams.set("dates", dates);
  if (args.details) url.searchParams.set("details", args.details);
  if (args.location) url.searchParams.set("location", args.location);
  return url.toString();
}

function clampNumber(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ----------------- UI atoms -----------------
function Modal(props: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { open, title, onClose, children, wide } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3">
        <div
          className={[
            "w-full rounded-3xl bg-white shadow-xl",
            wide ? "max-w-3xl" : "max-w-xl",
          ].join(" ")}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="font-semibold text-gray-900">{title ?? ""}</div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Pill(props: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={props.onClick}
      className={[
        "px-4 py-2 rounded-full text-sm transition border",
        props.active
          ? "bg-orange-500 text-white border-orange-500"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900",
        "placeholder:text-gray-300 placeholder:font-light",
        "focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900",
        "placeholder:text-gray-300 placeholder:font-light",
        "focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function SectionTitle(props: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mt-3 mb-3">
      <div className="flex items-center gap-2 text-gray-900">
        <div className="text-orange-500">{props.icon}</div>
        <div className="font-semibold">{props.title}</div>
      </div>
      {props.right}
    </div>
  );
}

function StatCard(props: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{props.label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{props.value}</div>
      {props.sub ? <div className="mt-1 text-xs text-gray-500">{props.sub}</div> : null}
    </div>
  );
}

function ProgressBar(props: { value: number }) {
  const v = clampNumber(props.value, 0, 100);
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full bg-orange-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function SmileyScale(props: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const faces = ["😡", "😟", "😐", "🙂", "😄"] as const;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between text-xl">
        {faces.map((f, idx) => {
          const level = (idx + 1) as 1 | 2 | 3 | 4 | 5;
          const active = props.value === level;
          return (
            <button
              key={level}
              onClick={() => props.onChange(level)}
              className={[
                "w-12 h-12 rounded-full grid place-items-center transition",
                active ? "bg-orange-50 ring-2 ring-orange-300" : "hover:bg-gray-50",
              ].join(" ")}
              aria-label={`mood-${level}`}
              type="button"
            >
              <span className={active ? "" : "opacity-60"}>{f}</span>
            </button>
          );
        })}
      </div>

      {/* gradient bar + slider */}
      <div className="mt-4">
        <div
          className="h-2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #ef4444 0%, #f97316 25%, #facc15 50%, #84cc16 75%, #22c55e 100%)",
          }}
        />
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={props.value}
          onChange={(e) => props.onChange(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
          className="mt-3 w-full"
        />
        <div className="mt-1 text-xs text-gray-500">
          ระดับอารมณ์วันนี้: <span className="font-semibold text-gray-900">{props.value}/5</span>
        </div>
      </div>
    </div>
  );
}

// ----------------- main -----------------
export default function App() {
  // quotes (เดิม ๆ แนวขำๆ ให้กำลังใจ)
  const quotes = useMemo(
    () => [
      "ไม่ได้ขี้เกียจ… แค่อยู่ในโหมดประหยัดพลังงาน 😌",
      "วันนี้ยังไม่ปังไม่เป็นไร ขอแค่ไม่พังพอ 🧯",
      "ถ้าเหนื่อยก็พัก… พักเสร็จค่อยไปต่อ (อย่าพักยาวเป็นซีซันนะ) 😅",
      "หัวใจไม่ว่าง เพราะกำลังโหลดไฟล์กำลังใจอยู่ 💾",
      "ชีวิตไม่ต้องเพอร์เฟ็กต์ แค่ค่อยๆดีขึ้นก็ชนะแล้ว ✨",
      "อย่าดุตัวเองเก่งกว่างานที่ทำได้ 🫶",
      "พี่พร้อมอยู่ตรงนี้… แต่ขอให้เราเริ่มทีละนิดก็พอ 🙂",
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<TabId>("work");

  // quote popup
  const [quoteOpen, setQuoteOpen] = useState(true);
  const quoteText = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], [quotes]);

  // greeting (3 questions) once/day
  const [greetOpen, setGreetOpen] = useState(false);
  const [greetA, setGreetA] = useState("");
  const [greetB, setGreetB] = useState("");
  const [greetC, setGreetC] = useState("");

  // data
  const [appointments, setAppointments] = useState<Appointment[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:appointments`), [])
  );
  const [tasks, setTasks] = useState<Task[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:tasks`), [])
  );
  const [projects, setProjects] = useState<Project[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:projects`), [])
  );
  const [notes, setNotes] = useState<NoteItem[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:notes`), [])
  );
  const [finance, setFinance] = useState<FinanceItem[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:finance`), [])
  );
  const [health, setHealth] = useState<HealthEntry[]>(
    () => safeJsonParse(localStorage.getItem(`${APP_ID}:health`), [])
  );

  // add modal
  const [addOpen, setAddOpen] = useState(false);
  type AddMode = "นัด" | "งาน" | "โครงการ" | "โน้ต" | "บัญชี" | "สุขภาพ";
  const [addMode, setAddMode] = useState<AddMode>("นัด");

  // appointment form
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState(todayYMD());
  const [apptStart, setApptStart] = useState("09:00");
  const [apptEnd, setApptEnd] = useState("10:00");
  const [apptLocation, setApptLocation] = useState("");
  const [apptNote, setApptNote] = useState("");
  const [apptAddToGCal, setApptAddToGCal] = useState(true);

  // task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(todayYMD());
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("กลาง");

  // project form
  const [projName, setProjName] = useState("");
  const [projBudget, setProjBudget] = useState<number>(0);
  const [projTarget, setProjTarget] = useState("");
  const [projQuarters, setProjQuarters] = useState<Project["quarters"]>(["Q1"]);
  const [projTaskDraft, setProjTaskDraft] = useState("");
  const [projTasksDraft, setProjTasksDraft] = useState<Project["tasks"]>([]);

  // note form
  const pastelColors = useMemo(
    () => [
      { name: "Peach", cls: "bg-orange-100" },
      { name: "Lavender", cls: "bg-violet-100" },
      { name: "Mint", cls: "bg-emerald-100" },
      { name: "Sky", cls: "bg-sky-100" },
      { name: "Butter", cls: "bg-yellow-100" },
    ],
    []
  );
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState(pastelColors[0].cls);

  // finance form
  const [finDate, setFinDate] = useState(todayYMD());
  const [finTitle, setFinTitle] = useState("");
  const [finType, setFinType] = useState<FinanceItem["type"]>("รายจ่าย");
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finCategory, setFinCategory] = useState("");
  const [finNecessity, setFinNecessity] = useState<FinanceItem["necessity"]>("จำเป็น");
  const [finNote, setFinNote] = useState("");

  // health form
  const [hDate, setHDate] = useState(todayYMD());
  const [hSteps, setHSteps] = useState<number>(0);
  const [hWater, setHWater] = useState<number>(0);
  const [hTea, setHTea] = useState<number>(0);
  const [hSleep, setHSleep] = useState<number>(0);
  const [hMood, setHMood] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [hDetail, setHDetail] = useState("");

  // persist
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:appointments`, JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:tasks`, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:projects`, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:notes`, JSON.stringify(notes));
  }, [notes]);
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:finance`, JSON.stringify(finance));
  }, [finance]);
  useEffect(() => {
    localStorage.setItem(`${APP_ID}:health`, JSON.stringify(health));
  }, [health]);

  // greeting once/day
  useEffect(() => {
    const k = `${APP_ID}:greet_seen:${todayYMD()}`;
    if (!localStorage.getItem(k)) {
      setGreetOpen(true);
      localStorage.setItem(k, "1");
    }
  }, []);

  // helpers
  const todaysAppointments = useMemo(() => {
    const t = todayYMD();
    return appointments
      .filter((a) => a.date === t)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments]);

  const openAdd = (mode?: AddMode) => {
    if (mode) setAddMode(mode);
    setAddOpen(true);
  };

  const resetForms = () => {
    setApptTitle("");
    setApptDate(todayYMD());
    setApptStart("09:00");
    setApptEnd("10:00");
    setApptLocation("");
    setApptNote("");
    setApptAddToGCal(true);

    setTaskTitle("");
    setTaskDue(todayYMD());
    setTaskPriority("กลาง");

    setProjName("");
    setProjBudget(0);
    setProjTarget("");
    setProjQuarters(["Q1"]);
    setProjTaskDraft("");
    setProjTasksDraft([]);

    setNoteTitle("");
    setNoteContent("");
    setNoteColor(pastelColors[0].cls);

    setFinDate(todayYMD());
    setFinTitle("");
    setFinType("รายจ่าย");
    setFinAmount(0);
    setFinCategory("");
    setFinNecessity("จำเป็น");
    setFinNote("");

    setHDate(todayYMD());
    setHSteps(0);
    setHWater(0);
    setHTea(0);
    setHSleep(0);
    setHMood(4);
    setHDetail("");
  };

  const handleSave = () => {
    if (addMode === "นัด") {
      if (!apptTitle.trim()) return alert("กรุณากรอกหัวข้อ/รายการนัด");
      if (!apptDate) return alert("กรุณาเลือกวันที่");
      const item: Appointment = {
        id: uid("appt"),
        title: apptTitle.trim(),
        date: apptDate,
        startTime: apptStart || "09:00",
        endTime: apptEnd || "10:00",
        location: apptLocation.trim(),
        note: apptNote.trim(),
        createdAt: Date.now(),
      };
      setAppointments((prev) => [item, ...prev]);

      // optional: add to google calendar template
      if (apptAddToGCal) {
        const url = buildGCalTemplateUrl({
          title: item.title,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          details: item.note || "สร้างจากพี่พร้อม",
          location: item.location,
        });
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setAddOpen(false);
      resetForms();
      return;
    }

    if (addMode === "งาน") {
      if (!taskTitle.trim()) return alert("กรุณากรอกชื่องาน");
      const item: Task = {
        id: uid("task"),
        title: taskTitle.trim(),
        dueDate: taskDue || todayYMD(),
        priority: taskPriority,
        done: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [item, ...prev]);
      setAddOpen(false);
      resetForms();
      return;
    }

    if (addMode === "โครงการ") {
      if (!projName.trim()) return alert("กรุณากรอกชื่อโครงการ");
      const item: Project = {
        id: uid("proj"),
        name: projName.trim(),
        budget: Number.isFinite(projBudget) ? projBudget : 0,
        quarters: projQuarters.length ? projQuarters : ["Q1"],
        target: projTarget.trim(),
        tasks: projTasksDraft,
        createdAt: Date.now(),
      };
      setProjects((prev) => [item, ...prev]);
      setAddOpen(false);
      resetForms();
      return;
    }

    if (addMode === "โน้ต") {
      if (!noteTitle.trim() && !noteContent.trim()) return alert("กรุณากรอกโน้ตอย่างน้อย 1 อย่าง");
      const item: NoteItem = {
        id: uid("note"),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        color: noteColor,
        createdAt: Date.now(),
      };
      setNotes((prev) => [item, ...prev]);
      setAddOpen(false);
      resetForms();
      return;
    }

    if (addMode === "บัญชี") {
      if (!finTitle.trim()) return alert("กรุณากรอกรายการ");
      if (!Number.isFinite(finAmount)) return alert("จำนวนเงินไม่ถูกต้อง");
      const item: FinanceItem = {
        id: uid("fin"),
        date: finDate || todayYMD(),
        title: finTitle.trim(),
        type: finType,
        amount: Math.abs(finAmount || 0),
        category: finCategory.trim(),
        necessity: finNecessity,
        note: finNote.trim(),
        createdAt: Date.now(),
      };
      setFinance((prev) => [item, ...prev]);
      setAddOpen(false);
      resetForms();
      return;
    }

    if (addMode === "สุขภาพ") {
      const item: HealthEntry = {
        id: uid("health"),
        date: hDate || todayYMD(),
        steps: Math.max(0, Math.floor(hSteps || 0)),
        waterGlasses: Math.max(0, Math.floor(hWater || 0)),
        teaCoffeeGlasses: Math.max(0, Math.floor(hTea || 0)),
        sleepHours: Math.max(0, Number(hSleep || 0)),
        moodLevel: hMood,
        detail: hDetail.trim(),
        createdAt: Date.now(),
      };
      setHealth((prev) => [item, ...prev]);
      setAddOpen(false);
      resetForms();
      return;
    }
  };

  // derived
  const monthSummary = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const list = finance.filter((x) => x.date.startsWith(ym));
    const income = list.filter((x) => x.type === "รายรับ").reduce((s, x) => s + x.amount, 0);
    const expense = list.filter((x) => x.type === "รายจ่าย").reduce((s, x) => s + x.amount, 0);
    return { ym, income, expense, net: income - expense };
  }, [finance]);

  const weekHealthSummary = useMemo(() => {
    // last 7 days
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    const inRange = (d: string) => {
      const dt = new Date(d + "T00:00:00");
      return dt >= new Date(start.toDateString()) && dt <= new Date(end.toDateString());
    };

    const list = health.filter((h) => inRange(h.date));
    if (!list.length) return null;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
    const avgSteps = Math.round(avg(list.map((x) => x.steps)));
    const avgWater = Math.round(avg(list.map((x) => x.waterGlasses)));
    const avgSleep = Math.round(avg(list.map((x) => x.sleepHours)) * 10) / 10;
    const avgMood = Math.round(avg(list.map((x) => x.moodLevel)) * 10) / 10;

    return { count: list.length, avgSteps, avgWater, avgSleep, avgMood };
  }, [health]);

  // actions
  const toggleTaskDone = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const removeAppt = (id: string) => setAppointments((prev) => prev.filter((x) => x.id !== id));

  const removeNote = (id: string) => setNotes((prev) => prev.filter((x) => x.id !== id));

  const removeFin = (id: string) => setFinance((prev) => prev.filter((x) => x.id !== id));

  const removeProj = (id: string) => setProjects((prev) => prev.filter((x) => x.id !== id));

  const toggleProjectTask = (projId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
        };
      })
    );
  };

  const projectProgress = (p: Project) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.done).length;
    if (!total) return 0;
    return Math.round((done / total) * 100);
  };

  // UI
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 grid place-items-center text-orange-600 font-bold">
              พ
            </div>
            <div>
              <div className="font-semibold text-gray-900 leading-tight">พี่พร้อม</div>
              <div className="text-xs text-gray-500">P•PROMPT SURAT</div>
            </div>
          </div>

          <button
            onClick={() => openAdd()}
            className="inline-flex items-center gap-2 rounded-2xl bg-black text-white px-4 py-2 hover:bg-black/90"
          >
            <Plus size={18} />
            <span className="text-sm">เพิ่ม</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-4 pb-24 pt-3">
        {activeTab === "work" ? (
          <div className="space-y-6">
            {/* Today appointments */}
            <SectionTitle
              icon={<CalendarDays size={18} />}
              title="นัดหมายวันนี้"
              right={
                <button
                  className="text-sm text-orange-600 hover:underline"
                  onClick={() => openAdd("นัด")}
                >
                  เพิ่มนัด
                </button>
              }
            />

            {todaysAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                วันนี้ยังไม่มีนัด 🗓️
              </div>
            ) : (
              <div className="space-y-3">
                {todaysAppointments.map((a) => (
                  <div key={a.id} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{a.title}</div>
                        <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="inline-flex items-center gap-1">
                            <Bell size={14} className="text-orange-500" />
                            {a.startTime}–{a.endTime}
                          </span>
                          {a.location ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={14} className="text-orange-500" />
                              {a.location}
                            </span>
                          ) : null}
                        </div>
                        {a.note ? <div className="mt-2 text-sm text-gray-600">{a.note}</div> : null}
                        <div className="mt-3">
                          <a
                            className="text-sm text-orange-600 hover:underline"
                            href={buildGCalTemplateUrl({
                              title: a.title,
                              date: a.date,
                              startTime: a.startTime,
                              endTime: a.endTime,
                              details: a.note || "สร้างจากพี่พร้อม",
                              location: a.location,
                            })}
                            target="_blank"
                            rel="noreferrer"
                          >
                            เพิ่ม/แก้ใน Google Calendar
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAppt(a.id)}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                        aria-label="delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            <SectionTitle
              icon={<FolderKanban size={18} />}
              title="โครงการ"
              right={
                <button
                  className="text-sm text-orange-600 hover:underline"
                  onClick={() => openAdd("โครงการ")}
                >
                  สร้างโครงการ
                </button>
              }
            />

            {projects.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                ยังไม่มีโครงการ ลองสร้างโครงการแรกดู ✨
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {projects.map((p) => {
                  const prog = projectProgress(p);
                  return (
                    <div key={p.id} className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs text-white/70">
                            {p.quarters.join(", ")} • งบ {p.budget.toLocaleString()} บาท
                          </div>
                          <div className="mt-1 font-semibold truncate">{p.name}</div>
                          {p.target ? <div className="mt-1 text-sm text-white/70">เป้าหมาย: {p.target}</div> : null}
                        </div>
                        <button
                          onClick={() => removeProj(p.id)}
                          className="p-2 rounded-xl hover:bg-white/10 text-white/80"
                          aria-label="delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-white/70 mb-2">PROGRESS {prog}%</div>
                        <div className="h-2 w-full rounded-full bg-white/15 overflow-hidden">
                          <div className="h-full bg-orange-400" style={{ width: `${prog}%` }} />
                        </div>
                      </div>

                      {/* project tasks */}
                      {p.tasks.length ? (
                        <div className="mt-4 space-y-2">
                          {p.tasks.slice(0, 4).map((t) => (
                            <button
                              key={t.id}
                              onClick={() => toggleProjectTask(p.id, t.id)}
                              className="w-full text-left flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2"
                            >
                              <CheckCircle2 size={16} className={t.done ? "text-orange-300" : "text-white/40"} />
                              <span className={t.done ? "line-through text-white/60" : "text-white/90"}>
                                {t.title}
                              </span>
                            </button>
                          ))}
                          {p.tasks.length > 4 ? (
                            <div className="text-xs text-white/60">+ อีก {p.tasks.length - 4} รายการ</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-4 text-sm text-white/60">ยังไม่มีรายการกิจกรรมของโครงการ</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tasks */}
            <SectionTitle
              icon={<ClipboardList size={18} />}
              title="งานทั่วไป"
              right={
                <button className="text-sm text-orange-600 hover:underline" onClick={() => openAdd("งาน")}>
                  เพิ่มงาน
                </button>
              }
            />
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                วันนี้มีเวลาให้หายใจ 😄 ยังไม่มีงานในลิสต์
              </div>
            ) : (
              <div className="space-y-3">
                {tasks
                  .slice()
                  .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
                  .map((t) => (
                    <div key={t.id} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <button className="flex items-center gap-3 min-w-0" onClick={() => toggleTaskDone(t.id)}>
                          <div
                            className={[
                              "w-6 h-6 rounded-full border grid place-items-center",
                              t.done ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-300",
                            ].join(" ")}
                          >
                            {t.done ? <CheckCircle2 size={16} /> : null}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className={["font-medium truncate", t.done ? "line-through text-gray-400" : "text-gray-900"].join(" ")}>
                              {t.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ครบกำหนด {t.dueDate} • Priority: {t.priority}
                            </div>
                          </div>
                        </button>
                        <button onClick={() => removeTask(t.id)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "memo" ? (
          <div className="space-y-6">
            <SectionTitle
              icon={<StickyNote size={18} />}
              title="โน้ต"
              right={
                <button className="text-sm text-orange-600 hover:underline" onClick={() => openAdd("โน้ต")}>
                  เพิ่มโน้ต
                </button>
              }
            />
            {notes.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                ยังไม่มีโน้ต ลองจดอะไรสั้นๆไว้ก่อน ✍️
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {notes.map((n) => (
                  <div key={n.id} className={["rounded-2xl border border-gray-100 p-4 shadow-sm", n.color].join(" ")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{n.title || "โน้ต"}</div>
                        <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{n.content}</div>
                      </div>
                      <button onClick={() => removeNote(n.id)} className="p-2 rounded-xl hover:bg-black/5 text-gray-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "finance" ? (
          <div className="space-y-6">
            <SectionTitle
              icon={<Wallet size={18} />}
              title="บัญชี"
              right={
                <button className="text-sm text-orange-600 hover:underline" onClick={() => openAdd("บัญชี")}>
                  เพิ่มรายการ
                </button>
              }
            />

            <div className="grid sm:grid-cols-4 gap-3">
              <StatCard label="รายรับเดือนนี้" value={monthSummary.income.toLocaleString()} sub={`เดือน ${monthSummary.ym}`} />
              <StatCard label="รายจ่ายเดือนนี้" value={monthSummary.expense.toLocaleString()} />
              <StatCard label="คงเหลือสุทธิ" value={monthSummary.net.toLocaleString()} />
              <StatCard label="รายการทั้งหมด" value={String(finance.length)} />
            </div>

            {finance.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                ยังไม่มีรายการบัญชี
              </div>
            ) : (
              <div className="space-y-3">
                {finance.slice(0, 30).map((f) => (
                  <div key={f.id} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">{f.date}</div>
                        <div className="font-semibold text-gray-900 truncate">{f.title}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {f.type === "รายรับ" ? "รับ" : "จ่าย"} {f.amount.toLocaleString()} • {f.category || "ไม่ระบุหมวด"} •{" "}
                          {f.type === "รายจ่าย" ? f.necessity : "—"}
                        </div>
                        {f.note ? <div className="mt-2 text-sm text-gray-600">{f.note}</div> : null}
                      </div>
                      <button onClick={() => removeFin(f.id)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "health" ? (
          <div className="space-y-6">
            <SectionTitle
              icon={<HeartPulse size={18} />}
              title="สุขภาพ"
              right={
                <button className="text-sm text-orange-600 hover:underline" onClick={() => openAdd("สุขภาพ")}>
                  บันทึกวันนี้
                </button>
              }
            />

            {weekHealthSummary ? (
              <div className="grid sm:grid-cols-4 gap-3">
                <StatCard label="เฉลี่ยก้าว/วัน" value={weekHealthSummary.avgSteps.toLocaleString()} sub={`จาก ${weekHealthSummary.count} วันล่าสุด`} />
                <StatCard label="เฉลี่ยน้ำ/วัน (แก้ว)" value={String(weekHealthSummary.avgWater)} />
                <StatCard label="เฉลี่ยนอน/วัน (ชม.)" value={String(weekHealthSummary.avgSleep)} />
                <StatCard label="เฉลี่ยอารมณ์" value={String(weekHealthSummary.avgMood)} sub="(1-5)" />
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                ยังไม่มีข้อมูลพอให้สรุปสัปดาห์ ลองบันทึกเพิ่มอีกนิด 🙂
              </div>
            )}

            {health.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-white p-5 text-gray-500 text-sm">
                ยังไม่มีบันทึกสุขภาพ
              </div>
            ) : (
              <div className="space-y-3">
                {health.slice(0, 14).map((h) => (
                  <div key={h.id} className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
                    <div className="text-xs text-gray-500">{h.date}</div>
                    <div className="mt-2 grid sm:grid-cols-5 gap-2 text-sm text-gray-700">
                      <div className="rounded-xl bg-gray-50 p-3">ก้าว: <b className="text-gray-900">{h.steps}</b></div>
                      <div className="rounded-xl bg-gray-50 p-3">น้ำ: <b className="text-gray-900">{h.waterGlasses}</b></div>
                      <div className="rounded-xl bg-gray-50 p-3">ชา/กาแฟ: <b className="text-gray-900">{h.teaCoffeeGlasses}</b></div>
                      <div className="rounded-xl bg-gray-50 p-3">นอน: <b className="text-gray-900">{h.sleepHours}</b></div>
                      <div className="rounded-xl bg-gray-50 p-3">อารมณ์: <b className="text-gray-900">{h.moodLevel}/5</b></div>
                    </div>
                    {h.detail ? <div className="mt-3 text-sm text-gray-600 whitespace-pre-wrap">{h.detail}</div> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 z-40">
        <div className="max-w-5xl mx-auto px-4 pb-4">
          <div className="rounded-3xl bg-white border shadow-lg px-3 py-2 flex items-center justify-between">
            <button
              onClick={() => setActiveTab("work")}
              className={[
                "flex-1 rounded-2xl py-2 px-2 flex flex-col items-center gap-1",
                activeTab === "work" ? "text-orange-600" : "text-gray-400",
              ].join(" ")}
            >
              <ClipboardList size={18} />
              <div className="text-[11px]">งาน</div>
            </button>

            <button
              onClick={() => setActiveTab("memo")}
              className={[
                "flex-1 rounded-2xl py-2 px-2 flex flex-col items-center gap-1",
                activeTab === "memo" ? "text-orange-600" : "text-gray-400",
              ].join(" ")}
            >
              <StickyNote size={18} />
              <div className="text-[11px]">โน้ต</div>
            </button>

            <button
              onClick={() => openAdd()}
              className="mx-2 w-14 h-14 rounded-2xl bg-black text-white grid place-items-center -mt-6 shadow-lg"
              aria-label="add"
            >
              <Plus size={20} />
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={[
                "flex-1 rounded-2xl py-2 px-2 flex flex-col items-center gap-1",
                activeTab === "finance" ? "text-orange-600" : "text-gray-400",
              ].join(" ")}
            >
              <Wallet size={18} />
              <div className="text-[11px]">บัญชี</div>
            </button>

            <button
              onClick={() => setActiveTab("health")}
              className={[
                "flex-1 rounded-2xl py-2 px-2 flex flex-col items-center gap-1",
                activeTab === "health" ? "text-orange-600" : "text-gray-400",
              ].join(" ")}
            >
              <HeartPulse size={18} />
              <div className="text-[11px]">สุขภาพ</div>
            </button>
          </div>
        </div>
      </div>

      {/* Quote popup */}
      <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-orange-50 mx-auto grid place-items-center text-2xl">
            😄
          </div>
          <div className="mt-4 text-lg font-semibold text-gray-900">"{quoteText}"</div>
          <button
            onClick={() => setQuoteOpen(false)}
            className="mt-6 w-full rounded-2xl bg-black text-white py-3 hover:bg-black/90"
          >
            ลุยงานกันเลยครับ!
          </button>
        </div>
      </Modal>

      {/* Greeting (3 questions) */}
      <Modal open={greetOpen} onClose={() => setGreetOpen(false)} title="ก่อนเริ่มวันนี้ พี่พร้อมขอถาม 3 ข้อ 🙂">
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-700 mb-2">1) วันนี้อยากให้พี่พร้อมช่วยเรื่องไหนที่สุด?</div>
            <Input value={greetA} onChange={(e) => setGreetA(e.target.value)} placeholder="เช่น งานด่วน/สุขภาพ/จัดเวลา/ฮีลใจ" />
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-2">2) สิ่งเดียวที่ทำได้แล้ว “ถือว่าชนะ” วันนี้คืออะไร?</div>
            <Input value={greetB} onChange={(e) => setGreetB(e.target.value)} placeholder="เช่น ทำงาน 1 อย่างให้จบ/เดิน 15 นาที/นอนให้พอ" />
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-2">3) ให้คะแนนพลังใจตอนนี้ (1–5)</div>
            <Input value={greetC} onChange={(e) => setGreetC(e.target.value)} placeholder="พิมพ์ 1-5 หรือคำสั้นๆ" />
          </div>
          <button
            onClick={() => setGreetOpen(false)}
            className="mt-2 w-full rounded-2xl bg-orange-500 text-white py-3 hover:bg-orange-600"
          >
            เริ่มวันนี้ไปด้วยกัน
          </button>
          <div className="text-xs text-gray-500">
            (คำตอบนี้เก็บไว้ในหน้านี้ก่อน ยังไม่ส่งออกไปไหน — เฟสถัดไปค่อยเชื่อม AI/Firestore)
          </div>
        </div>
      </Modal>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
        }}
        title="เพิ่มรายการใหม่"
        wide={addMode === "โครงการ"}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {(["นัด", "งาน", "โครงการ", "โน้ต", "บัญชี", "สุขภาพ"] as AddMode[]).map((m) => (
            <Pill key={m} active={addMode === m} onClick={() => setAddMode(m)}>
              {m}
            </Pill>
          ))}
        </div>

        {addMode === "นัด" ? (
          <div className="space-y-3">
            <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} placeholder="หัวข้อเรื่อง / รายการนัด" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">วันที่</div>
                <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">เริ่ม</div>
                <Input type="time" value={apptStart} onChange={(e) => setApptStart(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">สิ้นสุด</div>
                <Input type="time" value={apptEnd} onChange={(e) => setApptEnd(e.target.value)} />
              </div>
            </div>

            <Input
              value={apptLocation}
              onChange={(e) => setApptLocation(e.target.value)}
              placeholder="สถานที่ (เช่น ห้องประชุม/คาเฟ่/ออนไลน์)"
            />

            <Textarea
              rows={3}
              value={apptNote}
              onChange={(e) => setApptNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            />

            <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
              <input
                type="checkbox"
                checked={apptAddToGCal}
                onChange={(e) => setApptAddToGCal(e.target.checked)}
              />
              เพิ่มเข้า Google Calendar หลังบันทึก (แนะนำ: เพื่อให้แจ้งเตือนเข้าโทรศัพท์ได้)
            </label>
          </div>
        ) : null}

        {addMode === "งาน" ? (
          <div className="space-y-3">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="ชื่องาน" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">ครบกำหนด</div>
                <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Priority</div>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                >
                  <option value="ต่ำ">ต่ำ</option>
                  <option value="กลาง">กลาง</option>
                  <option value="สูง">สูง</option>
                </select>
              </div>
            </div>
            <Textarea rows={3} placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)" />
          </div>
        ) : null}

        {addMode === "โครงการ" ? (
          <div className="space-y-4">
            <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="ชื่อโครงการ" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">งบประมาณ (บาท)</div>
                <Input
                  type="number"
                  value={projBudget}
                  onChange={(e) => setProjBudget(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ไตรมาส (เลือกได้หลายอัน)</div>
                <div className="flex flex-wrap gap-2">
                  {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                    const active = projQuarters.includes(q);
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setProjQuarters((prev) => {
                            if (prev.includes(q)) {
                              const next = prev.filter((x) => x !== q);
                              return next.length ? next : ["Q1"];
                            }
                            return [...prev, q];
                          });
                        }}
                        className={[
                          "px-3 py-2 rounded-xl border text-sm",
                          active ? "bg-orange-50 border-orange-300 text-orange-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
                        ].join(" ")}
                      >
                        {q}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <Input value={projTarget} onChange={(e) => setProjTarget(e.target.value)} placeholder="เป้าหมายคือใคร / กลุ่มเป้าหมาย" />

            <div className="rounded-2xl border border-gray-100 bg-white p-4">
              <div className="font-semibold text-gray-900 mb-2">กิจกรรมที่ต้องทำ (Task ของโครงการ)</div>
              <div className="flex gap-2">
                <Input
                  value={projTaskDraft}
                  onChange={(e) => setProjTaskDraft(e.target.value)}
                  placeholder="พิมพ์รายการ แล้วกด +"
                />
                <button
                  type="button"
                  onClick={() => {
                    const t = projTaskDraft.trim();
                    if (!t) return;
                    setProjTasksDraft((prev) => [...prev, { id: uid("pt"), title: t, done: false }]);
                    setProjTaskDraft("");
                  }}
                  className="shrink-0 px-4 rounded-xl bg-black text-white hover:bg-black/90"
                >
                  <Plus size={18} />
                </button>
              </div>
              {projTasksDraft.length ? (
                <div className="mt-3 space-y-2">
                  {projTasksDraft.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2">
                      <div className="text-sm text-gray-800">{t.title}</div>
                      <button
                        type="button"
                        onClick={() => setProjTasksDraft((prev) => prev.filter((x) => x.id !== t.id))}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        aria-label="remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-gray-500">ยังไม่มีรายการกิจกรรม</div>
              )}
            </div>
          </div>
        ) : null}

        {addMode === "โน้ต" ? (
          <div className="space-y-3">
            <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="หัวข้อโน้ต (ไม่ใส่ก็ได้)" />
            <Textarea rows={5} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="พิมพ์สิ่งที่อยากจำไว้..." />

            <div>
              <div className="text-xs text-gray-500 mb-2">สีโน้ต</div>
              <div className="flex items-center gap-3">
                {pastelColors.map((c) => {
                  const active = noteColor === c.cls;
                  return (
                    <button
                      key={c.cls}
                      type="button"
                      onClick={() => setNoteColor(c.cls)}
                      className={[
                        "w-10 h-10 rounded-full border grid place-items-center",
                        c.cls,
                        active ? "ring-2 ring-orange-300 border-orange-300" : "border-white hover:ring-2 hover:ring-gray-200",
                      ].join(" ")}
                      aria-label={c.name}
                    >
                      {active ? <CheckCircle2 size={16} className="text-orange-600" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {addMode === "บัญชี" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">วันที่</div>
                <Input type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ประเภท</div>
                <select
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as FinanceItem["type"])}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                >
                  <option value="รายรับ">รายรับ</option>
                  <option value="รายจ่าย">รายจ่าย</option>
                </select>
              </div>
            </div>

            <Input value={finTitle} onChange={(e) => setFinTitle(e.target.value)} placeholder="รายการ" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">จำนวนเงิน</div>
                <Input type="number" value={finAmount} onChange={(e) => setFinAmount(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">หมวดหมู่</div>
                <Input value={finCategory} onChange={(e) => setFinCategory(e.target.value)} placeholder="เช่น อาหาร/เดินทาง/ช้อป" />
              </div>
            </div>

            {finType === "รายจ่าย" ? (
              <div>
                <div className="text-xs text-gray-500 mb-1">จำเป็น/ฟุ่มเฟือย</div>
                <div className="flex gap-2">
                  <Pill active={finNecessity === "จำเป็น"} onClick={() => setFinNecessity("จำเป็น")}>
                    จำเป็น
                  </Pill>
                  <Pill active={finNecessity === "ฟุ่มเฟือย"} onClick={() => setFinNecessity("ฟุ่มเฟือย")}>
                    ฟุ่มเฟือย
                  </Pill>
                </div>
              </div>
            ) : null}

            <Textarea rows={3} value={finNote} onChange={(e) => setFinNote(e.target.value)} placeholder="หมายเหตุ (ถ้ามี)" />
          </div>
        ) : null}

        {addMode === "สุขภาพ" ? (
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">วันที่</div>
              <Input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">จำนวนก้าว</div>
                <Input type="number" value={hSteps} onChange={(e) => setHSteps(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">น้ำ (แก้ว)</div>
                <Input type="number" value={hWater} onChange={(e) => setHWater(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ชา/กาแฟ (แก้ว)</div>
                <Input type="number" value={hTea} onChange={(e) => setHTea(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">นอน (ชม.)</div>
                <Input type="number" value={hSleep} onChange={(e) => setHSleep(Number(e.target.value))} placeholder="0" />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-900 mb-2">อารมณ์วันนี้</div>
              <SmileyScale value={hMood} onChange={setHMood} />
            </div>

            <Textarea rows={4} value={hDetail} onChange={(e) => setHDetail(e.target.value)} placeholder="วันนี้เกิดอะไรขึ้น / อยากเล่าอะไรให้พี่พร้อมฟัง" />
            <div className="text-xs text-gray-500">
              (เฟสถัดไป: ตรงนี้จะส่งเข้า AI เพื่อ “ตอบกลับกำลังใจ” + สรุปสุขภาพรายสัปดาห์แบบฉลาดขึ้น)
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => {
              setAddOpen(false);
              resetForms();
            }}
            className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 hover:bg-gray-50"
          >
            ยกเลิก
          </button>
          <button onClick={handleSave} className="flex-1 rounded-2xl bg-black text-white py-3 hover:bg-black/90">
            บันทึก
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import type { TabId, Appointment, Task, Project, NoteItem, FinanceItem, HealthEntry } from "../types";
import Header from "./Header";
import BottomNav from "./BottomNav";
import { APP_ID, loadLS, saveLS, todayYMD, uid } from "./storage";
import { Input, Modal, Pill, Textarea } from "./ui";

import WorkTab from "../tabs/WorkTab";
import MemoTab from "../tabs/MemoTab";
import FinanceTab from "../tabs/FinanceTab";
import HealthTab from "../tabs/HealthTab";

/** โหมดเพิ่มรายการรวม */
type AddMode = "นัด" | "งาน" | "โครงการ" | "โน้ต" | "บัญชี" | "สุขภาพ";

export default function MainApp() {
  const [tab, setTab] = useState<TabId>("work");

  // ---- Global data stores (LS) ----
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadLS(`${APP_ID}:appointments`, []));
  const [tasks, setTasks] = useState<Task[]>(() => loadLS(`${APP_ID}:tasks`, []));
  const [projects, setProjects] = useState<Project[]>(() => loadLS(`${APP_ID}:projects`, []));
  const [notes, setNotes] = useState<NoteItem[]>(() => loadLS(`${APP_ID}:notes`, []));
  const [finance, setFinance] = useState<FinanceItem[]>(() => loadLS(`${APP_ID}:finance`, []));
  const [health, setHealth] = useState<HealthEntry[]>(() => loadLS(`${APP_ID}:health`, []));

  useEffect(() => saveLS(`${APP_ID}:appointments`, appointments), [appointments]);
  useEffect(() => saveLS(`${APP_ID}:tasks`, tasks), [tasks]);
  useEffect(() => saveLS(`${APP_ID}:projects`, projects), [projects]);
  useEffect(() => saveLS(`${APP_ID}:notes`, notes), [notes]);
  useEffect(() => saveLS(`${APP_ID}:finance`, finance), [finance]);
  useEffect(() => saveLS(`${APP_ID}:health`, health), [health]);

  // ---- Add Modal ----
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("นัด");

  // เลือกแท็บอัตโนมัติ ตอนกด + (ให้ประสบการณ์ “เพิ่มจากหน้าที่อยู่”)
  useEffect(() => {
    if (!addOpen) return;
    const mapping: Record<TabId, AddMode> = {
      work: "นัด",
      memo: "โน้ต",
      finance: "บัญชี",
      health: "สุขภาพ",
    };
    setAddMode(mapping[tab]);
  }, [addOpen, tab]);

  // ---- Work: appointment form ----
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState(todayYMD());
  const [apptStart, setApptStart] = useState("09:00");
  const [apptEnd, setApptEnd] = useState("10:00");
  const [apptLocation, setApptLocation] = useState("");
  const [apptNote, setApptNote] = useState("");
  const [apptAddToGCal, setApptAddToGCal] = useState(true);

  // ---- Work: task form ----
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(todayYMD());
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("กลาง");

  // ---- Work: project form ----
  const [projName, setProjName] = useState("");
  const [projBudget, setProjBudget] = useState<number>(0);
  const [projTarget, setProjTarget] = useState("");
  const [projQuarters, setProjQuarters] = useState<Project["quarters"]>(["Q1"]);
  const [projTaskDraft, setProjTaskDraft] = useState("");
  const [projTasksDraft, setProjTasksDraft] = useState<Project["tasks"]>([]);

  // ---- Memo form ----
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteColor, setNoteColor] = useState("orange-100");

  // ---- Finance form ----
  const [finDate, setFinDate] = useState(todayYMD());
  const [finTitle, setFinTitle] = useState("");
  const [finType, setFinType] = useState<FinanceItem["type"]>("รายจ่าย");
  const [finAmount, setFinAmount] = useState<number>(0);
  const [finCategory, setFinCategory] = useState("");
  const [finNecessity, setFinNecessity] = useState<FinanceItem["necessity"]>("จำเป็น");
  const [finNote, setFinNote] = useState("");

  // ---- Health form (ตรงกับ HealthTab: moodLevel 1-5) ----
  const [hDate, setHDate] = useState(todayYMD());
  const [hSteps, setHSteps] = useState<number>(0);
  const [hWater, setHWater] = useState<number>(0);
  const [hTea, setHTea] = useState<number>(0);
  const [hSleep, setHSleep] = useState<number>(0);
  const [hMood, setHMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [hDetail, setHDetail] = useState("");

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
    setNoteColor("orange-100");

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
    setHMood(3);
    setHDetail("");
  };

  const buildGCalTemplateUrl = (p: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    details?: string;
    location?: string;
  }) => {
    // YYYY-MM-DD + HH:mm -> YYYYMMDDTHHMM00
    const fmt = (d: string, t: string) => `${d.replaceAll("-", "")}T${t.replaceAll(":", "")}00`;
    const start = fmt(p.date, p.startTime);
    const end = fmt(p.date, p.endTime);
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", p.title);
    url.searchParams.set("dates", `${start}/${end}`);
    if (p.details) url.searchParams.set("details", p.details);
    if (p.location) url.searchParams.set("location", p.location);
    return url.toString();
  };

  const saveAdd = () => {
    // 1) นัด
    if (addMode === "นัด") {
      if (!apptTitle.trim()) return alert("กรุณากรอกหัวข้อนัด");
      const item: Appointment = {
        id: uid("appt"),
        title: apptTitle.trim(),
        date: apptDate,
        startTime: apptStart,
        endTime: apptEnd,
        location: apptLocation.trim(),
        note: apptNote.trim(),
        createdAt: Date.now(),
      };
      setAppointments((p) => [item, ...p]);

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

    // 2) งาน
    if (addMode === "งาน") {
      if (!taskTitle.trim()) return alert("กรุณากรอกชื่องาน");
      const item: Task = {
        id: uid("task"),
        title: taskTitle.trim(),
        dueDate: taskDue,
        priority: taskPriority,
        done: false,
        createdAt: Date.now(),
      };
      setTasks((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }

    // 3) โครงการ
    if (addMode === "โครงการ") {
      if (!projName.trim()) return alert("กรุณากรอกชื่อโครงการ");
      const item: Project = {
        id: uid("proj"),
        name: projName.trim(),
        budget: Number(projBudget || 0),
        quarters: projQuarters.length ? projQuarters : ["Q1"],
        target: projTarget.trim(),
        tasks: projTasksDraft,
        createdAt: Date.now(),
      };
      setProjects((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }

    // 4) โน้ต
    if (addMode === "โน้ต") {
      if (!noteTitle.trim()) return alert("กรุณาใส่หัวข้อโน้ต");
      const item: NoteItem = {
        id: uid("note"),
        title: noteTitle.trim(),
        content: noteContent.trim(),
        color: noteColor,
        createdAt: Date.now(),
      };
      setNotes((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }

    // 5) บัญชี
    if (addMode === "บัญชี") {
      if (!finTitle.trim()) return alert("กรุณาใส่รายการ");
      if (!Number.isFinite(Number(finAmount))) return alert("จำนวนเงินไม่ถูกต้อง");
      const item: FinanceItem = {
        id: uid("fin"),
        date: finDate,
        title: finTitle.trim(),
        type: finType,
        amount: Number(finAmount || 0),
        category: finCategory.trim(),
        necessity: finNecessity,
        note: finNote.trim(),
        createdAt: Date.now(),
      };
      setFinance((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }

    // 6) สุขภาพ
    if (addMode === "สุขภาพ") {
      const it: HealthEntry = {
        id: uid("health"),
        date: hDate,
        steps: Number(hSteps || 0),
        waterGlasses: Number(hWater || 0),
        teaCoffeeGlasses: Number(hTea || 0),
        sleepHours: Number(hSleep || 0),
        moodLevel: hMood,
        detail: hDetail.trim(),
        createdAt: Date.now(),
      };

      // วันซ้ำ -> overwrite
      setHealth((prev) => {
        const idx = prev.findIndex((x) => x.date === hDate);
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = { ...prev[idx], ...it, id: prev[idx].id };
          return next;
        }
        return [it, ...prev];
      });

      setAddOpen(false);
      resetForms();
      return;
    }
  };

  // ---- render current tab ----
  const content = useMemo(() => {
    switch (tab) {
      case "work":
        return <WorkTab />;
      case "memo":
        return <MemoTab />;
      case "finance":
        return <FinanceTab />;
      case "health":
        return <HealthTab />;
      default:
        return <WorkTab />;
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-xl px-4 pt-4 pb-28">{content}</div>

      {/* ✅ แบบ B: กด + กลาง เปิด modal เพิ่มรายการ */}
      <BottomNav tab={tab} setTab={setTab} onAdd={() => setAddOpen(true)} />

      {/* Add Modal รวม */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForms();
        }}
        title="เพิ่มรายการใหม่"
        wide
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {(["นัด", "งาน", "โครงการ", "โน้ต", "บัญชี", "สุขภาพ"] as AddMode[]).map((m) => (
            <Pill key={m} active={addMode === m} onClick={() => setAddMode(m)}>
              {m}
            </Pill>
          ))}
        </div>

        {/* -------- นัด -------- */}
        {addMode === "นัด" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">หัวข้อนัด</div>
              <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} placeholder="เช่น ประชุม / นัดหมาย" />
            </div>

            <div className="grid sm:grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">วันที่</div>
                <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">เริ่ม</div>
                <Input type="time" value={apptStart} onChange={(e) => setApptStart(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">สิ้นสุด</div>
                <Input type="time" value={apptEnd} onChange={(e) => setApptEnd(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">สถานที่</div>
              <Input value={apptLocation} onChange={(e) => setApptLocation(e.target.value)} placeholder="เช่น ห้องประชุม/ออนไลน์" />
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">รายละเอียด</div>
              <Textarea rows={3} value={apptNote} onChange={(e) => setApptNote(e.target.value)} placeholder="โน้ตเพิ่มเติม (ถ้ามี)" />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
              <input type="checkbox" checked={apptAddToGCal} onChange={(e) => setApptAddToGCal(e.target.checked)} />
              เพิ่มเข้า Google Calendar หลังบันทึก (แนะนำ)
            </label>
          </div>
        ) : null}

        {/* -------- งาน -------- */}
        {addMode === "งาน" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">ชื่องาน</div>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="เช่น ส่งงาน / ทำสไลด์" />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">ครบกำหนด</div>
                <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ความสำคัญ</div>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="ต่ำ">ต่ำ</option>
                  <option value="กลาง">กลาง</option>
                  <option value="สูง">สูง</option>
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {/* -------- โครงการ -------- */}
        {addMode === "โครงการ" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">ชื่อโครงการ</div>
              <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="ชื่อโครงการ" />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">งบประมาณ (บาท)</div>
                <Input type="number" value={projBudget} onChange={(e) => setProjBudget(Number(e.target.value))} placeholder="0" />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ไตรมาส (เลือกได้หลายอัน)</div>
                <div className="flex flex-wrap gap-2">
                  {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => {
                    const active = projQuarters.includes(q);
                    return (
                      <Pill
                        key={q}
                        active={active}
                        onClick={() => {
                          setProjQuarters((prev) => {
                            if (prev.includes(q)) {
                              const next = prev.filter((x) => x !== q);
                              return next.length ? next : ["Q1"];
                            }
                            return [...prev, q];
                          });
                        }}
                      >
                        {q}
                      </Pill>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">เป้าหมาย</div>
              <Input value={projTarget} onChange={(e) => setProjTarget(e.target.value)} placeholder="เช่น บุคลากรทุกคน" />
            </div>

            <div className="rounded-2xl border bg-white p-3">
              <div className="font-medium text-gray-900 mb-2">กิจกรรมที่ต้องทำ (Task ของโครงการ)</div>
              <div className="flex gap-2">
                <Input
                  value={projTaskDraft}
                  onChange={(e) => setProjTaskDraft(e.target.value)}
                  placeholder="พิมพ์รายการ แล้วกด +"
                />
                <button
                  type="button"
                  className="rounded-2xl bg-black text-white px-4 hover:bg-black/90"
                  onClick={() => {
                    const t = projTaskDraft.trim();
                    if (!t) return;
                    setProjTasksDraft((p) => [...p, { id: uid("ptask"), title: t, done: false }]);
                    setProjTaskDraft("");
                  }}
                >
                  +
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {projTasksDraft.length === 0 ? (
                  <div className="text-sm text-gray-500">ยังไม่มีรายการกิจกรรม</div>
                ) : (
                  projTasksDraft.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-2">
                      <button
                        type="button"
                        className="text-left"
                        onClick={() =>
                          setProjTasksDraft((prev) =>
                            prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x))
                          )
                        }
                      >
                        <div className={t.done ? "line-through text-gray-400" : "text-gray-900"}>{t.title}</div>
                      </button>
                      <button
                        type="button"
                        className="text-sm text-gray-500 hover:underline"
                        onClick={() => setProjTasksDraft((prev) => prev.filter((x) => x.id !== t.id))}
                      >
                        ลบ
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* -------- โน้ต -------- */}
        {addMode === "โน้ต" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">หัวข้อโน้ต</div>
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="หัวข้อโน้ต" />
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">รายละเอียด</div>
              <Textarea rows={6} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="พิมพ์สิ่งที่อยากจดไว้..." />
            </div>

            <div className="text-xs text-gray-600 mb-1">สีโน้ต</div>
            <div className="flex flex-wrap gap-2">
              {["orange-100", "yellow-100", "emerald-100", "sky-100", "violet-100"].map((c) => (
                <Pill key={c} active={noteColor === c} onClick={() => setNoteColor(c)}>
                  {c}
                </Pill>
              ))}
            </div>
          </div>
        ) : null}

        {/* -------- บัญชี -------- */}
        {addMode === "บัญชี" ? (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">วันที่</div>
                <Input type="date" value={finDate} onChange={(e) => setFinDate(e.target.value)} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ประเภท</div>
                <select
                  value={finType}
                  onChange={(e) => setFinType(e.target.value as FinanceItem["type"])}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="รายรับ">รายรับ</option>
                  <option value="รายจ่าย">รายจ่าย</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">รายการ</div>
              <Input value={finTitle} onChange={(e) => setFinTitle(e.target.value)} placeholder="เช่น ค่ากาแฟ / เงินเดือน" />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">จำนวนเงิน</div>
                <Input type="number" value={finAmount} onChange={(e) => setFinAmount(Number(e.target.value))} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ความจำเป็น</div>
                <select
                  value={finNecessity}
                  onChange={(e) => setFinNecessity(e.target.value as FinanceItem["necessity"])}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
                >
                  <option value="จำเป็น">จำเป็น</option>
                  <option value="ฟุ่มเฟือย">ฟุ่มเฟือย</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">หมวดหมู่</div>
              <Input value={finCategory} onChange={(e) => setFinCategory(e.target.value)} placeholder="เช่น อาหาร / เดินทาง" />
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">หมายเหตุ</div>
              <Textarea rows={3} value={finNote} onChange={(e) => setFinNote(e.target.value)} placeholder="โน้ตเพิ่มเติม (ถ้ามี)" />
            </div>
          </div>
        ) : null}

        {/* -------- สุขภาพ -------- */}
        {addMode === "สุขภาพ" ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">วันที่</div>
              <Input type="date" value={hDate} onChange={(e) => setHDate(e.target.value)} />
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">ก้าว (steps)</div>
                <Input type="number" value={hSteps} onChange={(e) => setHSteps(Number(e.target.value))} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">นอน (ชั่วโมง)</div>
                <Input type="number" value={hSleep} onChange={(e) => setHSleep(Number(e.target.value))} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">น้ำ (แก้ว)</div>
                <Input type="number" value={hWater} onChange={(e) => setHWater(Number(e.target.value))} />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">ชา/กาแฟ (แก้ว)</div>
                <Input type="number" value={hTea} onChange={(e) => setHTea(Number(e.target.value))} />
              </div>
            </div>

            <div className="text-sm font-medium text-gray-700">ระดับอารมณ์</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 5, label: "🤩", text: "Excited" },
                { id: 4, label: "😊", text: "Happy" },
                { id: 3, label: "🥱", text: "Tired" },
                { id: 2, label: "🥲", text: "Cry" },
                { id: 1, label: "😣", text: "Bad" },
              ].map((m) => (
                <Pill key={m.id} active={hMood === m.id} onClick={() => setHMood(m.id as 1 | 2 | 3 | 4 | 5)}>
                  <span className="text-lg">{m.label}</span>
                  <span className="ml-1">{m.text}</span>
                </Pill>
              ))}
            </div>

            <div>
              <div className="text-xs text-gray-600 mb-1">เล่าอะไรสั้นๆ</div>
              <Textarea
                rows={3}
                value={hDetail}
                onChange={(e) => setHDetail(e.target.value)}
                placeholder="เช่น วันนี้เหนื่อย / กินแป้งเยอะ / เดินเยอะ 😊"
              />
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
            type="button"
          >
            ยกเลิก
          </button>
          <button
            onClick={saveAdd}
            className="flex-1 rounded-2xl bg-black text-white py-3 hover:bg-black/90"
            type="button"
          >
            บันทึก
          </button>
        </div>
      </Modal>
    </div>
  );
}

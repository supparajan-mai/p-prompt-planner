import { useEffect, useMemo, useState } from "react";
import type { Appointment, Project, Task } from "../app/types";
import { APP_ID, loadLS, saveLS, todayYMD, uid } from "../app/storage";
import { Input, Modal, Pill } from "../app/ui";

type AddMode = "นัด" | "งาน" | "โครงการ";

export default function WorkTab() {
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    loadLS(`${APP_ID}:appointments`, [])
  );
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadLS(`${APP_ID}:tasks`, [])
  );
  const [projects, setProjects] = useState<Project[]>(() =>
    loadLS(`${APP_ID}:projects`, [])
  );

  useEffect(() => saveLS(`${APP_ID}:appointments`, appointments), [appointments]);
  useEffect(() => saveLS(`${APP_ID}:tasks`, tasks), [tasks]);
  useEffect(() => saveLS(`${APP_ID}:projects`, projects), [projects]);

  const todaysAppointments = useMemo(() => {
    const t = todayYMD();
    return appointments
      .filter((a) => a.date === t)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments]);

  // --- add modal (เปิดด้วยปุ่ม + กลาง: เราจะปล่อย event ให้เรียกได้) ---
  const [addOpen, setAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>("งาน");

  useEffect(() => {
    const on = () => setAddOpen(true);
    window.addEventListener("PROMPT_ADD", on as any);
    return () => window.removeEventListener("PROMPT_ADD", on as any);
  }, []);

  // ---- forms ----
  const [apptTitle, setApptTitle] = useState("");
  const [apptDate, setApptDate] = useState(todayYMD());
  const [apptStart, setApptStart] = useState("09:00");
  const [apptEnd, setApptEnd] = useState("10:00");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(todayYMD());
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("กลาง");

  const [projName, setProjName] = useState("");
  const [projBudget, setProjBudget] = useState<number>(0);
  const [projTarget, setProjTarget] = useState("");
  const [projQuarters, setProjQuarters] = useState<Project["quarters"]>(["Q1"]);

  // project task quick add (ใน modal)
  const [projTaskText, setProjTaskText] = useState("");
  const [projTempTasks, setProjTempTasks] = useState<Project["tasks"]>([]);

  const resetForms = () => {
    setApptTitle("");
    setApptDate(todayYMD());
    setApptStart("09:00");
    setApptEnd("10:00");

    setTaskTitle("");
    setTaskDue(todayYMD());
    setTaskPriority("กลาง");

    setProjName("");
    setProjBudget(0);
    setProjTarget("");
    setProjQuarters(["Q1"]);
    setProjTaskText("");
    setProjTempTasks([]);
  };

  const save = () => {
    if (addMode === "นัด") {
      if (!apptTitle.trim()) return alert("กรุณากรอกหัวข้อนัด");
      const item: Appointment = {
        id: uid("appt"),
        title: apptTitle.trim(),
        date: apptDate,
        startTime: apptStart,
        endTime: apptEnd,
        location: "",
        note: "",
        createdAt: Date.now(),
      };
      setAppointments((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }

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

    if (addMode === "โครงการ") {
      if (!projName.trim()) return alert("กรุณากรอกชื่อโครงการ");
      const item: Project = {
        id: uid("proj"),
        name: projName.trim(),
        budget: Number(projBudget || 0),
        quarters: projQuarters.length ? projQuarters : ["Q1"],
        target: projTarget.trim(),
        tasks: projTempTasks,
        createdAt: Date.now(),
      };
      setProjects((p) => [item, ...p]);
      setAddOpen(false);
      resetForms();
      return;
    }
  };

  const toggleTaskDone = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTask = (id: string) => setTasks((p) => p.filter((t) => t.id !== id));
  const removeAppt = (id: string) => setAppointments((p) => p.filter((a) => a.id !== id));
  const removeProj = (id: string) => setProjects((p) => p.filter((x) => x.id !== id));

  // ---- project expand + toggle inside ----
  const [openProjId, setOpenProjId] = useState<string | null>(null);

  const projProgress = (p: Project) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.done).length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  };

  const toggleProjTask = (projId: string, taskId: string) => {
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

  const addProjTask = (projId: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projId
          ? { ...p, tasks: [...p.tasks, { id: uid("pt"), title: clean, done: false }] }
          : p
      )
    );
  };

  const [inlineTaskText, setInlineTaskText] = useState("");

  return (
    <div className="space-y-6 pb-28">
      <div className="px-4 pt-4">
        <div className="text-xl font-semibold text-gray-900">งาน</div>
        <div className="text-sm text-gray-500">จัดการนัด งาน และโครงการของวันนี้แบบเบาๆ</div>
      </div>

      {/* นัดหมายวันนี้ */}
      <div className="mx-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">นัดหมายวันนี้</div>
          <button
            className="text-sm text-orange-600 hover:underline"
            onClick={() => {
              setAddMode("นัด");
              setAddOpen(true);
            }}
          >
            เพิ่มนัด
          </button>
        </div>

        {todaysAppointments.length === 0 ? (
          <div className="text-sm text-gray-500">ยังไม่มีนัด 🗓️</div>
        ) : (
          <div className="space-y-2">
            {todaysAppointments.map((a) => (
              <div key={a.id} className="rounded-2xl bg-gray-50 p-3">
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-gray-500">
                  {a.startTime}–{a.endTime}
                </div>
                <button onClick={() => removeAppt(a.id)} className="text-xs text-gray-400 hover:underline mt-2">
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* โครงการ */}
      <div className="mx-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">โครงการ</div>
          <button
            className="text-sm text-orange-600 hover:underline"
            onClick={() => {
              setAddMode("โครงการ");
              setAddOpen(true);
            }}
          >
            สร้างโครงการ
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-sm text-gray-500">ยังไม่มีโครงการ</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {projects.map((p) => {
              const pr = projProgress(p);
              const expanded = openProjId === p.id;

              return (
                <div
                  key={p.id}
                  className="rounded-3xl p-4 text-white border border-white/10"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(2,6,23,1) 55%, rgba(17,24,39,1) 100%)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/70">
                        {p.quarters.join(", ")} • งบ {p.budget.toLocaleString()} บาท
                      </div>
                      <div className="text-lg font-semibold truncate">{p.name}</div>
                      {p.target ? (
                        <div className="text-sm text-white/75 mt-1 line-clamp-2">เป้าหมาย: {p.target}</div>
                      ) : null}
                    </div>

                    <button
                      onClick={() => removeProj(p.id)}
                      className="text-white/70 hover:text-white text-sm"
                      aria-label="remove project"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-white/70">
                      <div>PROGRESS</div>
                      <div className="text-orange-300 font-semibold">{pr.pct}%</div>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-400"
                        style={{ width: `${pr.pct}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-white/60">
                      {pr.done}/{pr.total} กิจกรรมสำเร็จ
                    </div>
                  </div>

                  <button
                    className="mt-4 w-full rounded-2xl bg-white/10 hover:bg-white/15 py-3 text-sm"
                    onClick={() => setOpenProjId(expanded ? null : p.id)}
                  >
                    {expanded ? "ซ่อนกิจกรรม" : "เข้าไปจัดการกิจกรรม"}
                  </button>

                  {expanded ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={inlineTaskText}
                          onChange={(e) => setInlineTaskText(e.target.value)}
                          placeholder="พิมพ์กิจกรรม แล้วกด +"
                          className="flex-1 rounded-2xl bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none"
                        />
                        <button
                          className="w-10 rounded-2xl bg-orange-500 hover:bg-orange-600"
                          onClick={() => {
                            addProjTask(p.id, inlineTaskText);
                            setInlineTaskText("");
                          }}
                        >
                          +
                        </button>
                      </div>

                      {p.tasks.length === 0 ? (
                        <div className="text-xs text-white/60">ยังไม่มีกิจกรรม</div>
                      ) : (
                        <div className="space-y-2">
                          {p.tasks.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => toggleProjTask(p.id, t.id)}
                              className="w-full text-left rounded-2xl bg-white/10 hover:bg-white/15 px-3 py-2"
                            >
                              <div className={t.done ? "text-white/60 line-through" : "text-white"}>
                                {t.title}
                              </div>
                              <div className="text-[11px] text-white/50">{t.done ? "เสร็จแล้ว" : "กำลังทำอยู่"}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* งานทั่วไป */}
      <div className="mx-4 rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">งานทั่วไป</div>
          <button
            className="text-sm text-orange-600 hover:underline"
            onClick={() => {
              setAddMode("งาน");
              setAddOpen(true);
            }}
          >
            เพิ่มงาน
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="text-sm text-gray-500">ยังไม่มีงาน</div>
        ) : (
          <div className="space-y-2">
            {tasks
              .slice()
              .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
              .map((t) => (
                <div key={t.id} className="rounded-2xl bg-gray-50 p-3 flex items-center justify-between">
                  <button onClick={() => toggleTaskDone(t.id)} className="text-left flex-1">
                    <div className={t.done ? "line-through text-gray-400" : "font-medium"}>
                      {t.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      ครบกำหนด {t.dueDate} • {t.priority}
                    </div>
                  </button>
                  <button onClick={() => removeTask(t.id)} className="text-sm text-gray-400 hover:underline">
                    ลบ
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForms();
        }}
        title="เพิ่มรายการใหม่"
        wide={addMode === "โครงการ"}
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {(["นัด", "งาน", "โครงการ"] as AddMode[]).map((m) => (
            <Pill key={m} active={addMode === m} onClick={() => setAddMode(m)}>
              {m}
            </Pill>
          ))}
        </div>

        {addMode === "นัด" ? (
          <div className="space-y-3">
            <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} placeholder="หัวข้อเรื่อง / รายการนัด" />
            <div className="grid sm:grid-cols-3 gap-2">
              <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
              <Input type="time" value={apptStart} onChange={(e) => setApptStart(e.target.value)} />
              <Input type="time" value={apptEnd} onChange={(e) => setApptEnd(e.target.value)} />
            </div>
          </div>
        ) : null}

        {addMode === "งาน" ? (
          <div className="space-y-3">
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="ชื่องาน" />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as Task["priority"])}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <option value="ต่ำ">ต่ำ</option>
                <option value="กลาง">กลาง</option>
                <option value="สูง">สูง</option>
              </select>
            </div>
          </div>
        ) : null}

        {addMode === "โครงการ" ? (
          <div className="space-y-3">
            <Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="ชื่อโครงการ" />
            <Input
              type="number"
              value={projBudget}
              onChange={(e) => setProjBudget(Number(e.target.value))}
              placeholder="งบประมาณ (บาท)"
            />
            <Input value={projTarget} onChange={(e) => setProjTarget(e.target.value)} placeholder="เป้าหมายคือใคร / กลุ่มเป้าหมาย" />

            <div className="text-sm font-medium">ไตรมาส (เลือกได้หลายอัน)</div>
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

            <div className="pt-2">
              <div className="text-sm font-semibold mb-2">กิจกรรมที่ต้องทำ (ใส่ไว้ก่อนก็ได้)</div>
              <div className="flex gap-2">
                <input
                  value={projTaskText}
                  onChange={(e) => setProjTaskText(e.target.value)}
                  placeholder="พิมพ์กิจกรรม แล้วกด +"
                  className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none"
                />
                <button
                  className="w-12 rounded-2xl bg-black text-white text-xl"
                  onClick={() => {
                    const clean = projTaskText.trim();
                    if (!clean) return;
                    setProjTempTasks((p) => [...p, { id: uid("pt"), title: clean, done: false }]);
                    setProjTaskText("");
                  }}
                  type="button"
                >
                  +
                </button>
              </div>
              {projTempTasks.length === 0 ? (
                <div className="text-sm text-gray-500 mt-2">ยังไม่มีรายการกิจกรรม</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {projTempTasks.map((t) => (
                    <div key={t.id} className="rounded-2xl bg-gray-50 px-3 py-2 text-sm">
                      {t.title}
                    </div>
                  ))}
                </div>
              )}
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
            onClick={save}
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
